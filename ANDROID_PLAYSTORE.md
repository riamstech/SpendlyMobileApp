# Android Play Store Release Guide

## Building for Play Store

### Option 1: Build and Submit in One Command (Recommended)

```bash
# Build and automatically submit to Play Store (Internal Testing)
eas build --profile production --platform android --auto-submit
```

### Option 2: Build First, Then Submit Separately

#### Step 1: Build the Android app
```bash
# For production release (AAB format - required for Play Store)
eas build --profile production --platform android

# OR for preview/testing (APK format)
eas build --profile preview --platform android
```

This will:
- Build your app for Android
- Create an `.aab` (Android App Bundle) file for production
- Create an `.apk` file for preview/testing
- Upload it to EAS servers

Wait for the build to complete. You'll see a build ID when it's done.

#### Step 2: Submit to Play Store
Once the build is complete, submit it:

```bash
# Submit the latest build
eas submit --platform android --latest --profile production

# OR submit a specific build by ID
eas submit --platform android --id <build-id> --profile production
```

## Prerequisites

1. **Google Play Console Account**: You need a Google Play Developer account ($25 one-time fee)
2. **Play Store Setup**: Your app must be registered in Google Play Console
3. **Package Name**: Must match `com.spendly.money` (from app.config.js)
4. **Google Play API Credentials** (required for automated submissions):
   ```bash
   eas credentials
   ```
   Then configure your Google Play API credentials

## Build Types

- **AAB (Android App Bundle)**: Required for Play Store production releases
  - Smaller download sizes
  - Google Play generates optimized APKs
  - Set in `production` profile: `"buildType": "aab"`

- **APK**: For testing/internal distribution
  - Set in `preview` profile: `"buildType": "apk"`

## Play Store Track Options

When submitting, you can specify the track:

```bash
# Internal testing (fastest, for team testing)
eas submit --platform android --latest --profile production

# Alpha testing
eas submit --platform android --latest --profile production --track alpha

# Beta testing
eas submit --platform android --latest --profile production --track beta

# Production release
eas submit --platform android --latest --profile production --track production
```

## Troubleshooting

### If submission fails:
1. Check your Google Play Console account status
2. Verify your app exists in Play Console
3. Ensure your package name matches: `com.spendly.money`
4. Check that you have Google Play API credentials configured
5. Verify your app signing key is set up correctly

### Check build status:
```bash
eas build:list --platform android
```

### View submission status:
```bash
eas submit:list
```

### Set up Google Play API credentials:
```bash
eas credentials
```
Then follow the prompts to configure your Google Play API service account.

## Notes

- **First time setup**: You'll need to create a service account in Google Play Console and download the JSON key
- **App signing**: EAS can manage your app signing key, or you can use your own
- **Version code**: Make sure to increment `versionCode` in `app.config.js` for each release
