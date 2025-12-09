# Quick Setup: Use spendly-release-key.jks

## Step 1: Verify the Keystore SHA1

Run this command to check if this keystore matches the expected SHA1:

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
./check-keystore-sha1.sh
```

When prompted, enter your keystore password. The script will tell you if the SHA1 matches:
- **Expected SHA1**: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`

If it matches ✅, proceed to Step 2.
If it doesn't match ❌, you need to find the correct keystore.

## Step 2: Create key.properties File

1. **Copy the template**:
   ```bash
   cd android
   cp key.properties.template key.properties
   ```

2. **Edit key.properties** with your actual values:
   ```bash
   # Open in your editor
   nano key.properties
   # or
   code key.properties
   ```

3. **Fill in the values**:
   ```properties
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=spendly-release
   storeFile=../app/spendly-release-key.jks
   ```

   Replace:
   - `YOUR_KEYSTORE_PASSWORD` - The password for the keystore
   - `YOUR_KEY_PASSWORD` - The password for the key (often same as keystore password)
   - `spendly-release` - This is the alias found in the keystore (you can verify with the check script)

## Step 3: Verify Configuration

The `build.gradle` file is already configured to:
- Load `key.properties` if it exists
- Use the release keystore for release builds
- Fall back to debug keystore if `key.properties` doesn't exist

## Step 4: Test the Build

1. **Build a release bundle**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. **Verify the signature** (optional):
   ```bash
   jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
   ```

3. **Check the SHA1** (optional):
   ```bash
   keytool -printcert -jarfile app/build/outputs/bundle/release/app-release.aab
   ```

   The SHA1 should match: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`

## Step 5: Build with EAS (If Using EAS Build)

If you're using EAS Build, configure it to use your keystore:

```bash
eas credentials
```

Then:
1. Select **Android**
2. Select **production** profile
3. Choose **Set up a new Android Keystore**
4. Select **I want to upload my own keystore**
5. Provide the path: `android/app/spendly-release-key.jks`
6. Enter the keystore password: (your keystore password)
7. Enter the key alias: `spendly-release`
8. Enter the key password: (your key password, usually same as keystore password)

## Troubleshooting

### If the SHA1 doesn't match:
- This keystore is not the one used for the original Play Store upload
- You need to find the keystore with SHA1: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`
- Check backups, team members, or Expo Dashboard

### If you don't know the keystore password:
- Check your password manager
- Check with team members
- Check your documentation/notes
- If lost, you cannot use this keystore

### If build fails:
- Make sure `key.properties` file exists in `android/` folder
- Verify all paths in `key.properties` are correct
- Check that the keystore file exists at the specified path
- Verify passwords are correct

## Current File Structure

```
android/
├── key.properties          ← Create this file (from template)
├── key.properties.template ← Template file
└── app/
    └── spendly-release-key.jks ← Your keystore file
```

## Important Notes

- ⚠️ **Never commit `key.properties` to git** (it's in `.gitignore`)
- ⚠️ **Never commit keystore files to git** (they're in `.gitignore`)
- ✅ The keystore is already in the correct location: `android/app/spendly-release-key.jks`
- ✅ The `build.gradle` is already configured to use it
