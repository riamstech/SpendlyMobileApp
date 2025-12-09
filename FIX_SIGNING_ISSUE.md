# Fix Android Play Store Signing Key Issue

## Problem
Your app bundle is signed with a different key than Play Store expects:
- **Expected SHA1**: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`
- **Current SHA1**: `0F:0F:53:34:5F:9D:48:C9:C0:70:C6:F7:40:72:6C:8E:0C:1E:9F:99`

## Solution Options

### Option 1: Restore Original Keystore (If You Have It)

If you have the original keystore file (`.jks` or `.keystore`), you can configure EAS to use it:

1. **Locate your original keystore file**
   - Check your backups, secure storage, or team members
   - The file should have SHA1: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`

2. **Configure EAS to use your keystore**:
   ```bash
   cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
   eas credentials
   ```
   
   Then:
   - Select **Android**
   - Select **production** profile
   - Choose **Set up a new Android Keystore**
   - Select **I want to upload my own keystore**
   - Provide the path to your original keystore file
   - Enter the keystore password and key alias

3. **Verify the keystore**:
   ```bash
   keytool -list -v -keystore your-keystore.jks
   ```
   Check that the SHA1 matches: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`

4. **Rebuild with the correct key**:
   ```bash
   eas build --profile production --platform android
   ```

### Option 2: Check EAS Credentials Status

Check what keystore EAS is currently using:

1. **View current credentials**:
   ```bash
   eas credentials
   ```
   - Select **Android**
   - Select **production** profile
   - View the keystore information

2. **Check if you have multiple keystores**:
   - EAS might have multiple keystores stored
   - You may need to switch to the correct one

### Option 3: Contact Expo Support (If Original Keystore is Lost)

If you don't have the original keystore:

1. **Check Expo Dashboard**:
   - Go to https://expo.dev/accounts/riamstech/projects/SpendlyMobileApp/credentials
   - Check if the original keystore is stored there

2. **Contact Expo Support**:
   - They may have a backup of your original keystore
   - Email: support@expo.dev
   - Include your project ID: `69fcbfda-6485-4d30-9d69-3cefc6544941`

3. **Check Google Play Console**:
   - Go to https://play.google.com/console
   - Navigate to your app → **Release** → **Setup** → **App signing**
   - If you're using **Play App Signing**, Google manages the signing key
   - In this case, you need to ensure your upload key matches

### Option 4: Use Play App Signing (If Enabled)

If your app uses Google Play App Signing:

1. **Check Play Console**:
   - Go to https://play.google.com/console
   - Your app → **Release** → **Setup** → **App signing**
   - Check if "App signing by Google Play" is enabled

2. **If Play App Signing is enabled**:
   - Google manages the app signing key
   - You only need to ensure your **upload key** is correct
   - The upload key SHA1 should match: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`

3. **Update upload key in EAS**:
   - Configure EAS to use the correct upload key
   - The upload key is what you use to sign bundles before uploading

### Option 5: Last Resort - Create New App (NOT RECOMMENDED)

⚠️ **WARNING**: This will create a completely new app listing. You'll lose:
- All existing users
- App reviews and ratings
- Download history
- In-app purchases (if any)

Only use this if:
- You've exhausted all other options
- You don't have the original keystore
- Expo support cannot help
- You're okay with starting fresh

If you must do this:
1. Change package name in `app.config.js`: `com.spendly.money` → `com.spendly.money2`
2. Create new app in Play Console
3. Upload new build

## Immediate Steps to Take

1. **Check if you have the original keystore**:
   ```bash
   # Search for keystore files
   find ~ -name "*.jks" -o -name "*.keystore" 2>/dev/null
   ```

2. **Check EAS credentials**:
   ```bash
   eas credentials
   ```

3. **Verify keystore SHA1** (if you find a keystore):
   ```bash
   keytool -list -v -keystore path/to/keystore.jks
   ```
   Look for the SHA1 fingerprint in the output

4. **Check Google Play Console**:
   - Verify the expected SHA1 fingerprint
   - Check if Play App Signing is enabled

## Prevention for Future

1. **Backup your keystore**:
   - Store it in a secure location (password manager, encrypted storage)
   - Share with trusted team members
   - Document the keystore location and passwords

2. **Use EAS credentials backup**:
   - EAS can backup your credentials
   - Make sure credentials are properly stored

3. **Document the keystore**:
   - Keep a record of:
     - Keystore file location
     - Keystore password
     - Key alias
     - Key password
     - SHA1 fingerprint

## Quick Verification Commands

```bash
# Check current EAS credentials
eas credentials

# List all builds
eas build:list --platform android

# Check a keystore's SHA1
keytool -list -v -keystore your-keystore.jks | grep SHA1

# Verify an AAB's signature
jarsigner -verify -verbose -certs your-app.aab
```

## Need Help?

If you're stuck:
1. Check Expo documentation: https://docs.expo.dev/app-signing/app-credentials/
2. Contact Expo support: support@expo.dev
3. Check Google Play Console for app signing details
4. Review EAS build logs for signing information
