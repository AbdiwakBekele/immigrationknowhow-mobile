# Apple In-App Purchase setup (iOS)

The iOS app uses **Apple In-App Purchase** for paid library titles and the AI Assistant subscription. Android and web continue to use Stripe.

## 1. App Store Connect

1. Complete **Paid Apps** agreements, tax, and banking.
2. Create products:
   - **Auto-renewable subscription** for AI Assistant  
     Default product ID: `com.immigrantknowhow.ikhapp.monthly.ai_assistant`
   - **Non-consumable** for the main ebook  
     Product ID: `EBOOK_TO2026` (set via `APPLE_LIBRARY_EBOOK_PRODUCT_ID` in `.env`)  
     For additional paid titles later: set `apple_product_id` on each `library_items` row, or use `APPLE_LIBRARY_EBOOK_SLUG` to target one slug.
3. Add a **sandbox tester** account for review and QA.

## 2. App Store Server API (Laravel)

Generate an **In-App Purchase** key in App Store Connect → Users and Access → Integrations → In-App Purchase.

Add to `web.immigrationknowhow` `.env`:

```env
APPLE_BUNDLE_ID=com.immigrantknowhow.ikhapp
APPLE_ISSUER_ID=your-issuer-uuid
APPLE_KEY_ID=your-key-id
# Prefer file path (production):
APPLE_PRIVATE_KEY_PATH=/var/www/ikh/storage/app/apple/SubscriptionKey_K4A5TCGDYM.p8
# Or inline key instead: APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APPLE_IAP_SANDBOX=true
APPLE_AI_ASSISTANT_MONTHLY=com.immigrantknowhow.ikhapp.monthly.ai_assistant
APPLE_LIBRARY_PRODUCT_PREFIX=com.immigrantknowhow.ikhapp.library
APPLE_LIBRARY_EBOOK_PRODUCT_ID=EBOOK_TO2026
```

Run migrations:

```bash
php artisan migrate
```

## 3. Native iOS build

IAP does **not** work in Expo Go. Use a **development build** or production build:

```bash
cd mobile.ikh
npx expo prebuild --platform ios
npx expo run:ios
# or: eas build --platform ios
```

Enable **In-App Purchase** capability in Xcode (Signing & Capabilities).

## 4. Testing

1. Sign in on a physical device or simulator with a **sandbox Apple ID**.
2. Buy a paid library title → entitlement should appear under **Purchased**.
3. Subscribe to AI Assistant → chat should unlock.
4. Use **Restore App Store purchases** on the library screen.

## 5. App Review notes

Tell reviewers:

- Paid digital content on iOS uses In-App Purchase only.
- Stripe checkout is disabled on iOS (`X-IKH-Client: ios`).
- Sandbox test account and which products to test.
