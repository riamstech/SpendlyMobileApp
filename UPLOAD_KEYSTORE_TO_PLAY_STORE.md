# Upload Keystore to Google Play Store

## Current Situation
- Google Play expects: SHA1 `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`
- Current build signed with: SHA1 `0F:0F:53:34:5F:9D:48:C9:C0:70:C6:F7:40:72:6C:8E:0C:1E:9F:99`
- Your correct keystore: `android/app/spendly-release-key.jks` (matches expected SHA1)

## Step 1: Upload Keystore to Google Play Console

1. In the "App signing preferences" dialog, select:
   **"Export and upload a key from Java keystore"**

2. Click "Continue" or "Next"

3. Upload your keystore file:
   - **File**: `android/app/spendly-release-key.jks`
   - **Password**: `changeit`
   - **Key alias**: `spendly-release`
   - **Key password**: `changeit`

4. Complete the upload process in Google Play Console

## Step 2: Configure EAS Credentials

After uploading to Play Store, configure EAS to use the same keystore:

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
eas credentials
```

When prompted:
- Select: **Android** → **production** profile
- Choose: **Set up a new Android Keystore** (or update existing)
- Upload: `android/app/spendly-release-key.jks`
- Password: `changeit`
- Alias: `spendly-release`
- Key password: `changeit`

## Step 3: Rebuild the App

```bash
eas build --profile production --platform android
```

## Step 4: Submit to Play Store

After the build completes:

```bash
eas submit --platform android --latest --profile production
```

Or upload manually via Play Console.

## Why This Works

By uploading your keystore to Google Play Console, you're telling Google to use that specific key (`86:5B...`) as your app's signing key. Then, when you rebuild with EAS using the same keystore, the AAB will be signed correctly and match Google's expectations.
