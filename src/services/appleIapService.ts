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

type PendingPurchase = {
  productId: string;
  kind: 'library' | 'ai_assistant';
  slug?: string;
  resolve: (value: void) => void;
  reject: (reason: Error) => void;
};

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
    }

    await finishTransaction({ purchase, isConsumable: false });
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
      await requestPurchase({
        type: params.kind === 'ai_assistant' ? 'subs' : 'in-app',
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

export async function restoreApplePurchasesOnDevice(): Promise<{
  library_restored: number;
  ai_assistant_active: boolean;
  errors: string[];
}> {
  await ensureConnection();
  await restorePurchases();
  const purchases = await getAvailablePurchases();

  const library: appleIapApi.RestoreLibraryEntry[] = [];
  let aiAssistantTx: string | undefined;

  const configRes = await appleIapApi.getIapConfig();
  const aiProductId = configRes.success ? configRes.data?.ai_assistant_product_id : undefined;

  for (const purchase of purchases) {
    const transactionId = purchaseTransactionId(purchase);
    const productId = purchase.productId;
    if (!transactionId || !productId) continue;

    if (aiProductId && productId === aiProductId) {
      aiAssistantTx = transactionId;
      continue;
    }

    library.push({ transaction_id: transactionId, product_id: productId });
  }

  const res = await appleIapApi.restoreApplePurchases({
    library,
    ...(aiAssistantTx ? { ai_assistant: { transaction_id: aiAssistantTx } } : {}),
  });

  if (!res.success) {
    throw new Error(res.message);
  }

  return {
    library_restored: res.data?.library_restored ?? 0,
    ai_assistant_active: res.data?.ai_assistant_active ?? false,
    errors: res.data?.errors ?? [],
  };
}
