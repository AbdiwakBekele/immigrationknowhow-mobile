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
import { logAppleIapError, mapAppleIapUserMessage } from '../utils/appleIapErrors';

type PurchaseKind = 'library' | 'ai_assistant' | 'provider_subscription' | 'video' | 'ad';

type PendingPurchase = {
  productId: string;
  kind: PurchaseKind;
  slug?: string;
  planUuid?: string;
  adUuid?: string;
  retryCount: number;
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

export function isApplePurchaseInProgress(): boolean {
  return pending !== null;
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

  await syncIOS().catch(() => undefined);

  const purchases = await getAvailablePurchases({
    alsoPublishToEventListenerIOS: false,
    onlyIncludeActiveItemsIOS: false,
  });

  for (const purchase of purchases) {
    if (productId && purchase.productId !== productId) {
      continue;
    }

    const ios = purchase as Purchase & { expirationDateIOS?: number };
    if (ios.expirationDateIOS !== undefined && isActiveSubscriptionPurchase(purchase)) {
      continue;
    }

    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch (error) {
      logAppleIapError('drainStale', error);
    }
  }
}

async function ensureProductAvailable(productId: string, kind: PurchaseKind): Promise<void> {
  const type = isSubscriptionKind(kind) ? 'subs' : 'in-app';
  const products = await fetchProducts({ skus: [productId], type });
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error(`Product not found in App Store: ${productId}`);
  }
}

async function ensureConnection(): Promise<void> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple In-App Purchase is only available on iOS.');
  }
  if (!connectionReady) {
    await initConnection();
    connectionReady = true;
    await drainStaleIosTransactions();
  }
  if (!listenersAttached) {
    purchaseUpdatedListener(handlePurchaseUpdated);
    purchaseErrorListener(handlePurchaseError);
    listenersAttached = true;
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

  if (current.kind === 'library' && current.slug) {
    const res = await appleIapApi.confirmLibraryApplePurchase(current.slug, {
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      throw new Error(res.message);
    }
    return;
  }

  if (current.kind === 'ai_assistant') {
    const res = await appleIapApi.confirmAiAssistantApplePurchase({
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      throw new Error(res.message);
    }
    return;
  }

  if (current.kind === 'provider_subscription' && current.planUuid) {
    const res = await appleIapApi.confirmProviderApplePurchase(current.planUuid, {
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      throw new Error(res.message);
    }
    return;
  }

  if (current.kind === 'video' && current.slug) {
    const res = await appleIapApi.confirmVideoApplePurchase(current.slug, {
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      throw new Error(res.message);
    }
    return;
  }

  if (current.kind === 'ad' && current.adUuid) {
    const res = await appleIapApi.confirmAdApplePurchase(current.adUuid, {
      transaction_id: transactionId,
      original_transaction_id: originalTransactionId,
      product_id: productId,
    });
    if (!res.success) {
      throw new Error(res.message);
    }
  }
}

async function startStorePurchase(current: PendingPurchase): Promise<void> {
  await requestPurchase({
    type: isSubscriptionKind(current.kind) ? 'subs' : 'in-app',
    request: {
      apple: { sku: current.productId },
    },
  });
}

async function retryPurchaseAfterInactiveTransaction(current: PendingPurchase): Promise<void> {
  if (current.retryCount >= 1) {
    throw new Error('Finished an inactive subscription transaction. Please retry the purchase.');
  }

  current.retryCount += 1;
  await drainStaleIosTransactions(current.productId);
  await startStorePurchase(current);
}

async function handlePurchaseUpdated(purchase: Purchase): Promise<void> {
  const current = pending;

  if (!current) {
    const ios = purchase as Purchase & { expirationDateIOS?: number };
    const isExpiredSubscription = ios.expirationDateIOS !== undefined && !isActiveSubscriptionPurchase(purchase);

    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch (error) {
      if (!isExpiredSubscription) {
        logAppleIapError('orphan-finish', error);
      }
    }
    return;
  }

  const incomingProductId = String(purchase.productId ?? '').trim();
  if (incomingProductId && incomingProductId !== current.productId) {
    // Ignore unrelated App Store events (e.g. subscription renewals) during an active purchase.
    return;
  }

  const payload = buildApplePayload(purchase);
  if (!payload.transactionId) {
    pending = null;
    current.reject(new Error('Missing transaction ID from App Store.'));
    return;
  }

  if (isSubscriptionKind(current.kind) && purchase.productId === current.productId && !isActiveSubscriptionPurchase(purchase)) {
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch (error) {
      logAppleIapError('finishInactive', error);
    }

    try {
      await retryPurchaseAfterInactiveTransaction(current);
    } catch (error) {
      pending = null;
      current.reject(toUserFacingError(error, 'inactive-subscription'));
    }
    return;
  }

  try {
    await confirmWithBackend(current, payload);
    await finishTransaction({ purchase, isConsumable: isConsumableKind(current.kind) });
    pending = null;
    current.resolve();
  } catch (error) {
    pending = null;
    current.reject(toUserFacingError(error, 'confirm'));
  }
}

function handlePurchaseError(error: { message?: string }): void {
  const current = pending;
  if (!current) {
    return;
  }

  if (isUserCancelledError(error)) {
    pending = null;
    current.reject(new Error('Purchase cancelled.'));
    return;
  }

  if (isInactiveSubscriptionError(error)) {
    void (async () => {
      try {
        await retryPurchaseAfterInactiveTransaction(current);
      } catch (retryError) {
        pending = null;
        current.reject(toUserFacingError(retryError, 'inactive-subscription-retry'));
      }
    })();
    return;
  }

  pending = null;
  current.reject(toUserFacingError(error, 'purchase-error'));
}

function runPurchase(
  params: Omit<PendingPurchase, 'resolve' | 'reject' | 'retryCount'>,
  options?: { feature?: IapFeatureKind; priceCents?: number | null },
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (pending) {
      reject(toUserFacingError(new Error('Another purchase is already in progress.'), 'concurrent'));
      return;
    }

    if (options?.feature) {
      logIapPurchaseIntent(options.feature, params.productId, options.priceCents);
    }

    const current: PendingPurchase = { ...params, retryCount: 0, resolve, reject };
    pending = current;

    try {
      await ensureConnection();
      await drainStaleIosTransactions(params.productId);
      await ensureProductAvailable(params.productId, params.kind);
      await startStorePurchase(current);
    } catch (error) {
      pending = null;
      if (isInactiveSubscriptionError(error)) {
        try {
          pending = current;
          await retryPurchaseAfterInactiveTransaction(current);
          return;
        } catch (retryError) {
          pending = null;
          reject(toUserFacingError(retryError, 'inactive-subscription-start'));
          return;
        }
      }
      reject(toUserFacingError(error, 'start'));
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
    throw toUserFacingError(new Error(res.message), 'restore');
  }

  return {
    library_restored: res.data?.library_restored ?? 0,
    ai_assistant_active: res.data?.ai_assistant_active ?? false,
    provider_subscription_active: res.data?.provider_subscription_active ?? false,
    videos_restored: res.data?.videos_restored ?? 0,
    errors: res.data?.errors ?? [],
  };
}
