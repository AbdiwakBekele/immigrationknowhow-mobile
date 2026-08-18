/**
 * Reference product IDs and display prices for IAP flows.
 * Runtime purchases still use API-provided product IDs when available.
 */
export const IAP_PRODUCT_IDS = {
  AI_ASSISTANT_MONTHLY: 'com.immigrantknowhow.ikhapp.monthly.ai_assistant',
  PROVIDER_MONTHLY: 'com.immigrantknowhow.ikhapp.provider.serviceprofessional_monthly',
  PROVIDER_YEARLY: 'com.immigrantknowhow.ikhapp.provider.serviceprofessional_yearly',
  EBOOK_PURCHASE: 'com.immigrantknowhow.ikhapp.ebook_credit',
  AD_PUBLISH: 'com.immigrantknowhow.ikhapp.ad.publish',
} as const;

export const IAP_DISPLAY_PRICES_CENTS = {
  AI_ASSISTANT_MONTHLY: 499,
  PROVIDER_MONTHLY: 999,
  PROVIDER_YEARLY: 9999,
  EBOOK: 599,
  AD_PUBLISH: 999,
} as const;

export type IapFeatureKind =
  | 'ai_assistant'
  | 'provider_subscription'
  | 'library'
  | 'ad'
  | 'video';

export function logIapPurchaseIntent(
  feature: IapFeatureKind,
  productId: string,
  priceCents?: number | null,
): void {
  console.log('[IAP] Selected IAP feature:', feature);
  console.log('[IAP] Selected iOS product ID:', productId);
  console.log('[IAP] Expected price cents:', priceCents ?? 'unknown');
}
