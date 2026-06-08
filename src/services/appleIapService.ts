import { Platform } from 'react-native';
import {
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from 'expo-iap';
import * as appleIapApi from '../api/appleIapApi';

type PurchaseKind = 'library' | 'ai_assistant' | 'provider_subscription' | 'video' | 'ad';

type PendingPurchase = {
  productId: string;
  kind: PurchaseKind;
  slug?: string;
  planUuid?: string;
  adUuid?: string;
  resolve: (value: void) => void;
  reject: (reason: Error) => void;
};

function isConsumableKind(kind: PurchaseKind): boolean {
  return kind === 'ad';
}

let connectionReady = false;
let listenersAttached = false;
let pending: PendingPurchase | null = null;

function purchaseTransactionId(purchase: Purchase): string {
  const ios = purchase as Purchase & { transactionId?: string };
  return String(ios.transactionId ?? purchase.id ?? '').trim();
}

async function ensureConnection(): Promise<void> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple In-App Purchase is only available on iOS.');
  }
  if (!connectionReady) {
    await initConnection();
    connectionReady = true;
  }
  if (!listenersAttached) {
    purchaseUpdatedListener(handlePurchaseUpdated);
    purchaseErrorListener((error) => {
      const current = pending;
      pending = null;
      if (current) {
        current.reject(new Error(error.message || 'Purchase failed'));
      }
    });
    listenersAttached = true;
  }
}

async function handlePurchaseUpdated(purchase: Purchase): Promise<void> {
  const current = pending;
  if (!current) {
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch {
      // ignore orphaned transactions
    }
    return;
  }

  const transactionId = purchaseTransactionId(purchase);
  if (!transactionId) {
    current.reject(new Error('Missing transaction ID from App Store.'));
    pending = null;
    return;
  }

  try {
    if (current.kind === 'library' && current.slug) {
      const res = await appleIapApi.confirmLibraryApplePurchase(current.slug, transactionId);
      if (!res.success) {
        throw new Error(res.message);
      }
    } else if (current.kind === 'ai_assistant') {
      const res = await appleIapApi.confirmAiAssistantApplePurchase(transactionId);
      if (!res.success) {
        throw new Error(res.message);
      }
    } else if (current.kind === 'provider_subscription' && current.planUuid) {
      const res = await appleIapApi.confirmProviderApplePurchase(current.planUuid, transactionId);
      if (!res.success) {
        throw new Error(res.message);
      }
    } else if (current.kind === 'video' && current.slug) {
      const res = await appleIapApi.confirmVideoApplePurchase(current.slug, transactionId);
      if (!res.success) {
        throw new Error(res.message);
      }
    } else if (current.kind === 'ad' && current.adUuid) {
      const res = await appleIapApi.confirmAdApplePurchase(current.adUuid, transactionId);
      if (!res.success) {
        throw new Error(res.message);
      }
    }

    await finishTransaction({ purchase, isConsumable: isConsumableKind(current.kind) });
    current.resolve();
  } catch (e) {
    current.reject(e instanceof Error ? e : new Error('Could not confirm purchase with server.'));
  } finally {
    pending = null;
  }
}

function runPurchase(params: Omit<PendingPurchase, 'resolve' | 'reject'>): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (pending) {
      reject(new Error('Another purchase is already in progress.'));
      return;
    }

    pending = { ...params, resolve, reject };

    try {
      await ensureConnection();
      const isSubscription = params.kind === 'ai_assistant' || params.kind === 'provider_subscription';
      await requestPurchase({
        type: isSubscription ? 'subs' : 'in-app',
        request: {
          apple: { sku: params.productId },
        },
      });
    } catch (e) {
      pending = null;
      reject(e instanceof Error ? e : new Error('Could not start purchase.'));
    }
  });
}

export async function purchaseLibraryTitle(slug: string, appleProductId: string): Promise<void> {
  return runPurchase({
    productId: appleProductId,
    kind: 'library',
    slug,
  });
}

export async function purchaseAiAssistantSubscription(appleProductId: string): Promise<void> {
  return runPurchase({
    productId: appleProductId,
    kind: 'ai_assistant',
  });
}

export async function purchaseProviderSubscription(planUuid: string, appleProductId: string): Promise<void> {
  return runPurchase({
    productId: appleProductId,
    kind: 'provider_subscription',
    planUuid,
  });
}

export async function purchaseVideo(slug: string, appleProductId: string): Promise<void> {
  return runPurchase({
    productId: appleProductId,
    kind: 'video',
    slug,
  });
}

export async function purchaseAdPublish(adUuid: string, appleProductId: string): Promise<void> {
  return runPurchase({
    productId: appleProductId,
    kind: 'ad',
    adUuid,
  });
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
  const purchases = await getAvailablePurchases();

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

  for (const purchase of purchases) {
    const transactionId = purchaseTransactionId(purchase);
    const productId = purchase.productId;
    if (!transactionId || !productId) continue;

    if (aiProductId && productId === aiProductId) {
      aiAssistantTx = transactionId;
      continue;
    }

    if (
      productId.startsWith(`${providerPrefix}.`) ||
      (providerMonthlyId !== '' && productId === providerMonthlyId) ||
      (providerYearlyId !== '' && productId === providerYearlyId)
    ) {
      providerSubscriptions.push({ transaction_id: transactionId, product_id: productId });
      continue;
    }

    if (productId.startsWith(`${videoPrefix}.`)) {
      videos.push({ transaction_id: transactionId, product_id: productId });
      continue;
    }

    if (productId.startsWith(`${libraryPrefix}.`) || productId) {
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
    throw new Error(res.message);
  }

  return {
    library_restored: res.data?.library_restored ?? 0,
    ai_assistant_active: res.data?.ai_assistant_active ?? false,
    provider_subscription_active: res.data?.provider_subscription_active ?? false,
    videos_restored: res.data?.videos_restored ?? 0,
    errors: res.data?.errors ?? [],
  };
}
