import { Platform } from 'react-native';
import {
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  syncIOS,
  type Purchase,
} from 'expo-iap';
import * as appleIapApi from '../api/appleIapApi';
import { logIapPurchaseIntent, type IapFeatureKind } from '../config/iapCatalog';
import {
  iapLogFlowEnd,
  iapLogFlowStart,
  iapLogPurchaseSnapshot,
  iapLogStep,
  iapLogWait,
} from '../utils/appleIapDebug';
import { logAppleIapError, mapAppleIapUserMessage } from '../utils/appleIapErrors';

type PurchaseKind = 'library' | 'ai_assistant' | 'provider_subscription' | 'video' | 'ad';

type PendingPurchase = {
  productId: string;
  kind: PurchaseKind;
  slug?: string;
  planUuid?: string;
  adUuid?: string;
  retryCount: number;
  startedAtMs: number;
  resolve: (value: void) => void;
  reject: (reason: Error) => void;
};

type ApplePurchasePayload = {
  transactionId: string;
  originalTransactionId?: string;
  productId: string;
};

function isConsumableKind(kind: PurchaseKind): boolean {
  return kind === 'ad' || kind === 'library';
}

function isSubscriptionKind(kind: PurchaseKind): boolean {
  return kind === 'ai_assistant' || kind === 'provider_subscription';
}

let connectionReady = false;
let listenersAttached = false;
let pending: PendingPurchase | null = null;
let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

/** After this age a silent StoreKit session is treated as abandoned. */
const STALE_PURCHASE_MS = 2 * 60 * 1000;
/** Hard cap so "Processing…" cannot hang forever. */
const PURCHASE_TIMEOUT_MS = 5 * 60 * 1000;

export function isApplePurchaseInProgress(): boolean {
  return pending !== null;
}

function clearPendingTimeout(): void {
  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
    pendingTimeout = null;
  }
}

function abandonPendingPurchase(reason: string): boolean {
  if (!pending) {
    return false;
  }

  const current = pending;
  pending = null;
  clearPendingTimeout();
  iapLogStep('purchase.abandoned', { reason, ageMs: Date.now() - current.startedAtMs });
  iapLogFlowEnd('error', reason);
  current.reject(new Error(reason));
  return true;
}

/** Clears a hung purchase lock (e.g. after StoreKit never called back). */
export function resetApplePurchaseInProgress(): void {
  abandonPendingPurchase('Purchase reset. Please try again.');
}

function clearStuckPendingIfStale(): boolean {
  if (!pending) {
    return false;
  }

  const ageMs = Date.now() - pending.startedAtMs;
  if (ageMs < STALE_PURCHASE_MS) {
    return false;
  }

  abandonPendingPurchase('Previous purchase timed out. Please try again or use Restore Purchases.');
  return true;
}

function schedulePendingTimeout(current: PendingPurchase): void {
  clearPendingTimeout();
  pendingTimeout = setTimeout(() => {
    if (pending !== current) {
      return;
    }
    abandonPendingPurchase('Purchase timed out. Please try again or use Restore Purchases.');
  }, PURCHASE_TIMEOUT_MS);
}

function settlePendingFailure(current: PendingPurchase, error: Error): void {
  clearPendingTimeout();
  pending = null;
  current.reject(error);
}

function purchaseTransactionId(purchase: Purchase): string {
  const ios = purchase as Purchase & { transactionId?: string };
  return String(ios.transactionId ?? purchase.id ?? '').trim();
}

function purchaseOriginalTransactionId(purchase: Purchase): string | undefined {
  const ios = purchase as Purchase & { originalTransactionIdentifierIOS?: string; originalTransactionId?: string };
  const value = ios.originalTransactionIdentifierIOS ?? ios.originalTransactionId;
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed !== '' ? trimmed : undefined;
}

function isActiveSubscriptionPurchase(purchase: Purchase): boolean {
  const ios = purchase as Purchase & {
    expirationDateIOS?: number;
    environmentIOS?: string;
    transactionDate?: number;
  };

  if (ios.expirationDateIOS) {
    return ios.expirationDateIOS > Date.now();
  }

  if (ios.environmentIOS === 'Sandbox' && ios.transactionDate) {
    const dayMs = 24 * 60 * 60 * 1000;
    return Date.now() - ios.transactionDate < dayMs;
  }

  return true;
}

function toUserFacingError(error: unknown, context: string): Error {
  const friendly = mapAppleIapUserMessage(error, context);
  if (friendly === null) {
    return new Error('Purchase cancelled.');
  }
  return new Error(friendly);
}

function isInactiveSubscriptionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /inactive subscription/i.test(message);
}

function isUserCancelledError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /cancelled|canceled|user cancelled/i.test(message);
}

async function drainStaleIosTransactions(productId?: string): Promise<void> {
  if (Platform.OS !== 'ios') {
    return;
  }

  iapLogStep('drainStale.syncIOS');
  await syncIOS().catch((error) => {
    iapLogStep('drainStale.syncIOS.failed', { message: error instanceof Error ? error.message : String(error) });
    return undefined;
  });

  iapLogStep('drainStale.getAvailablePurchases', { filterProductId: productId ?? 'all' });
  const purchases = await getAvailablePurchases({
    alsoPublishToEventListenerIOS: false,
    onlyIncludeActiveItemsIOS: false,
  });

  iapLogStep('drainStale.found', { count: purchases.length });

  let finished = 0;
  let skippedActive = 0;
  let skippedOtherProduct = 0;

  for (const purchase of purchases) {
    if (productId && purchase.productId !== productId) {
      skippedOtherProduct += 1;
      continue;
    }

    const ios = purchase as Purchase & { expirationDateIOS?: number };
    if (ios.expirationDateIOS !== undefined && isActiveSubscriptionPurchase(purchase)) {
      skippedActive += 1;
      continue;
    }

    try {
      iapLogPurchaseSnapshot(purchase as unknown as Record<string, unknown>, 'drain-finish');
      await finishTransaction({ purchase, isConsumable: false });
      finished += 1;
    } catch (error) {
      logAppleIapError('drainStale', error);
    }
  }

  iapLogStep('drainStale.done', { finished, skippedActive, skippedOtherProduct });
}

async function ensureProductAvailable(productId: string, kind: PurchaseKind): Promise<void> {
  const type = isSubscriptionKind(kind) ? 'subs' : 'in-app';
  iapLogStep('fetchProducts.start', { productId, type });
  const products = await fetchProducts({ skus: [productId], type });
  if (!Array.isArray(products) || products.length === 0) {
    iapLogStep('fetchProducts.notFound', { productId, type });
    throw new Error(`Product not found in App Store: ${productId}`);
  }
  const first = products[0] as { id?: string; title?: string; displayPrice?: string };
  iapLogStep('fetchProducts.ok', {
    productId,
    title: first?.title,
    displayPrice: first?.displayPrice,
    count: products.length,
  });
}

async function ensureConnection(): Promise<void> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple In-App Purchase is only available on iOS.');
  }
  if (!connectionReady) {
    iapLogStep('initConnection.start');
    await initConnection();
    connectionReady = true;
    iapLogStep('initConnection.ok');
    await drainStaleIosTransactions();
  } else {
    iapLogStep('initConnection.skip', { reason: 'already connected' });
  }
  if (!listenersAttached) {
    purchaseUpdatedListener(handlePurchaseUpdated);
    purchaseErrorListener(handlePurchaseError);
    listenersAttached = true;
    iapLogStep('listeners.attached');
  } else {
    iapLogStep('listeners.skip', { reason: 'already attached' });
  }
}

function buildApplePayload(purchase: Purchase): ApplePurchasePayload {
  const transactionId = purchaseTransactionId(purchase);
  const productId = String(purchase.productId ?? '').trim();

  return {
    transactionId,
    originalTransactionId: purchaseOriginalTransactionId(purchase),
    productId,
  };
}

async function confirmWithBackend(current: PendingPurchase, payload: ApplePurchasePayload): Promise<void> {
  const { transactionId, originalTransactionId, productId } = payload;

  iapLogStep('backend.confirm.start', {
    kind: current.kind,
    planUuid: current.planUuid,
    slug: current.slug,
    adUuid: current.adUuid,
    transactionId,
    originalTransactionId: originalTransactionId ?? '—',
    productId,
  });

  if (current.kind === 'library' && current.slug) {
    const res = await appleIapApi.confirmLibraryApplePurchase(current.slug, {
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      iapLogStep('backend.confirm.failed', { kind: 'library', message: res.message });
      throw new Error(res.message);
    }
    iapLogStep('backend.confirm.ok', { kind: 'library' });
    return;
  }

  if (current.kind === 'ai_assistant') {
    const res = await appleIapApi.confirmAiAssistantApplePurchase({
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      iapLogStep('backend.confirm.failed', { kind: 'ai_assistant', message: res.message });
      throw new Error(res.message);
    }
    iapLogStep('backend.confirm.ok', { kind: 'ai_assistant' });
    return;
  }

  if (current.kind === 'provider_subscription' && current.planUuid) {
    const res = await appleIapApi.confirmProviderApplePurchase(current.planUuid, {
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      iapLogStep('backend.confirm.failed', {
        kind: 'provider_subscription',
        planUuid: current.planUuid,
        message: res.message,
      });
      throw new Error(res.message);
    }
    iapLogStep('backend.confirm.ok', { kind: 'provider_subscription', planUuid: current.planUuid });
    return;
  }

  if (current.kind === 'video' && current.slug) {
    const res = await appleIapApi.confirmVideoApplePurchase(current.slug, {
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      iapLogStep('backend.confirm.failed', { kind: 'video', message: res.message });
      throw new Error(res.message);
    }
    iapLogStep('backend.confirm.ok', { kind: 'video' });
    return;
  }

  if (current.kind === 'ad' && current.adUuid) {
    const res = await appleIapApi.confirmAdApplePurchase(current.adUuid, {
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      iapLogStep('backend.confirm.failed', { kind: 'ad', message: res.message });
      throw new Error(res.message);
    }
    iapLogStep('backend.confirm.ok', { kind: 'ad' });
  }
}

async function startStorePurchase(current: PendingPurchase): Promise<void> {
  const type = isSubscriptionKind(current.kind) ? 'subs' : 'in-app';
  iapLogStep('requestPurchase.start', { productId: current.productId, type });
  await requestPurchase({
    type,
    request: {
      apple: { sku: current.productId },
    },
  });
  iapLogWait('requestPurchase.returned', {
    note: 'StoreKit sheet may still be open; waiting for purchaseUpdatedListener',
    productId: current.productId,
  });
}

async function retryPurchaseAfterInactiveTransaction(current: PendingPurchase): Promise<void> {
  if (current.retryCount >= 1) {
    throw new Error('Finished an inactive subscription transaction. Please retry the purchase.');
  }

  current.retryCount += 1;
  iapLogStep('retry.inactiveSubscription', { retryCount: current.retryCount, productId: current.productId });
  await drainStaleIosTransactions(current.productId);
  await startStorePurchase(current);
}

async function handlePurchaseUpdated(purchase: Purchase): Promise<void> {
  const current = pending;

  iapLogStep('purchaseUpdated.received');
  iapLogPurchaseSnapshot(purchase as unknown as Record<string, unknown>);

  if (!current) {
    iapLogStep('purchaseUpdated.orphan', { note: 'No pending purchase; finishing transaction only' });
    const ios = purchase as Purchase & { expirationDateIOS?: number };
    const isExpiredSubscription = ios.expirationDateIOS !== undefined && !isActiveSubscriptionPurchase(purchase);

    try {
      await finishTransaction({ purchase, isConsumable: false });
      iapLogStep('purchaseUpdated.orphan.finished');
    } catch (error) {
      if (!isExpiredSubscription) {
        logAppleIapError('orphan-finish', error);
      }
    }
    return;
  }

  const incomingProductId = String(purchase.productId ?? '').trim();
  if (incomingProductId && incomingProductId !== current.productId) {
    iapLogStep('purchaseUpdated.ignored_product_mismatch', {
      expected: current.productId,
      incoming: incomingProductId,
      note: 'Pending purchase still waiting — this can cause a hang if StoreKit never sends the expected product',
    });
    return;
  }

  const payload = buildApplePayload(purchase);
  if (!payload.transactionId) {
    settlePendingFailure(current, new Error('Missing transaction ID from App Store.'));
    iapLogFlowEnd('error', 'Missing transaction ID from App Store.');
    return;
  }

  if (isSubscriptionKind(current.kind) && purchase.productId === current.productId && !isActiveSubscriptionPurchase(purchase)) {
    iapLogStep('purchaseUpdated.inactiveSubscription', { productId: current.productId });
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch (error) {
      logAppleIapError('finishInactive', error);
    }

    try {
      await retryPurchaseAfterInactiveTransaction(current);
    } catch (error) {
      const friendly = toUserFacingError(error, 'inactive-subscription');
      settlePendingFailure(current, friendly);
      iapLogFlowEnd('error', friendly.message);
    }
    return;
  }

  try {
    await confirmWithBackend(current, payload);
    iapLogStep('finishTransaction.start', { isConsumable: isConsumableKind(current.kind) });
    await finishTransaction({ purchase, isConsumable: isConsumableKind(current.kind) });
    clearPendingTimeout();
    pending = null;
    iapLogFlowEnd('success');
    current.resolve();
  } catch (error) {
    const friendly = toUserFacingError(error, 'confirm');
    settlePendingFailure(current, friendly);
    iapLogFlowEnd('error', friendly.message);
  }
}

function handlePurchaseError(error: { message?: string }): void {
  const current = pending;
  iapLogStep('purchaseError.received', { message: error?.message ?? 'unknown' });

  if (!current) {
    iapLogStep('purchaseError.ignored', { reason: 'no pending purchase' });
    return;
  }

  if (isUserCancelledError(error)) {
    settlePendingFailure(current, new Error('Purchase cancelled.'));
    iapLogFlowEnd('cancelled');
    return;
  }

  if (isInactiveSubscriptionError(error)) {
    iapLogStep('purchaseError.inactiveSubscription.retry');
    void (async () => {
      try {
        await retryPurchaseAfterInactiveTransaction(current);
      } catch (retryError) {
        const friendly = toUserFacingError(retryError, 'inactive-subscription-retry');
        settlePendingFailure(current, friendly);
        iapLogFlowEnd('error', friendly.message);
      }
    })();
    return;
  }

  const friendly = toUserFacingError(error, 'purchase-error');
  settlePendingFailure(current, friendly);
  iapLogFlowEnd('error', friendly.message);
}

function runPurchase(
  params: Omit<PendingPurchase, 'resolve' | 'reject' | 'retryCount'>,
  options?: { feature?: IapFeatureKind; priceCents?: number | null },
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    clearStuckPendingIfStale();

    if (pending) {
      reject(toUserFacingError(new Error('Another purchase is already in progress.'), 'concurrent'));
      return;
    }

    if (options?.feature) {
      logIapPurchaseIntent(options.feature, params.productId, options.priceCents);
    }

    iapLogFlowStart(`purchase:${params.kind}`, {
      productId: params.productId,
      planUuid: params.planUuid,
      slug: params.slug,
      adUuid: params.adUuid,
      feature: options?.feature,
      priceCents: options?.priceCents,
    });

    const current: PendingPurchase = {
      ...params,
      retryCount: 0,
      startedAtMs: Date.now(),
      resolve,
      reject,
    };
    pending = current;
    schedulePendingTimeout(current);

    try {
      await ensureConnection();
      await drainStaleIosTransactions(params.productId);
      await ensureProductAvailable(params.productId, params.kind);
      await startStorePurchase(current);
    } catch (error) {
      if (isInactiveSubscriptionError(error)) {
        try {
          await retryPurchaseAfterInactiveTransaction(current);
          return;
        } catch (retryError) {
          const friendly = toUserFacingError(retryError, 'inactive-subscription-start');
          settlePendingFailure(current, friendly);
          iapLogFlowEnd('error', friendly.message);
          reject(friendly);
          return;
        }
      }
      const friendly = toUserFacingError(error, 'start');
      settlePendingFailure(current, friendly);
      iapLogFlowEnd('error', friendly.message);
      reject(friendly);
    }
  });
}

export async function purchaseLibraryTitle(
  slug: string,
  appleProductId: string,
  priceCents?: number | null,
): Promise<void> {
  return runPurchase(
    {
      productId: appleProductId,
      kind: 'library',
      slug,
    },
    { feature: 'library', priceCents },
  );
}

export async function purchaseAiAssistantSubscription(
  appleProductId: string,
  priceCents?: number | null,
): Promise<void> {
  return runPurchase(
    {
      productId: appleProductId,
      kind: 'ai_assistant',
    },
    { feature: 'ai_assistant', priceCents },
  );
}

export async function purchaseProviderSubscription(
  planUuid: string,
  appleProductId: string,
  priceCents?: number | null,
): Promise<void> {
  return runPurchase(
    {
      productId: appleProductId,
      kind: 'provider_subscription',
      planUuid,
    },
    { feature: 'provider_subscription', priceCents },
  );
}

export async function purchaseVideo(
  slug: string,
  appleProductId: string,
  priceCents?: number | null,
): Promise<void> {
  return runPurchase(
    {
      productId: appleProductId,
      kind: 'video',
      slug,
    },
    { feature: 'video', priceCents },
  );
}

export async function purchaseAdPublish(
  adUuid: string,
  appleProductId: string,
  priceCents?: number | null,
): Promise<void> {
  return runPurchase(
    {
      productId: appleProductId,
      kind: 'ad',
      adUuid,
    },
    { feature: 'ad', priceCents },
  );
}

export async function restoreApplePurchasesOnDevice(): Promise<{
  library_restored: number;
  ai_assistant_active: boolean;
  provider_subscription_active: boolean;
  videos_restored: number;
  errors: string[];
}> {
  clearStuckPendingIfStale();
  if (pending) {
    abandonPendingPurchase('Cleared for Restore Purchases.');
  }

  iapLogFlowStart('restore');
  await ensureConnection();
  await restorePurchases();
  const purchases = await getAvailablePurchases({
    alsoPublishToEventListenerIOS: false,
    onlyIncludeActiveItemsIOS: false,
  });

  const library: appleIapApi.RestoreLibraryEntry[] = [];
  const providerSubscriptions: appleIapApi.RestoreProductEntry[] = [];
  const videos: appleIapApi.RestoreProductEntry[] = [];
  let aiAssistantTx: string | undefined;

  const configRes = await appleIapApi.getIapConfig();
  const config = configRes.success ? configRes.data : undefined;
  const aiProductId = config?.ai_assistant_product_id;
  const providerPrefix = config?.provider_product_prefix ?? 'com.immigrantknowhow.ikhapp.provider';
  const providerMonthlyId = config?.provider_monthly_product_id?.trim() ?? '';
  const providerYearlyId = config?.provider_yearly_product_id?.trim() ?? '';
  const videoPrefix = config?.video_product_prefix ?? 'com.immigrantknowhow.ikhapp.video';
  const libraryPrefix = config?.library_product_prefix ?? 'com.immigrantknowhow.ikhapp.library';
  const libraryEbookProductId = config?.library_ebook_product_id?.trim() ?? '';

  for (const purchase of purchases) {
    const transactionId = purchaseTransactionId(purchase);
    const productId = purchase.productId;
    if (!transactionId || !productId) continue;

    if (aiProductId && productId === aiProductId) {
      if (isActiveSubscriptionPurchase(purchase)) {
        aiAssistantTx = transactionId;
      }
      continue;
    }

    if (
      productId.startsWith(`${providerPrefix}.`) ||
      (providerMonthlyId !== '' && productId === providerMonthlyId) ||
      (providerYearlyId !== '' && productId === providerYearlyId)
    ) {
      if (isActiveSubscriptionPurchase(purchase)) {
        providerSubscriptions.push({ transaction_id: transactionId, product_id: productId });
      }
      continue;
    }

    if (productId.startsWith(`${videoPrefix}.`)) {
      videos.push({ transaction_id: transactionId, product_id: productId });
      continue;
    }

    if (libraryEbookProductId !== '' && productId === libraryEbookProductId) {
      continue;
    }

    if (productId.startsWith(`${libraryPrefix}.`)) {
      library.push({ transaction_id: transactionId, product_id: productId });
    }
  }

  const res = await appleIapApi.restoreApplePurchases({
    library,
    ...(aiAssistantTx ? { ai_assistant: { transaction_id: aiAssistantTx } } : {}),
    ...(providerSubscriptions.length > 0 ? { provider_subscriptions: providerSubscriptions } : {}),
    ...(videos.length > 0 ? { videos } : {}),
  });

  if (!res.success) {
    iapLogFlowEnd('error', res.message);
    throw toUserFacingError(new Error(res.message), 'restore');
  }

  const result = {
    library_restored: res.data?.library_restored ?? 0,
    ai_assistant_active: res.data?.ai_assistant_active ?? false,
    provider_subscription_active: res.data?.provider_subscription_active ?? false,
    videos_restored: res.data?.videos_restored ?? 0,
    errors: res.data?.errors ?? [],
  };
  iapLogFlowEnd('success', JSON.stringify(result));
  return result;
}
