# Setup Release Keystore for Android

## Current Issue
Your release build is using the debug keystore, but Play Store expects a different signing key:
- **Expected SHA1**: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`
- **Current SHA1**: `0F:0F:53:34:5F:9D:48:C9:C0:70:C6:F7:40:72:6C:8E:0C:1E:9F:99`

## Step 1: Find Your Release Keystore

Run the search script:
```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
./find-keystore.sh
```

This will search for keystore files and check their SHA1 fingerprints.

## Step 2: Place Keystore in Android Folder

Once you find the keystore with SHA1 `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`:

1. **Copy it to the android/app folder**:
   ```bash
   cp /path/to/your/release-keystore.jks android/app/release.keystore
   ```
   Or if it's already there, verify it's the correct one.

2. **Verify the SHA1**:
   ```bash
   cd android/app
   keytool -list -v -keystore release.keystore
   ```
   Enter the keystore password when prompted, then check the SHA1 matches: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`

## Step 3: Create key.properties File

1. **Copy the template**:
   ```bash
   cd android
   cp key.properties.template key.properties
   ```

2. **Edit key.properties** with your actual values:
   ```properties
   storePassword=YOUR_ACTUAL_KEYSTORE_PASSWORD
   keyPassword=YOUR_ACTUAL_KEY_PASSWORD
   keyAlias=YOUR_ACTUAL_KEY_ALIAS
   storeFile=../app/release.keystore
   ```

   Replace:
   - `YOUR_ACTUAL_KEYSTORE_PASSWORD` - The password for the keystore
   - `YOUR_ACTUAL_KEY_PASSWORD` - The password for the key (often same as keystore password)
   - `YOUR_ACTUAL_KEY_ALIAS` - The alias name of the key in the keystore
   - `../app/release.keystore` - Path to your keystore file (adjust if different)

## Step 4: Update build.gradle

The `build.gradle` file has been updated to:
1. Load the `key.properties` file
2. Configure release signing with your keystore
3. Use the release keystore for release builds

## Step 5: Test the Configuration

1. **Build a release bundle**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. **Verify the signature**:
   ```bash
   jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
   ```

3. **Check the SHA1**:
   ```bash
   keytool -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab
   ```
   The SHA1 should match: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`

## Step 6: Build with EAS (If Using EAS)

If you're using EAS Build, you need to configure EAS to use your keystore:

```bash
eas credentials
```

Then:
1. Select **Android**
2. Select **production** profile
3. Choose **Set up a new Android Keystore**
4. Select **I want to upload my own keystore**
5. Provide the path: `android/app/release.keystore`
6. Enter the keystore password and key alias

## Troubleshooting

### If you can't find the keystore:

1. **Check Expo Dashboard**:
   - Go to: https://expo.dev/accounts/riamstech/projects/SpendlyMobileApp/credentials
   - Check if EAS has stored your keystore

2. **Check backups**:
   - Look in your backup storage
   - Check with team members
   - Check password managers (some store keystore files)

3. **Check Google Play Console**:
   - Go to: https://play.google.com/console
   - Your app → **Release** → **Setup** → **App signing**
   - If "App signing by Google Play" is enabled, you might only need the upload key

4. **Contact Expo Support**:
   - Email: support@expo.dev
   - Include your project ID: `69fcbfda-6485-4d30-9d69-3cefc6544941`
   - They may have a backup of your keystore

### If the SHA1 doesn't match:

- Make sure you're using the correct keystore file
- Verify the keystore hasn't been corrupted
- Check if you have multiple keystores and are using the wrong one

## Important Notes

- ⚠️ **Never commit `key.properties` or keystore files to git** (they're already in `.gitignore`)
- ⚠️ **Backup your keystore** in a secure location
- ⚠️ **Keep the keystore password safe** - if you lose it, you can't update your app
- ✅ The keystore file should be in `android/app/` folder
- ✅ The `key.properties` file should be in `android/` folder
