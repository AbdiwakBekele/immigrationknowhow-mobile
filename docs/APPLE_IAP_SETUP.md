# Apple In-App Purchase setup (iOS)

The iOS app uses **Apple In-App Purchase** for paid library titles and the AI Assistant subscription. Android and web continue to use Stripe.

## 1. App Store Connect

1. Complete **Paid Apps** agreements, tax, and banking.
2. Create products:
   - **Auto-renewable subscription** for AI Assistant  
     Default product ID: `com.immigrantknowhow.ikhapp.ai_assistant.monthly`
   - **Non-consumable** (one per paid ebook)  
     Default pattern: `com.immigrantknowhow.ikhapp.library.{library_item_uuid}`  
     Or set `apple_product_id` on each `library_items` row in the admin database.
3. Add a **sandbox tester** account for review and QA.

## 2. App Store Server API (Laravel)

Generate an **In-App Purchase** key in App Store Connect → Users and Access → Integrations → In-App Purchase.

Add to `web.immigrationknowhow` `.env`:

```env
APPLE_BUNDLE_ID=com.immigrantknowhow.ikhapp
APPLE_ISSUER_ID=your-issuer-uuid
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
# Or: APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_XXXX.p8
APPLE_IAP_SANDBOX=true
APPLE_AI_ASSISTANT_PRODUCT_ID=com.immigrantknowhow.ikhapp.ai_assistant.monthly
APPLE_LIBRARY_PRODUCT_PREFIX=com.immigrantknowhow.ikhapp.library
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
