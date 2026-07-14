# EAS CI/CD

This repo now includes committed GitHub Actions workflows for Android and iOS production releases with EAS.

## Workflows

- `.github/workflows/eas-android-production-build.yml`
  - Runs on pushes to `main` and on manual dispatch.
  - Triggers `eas build --platform android --profile production --non-interactive --no-wait`.
- `.github/workflows/eas-android-production-release.yml`
  - Runs on manual dispatch and when a tag matching `android-v*` is pushed.
  - Triggers `eas build --platform android --profile production --auto-submit --non-interactive --wait`.
  - Waits for both the EAS build and the Play submission to finish before GitHub marks the job successful.
- `.github/workflows/eas-ios-production-build.yml`
  - Runs on pushes to `main` and on manual dispatch.
  - Triggers `eas build --platform ios --profile production --non-interactive --no-wait`.
- `.github/workflows/eas-ios-production-release.yml`
  - Runs on manual dispatch and when a tag matching `ios-v*` is pushed.
  - Triggers `eas build --platform ios --profile production --auto-submit --non-interactive --wait`.
  - Waits for both the EAS build and the App Store Connect submission to finish before GitHub marks the job successful.

## Required GitHub setup

Add this repository secret before running the workflows:

- `EXPO_TOKEN`
  - Create a personal access token in your Expo account.
  - Save it as a GitHub Actions repository secret named `EXPO_TOKEN`.

## Required EAS setup

The workflows assume the Android production build and submit flow already works in non-interactive mode:

- `eas.json` contains the `production` build and submit profiles.
- The Android submit profile targets the Google Play `production` track.
- The Expo project is linked through `expo.extra.eas.projectId` in `app.json`.
- Android app signing credentials are already configured in EAS.
- A Google Service Account key for Play submissions is already uploaded to the EAS project credentials.
- The first Play Console upload has already been completed manually at least once.

For iOS release automation, you will also need:

- An iOS submit profile in `eas.json` with `submit.production.ios.ascAppId`.
- App Store Connect API access configured for EAS Submit.
- iOS distribution credentials configured in EAS.
- The app record already created in App Store Connect.

## How to use it

### CI build on `main`

Push to `main` or run the `EAS Android Production Build` workflow from the GitHub Actions tab.

### Production release from GitHub

Use either of these:

- Run the `EAS Android Production Release` workflow manually from the GitHub Actions tab.
- Push a tag such as `android-v1.0.0`.

The release workflow uses `--auto-submit`, so it replaces the local two-step flow of:

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

## Important behavior

- A successful GitHub release run now means the Play submission finished successfully, not just that Expo queued it.
- Android submissions from the `production` submit profile go to the Play Console `production` track instead of Expo's default `internal` track.

## iOS release flow

- Push to `main` or manually run `EAS iOS Production Build` to generate a production iOS build without submitting it.
- Run `EAS iOS Production Release` manually or push a tag such as `ios-v1.0.0` to build and submit to App Store Connect.
- A successful iOS release workflow means Expo finished the submission to App Store Connect.
- App Store review and public release timing may still need to be managed in Apple's console depending on your App Store release settings.
