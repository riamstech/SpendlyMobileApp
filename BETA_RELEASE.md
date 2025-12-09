# iOS Beta Release Guide

## Building for TestFlight Beta Release

### Option 1: Build and Submit in One Command (Recommended)

```bash
# Build and automatically submit to TestFlight
eas build --profile preview --platform ios --auto-submit
```

### Option 2: Build First, Then Submit Separately

#### Step 1: Build the iOS app
```bash
eas build --profile preview --platform ios
```

This will:
- Build your app for iOS
- Create an `.ipa` file ready for TestFlight
- Upload it to EAS servers

Wait for the build to complete. You'll see a build ID when it's done.

#### Step 2: Submit to TestFlight
Once the build is complete, submit it:

```bash
# Submit the latest build
eas submit --platform ios --latest --profile preview

# OR submit a specific build by ID
eas submit --platform ios --id <build-id> --profile preview
```

### Additional Options

#### Add TestFlight Groups
```bash
eas submit --platform ios --latest --groups "Beta Testers" --profile preview
```

#### Add "What to Test" Notes
```bash
eas submit --platform ios --latest --what-to-test "Fixed photo permissions, improved onboarding flow" --profile preview
```

#### Wait for Submission to Complete
```bash
eas submit --platform ios --latest --wait --profile preview
```

## Prerequisites

1. **Apple Developer Account**: You need an active Apple Developer Program membership ($99/year)
2. **App Store Connect Setup**: Your app must be registered in App Store Connect
3. **Certificates & Provisioning Profiles**: EAS will handle these automatically
4. **App Store Connect API Key** (optional but recommended):
   ```bash
   eas credentials
   ```
   Then configure your App Store Connect API key for automated submissions

## Build Profiles

- **`preview`**: For beta testing (TestFlight) - Updated to use "store" distribution
- **`production`**: For App Store release
- **`development`**: For internal development builds

## Troubleshooting

### If submission fails:
1. Check your Apple Developer account status
2. Verify your app exists in App Store Connect
3. Ensure your bundle identifier matches: `com.spendly.mobile`
4. Check build logs: `eas build:list`

### Check build status:
```bash
eas build:list --platform ios
```

### View submission status:
```bash
eas submit:list
```
