# Rebuild with Correct Keystore

## Problem

The current build (ID: `031fa2db-243b-43e9-831a-d62d0d8dd3e4`) was signed with the wrong keystore:
- **Expected SHA1**: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`
- **Current SHA1**: `0F:0F:53:34:5F:9D:48:C9:C0:70:C6:F7:40:72:6C:8E:0C:1E:9F:99`

This is because EAS Build is using its own stored keystore, not the correct one we configured locally.

## Solution: Configure EAS to Use Correct Keystore

### Step 1: Configure EAS Credentials

Run this command from the **project root** (not android/app):

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
eas credentials
```

Then follow these steps:

1. **Select**: `Android`
2. **Select**: `production` profile
3. **Choose**: `Set up a new Android Keystore` (or `Update existing` if prompted)
4. **Select**: `I want to upload my own keystore`
5. **Provide path**: `android/app/spendly-release-key.jks`
6. **Enter keystore password**: `changeit`
7. **Enter key alias**: `spendly-release`
8. **Enter key password**: `changeit`

### Step 2: Verify Keystore Configuration

After configuring, EAS should show:
- Keystore: Using your uploaded keystore
- SHA1: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68` ✅

### Step 3: Build New Version

Once EAS is configured with the correct keystore, build a new version:

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
eas build --profile production --platform android
```

This will create a new build signed with the correct keystore.

### Step 4: Upload to Play Store

After the build completes, you can either:

**Option A: Submit via EAS** (if permissions are fixed):
```bash
eas submit --platform android --latest --profile production
```

**Option B: Manual Upload**:
1. Download the new AAB from the build page
2. Upload to Play Console → Internal Testing → Create new release
3. The SHA1 should now match: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`

## Important Notes

- ⚠️ **The old build cannot be used** - it's signed with the wrong key
- ✅ **You must rebuild** with EAS configured to use the correct keystore
- ✅ **Local build.gradle is already configured** - but EAS uses its own credentials
- ✅ **Keystore file exists**: `android/app/spendly-release-key.jks` with correct SHA1

## Keystore Details

- **File**: `android/app/spendly-release-key.jks`
- **Password**: `changeit`
- **Key Alias**: `spendly-release`
- **Key Password**: `changeit`
- **SHA1**: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68` ✅

## Quick Commands

```bash
# 1. Configure EAS credentials (interactive)
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
eas credentials

# 2. Build with correct keystore
eas build --profile production --platform android

# 3. Submit (after build completes)
eas submit --platform android --latest --profile production
```

## Troubleshooting

### If EAS credentials command fails:
- Make sure you're in the project root directory
- Make sure `eas.json` exists in the root
- Try: `npx eas-cli credentials` instead

### If build still uses wrong keystore:
- Verify EAS credentials show the correct keystore
- Check the build logs to see which keystore was used
- Make sure you selected the `production` profile

### If you can't find the keystore file:
- It should be at: `android/app/spendly-release-key.jks`
- Verify it exists: `ls -la android/app/spendly-release-key.jks`
- Verify SHA1: `keytool -list -v -keystore android/app/spendly-release-key.jks`
