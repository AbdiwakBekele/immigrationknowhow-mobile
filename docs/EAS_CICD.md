# EAS CI/CD

This repo now includes committed GitHub Actions workflows for Android production releases with EAS.

## Workflows

- `.github/workflows/eas-android-production-build.yml`
  - Runs on pushes to `main` and on manual dispatch.
  - Triggers `eas build --platform android --profile production --non-interactive --no-wait`.
- `.github/workflows/eas-android-production-release.yml`
  - Runs on manual dispatch and when a tag matching `android-v*` is pushed.
  - Triggers `eas build --platform android --profile production --auto-submit --non-interactive --no-wait`.

## Required GitHub setup

Add this repository secret before running the workflows:

- `EXPO_TOKEN`
  - Create a personal access token in your Expo account.
  - Save it as a GitHub Actions repository secret named `EXPO_TOKEN`.

## Required EAS setup

The workflows assume the Android production build and submit flow already works in non-interactive mode:

- `eas.json` contains the `production` build and submit profiles.
- The Expo project is linked through `expo.extra.eas.projectId` in `app.json`.
- Android app signing credentials are already configured in EAS.
- A Google Service Account key for Play submissions is already uploaded to the EAS project credentials.
- The first Play Console upload has already been completed manually at least once.

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
