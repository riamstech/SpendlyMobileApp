# 🔧 Android Issues Fix Guide

## Issues Fixed

### 1. ✅ Launcher Icon Not Showing

**Problem:** The app icon wasn't displaying on Android devices.

**Solution Applied:**
- Verified adaptive icon configuration in `app.json`
- Confirmed icon resources are properly generated in `android/app/src/main/res/mipmap-*`
- Adaptive icon XML is correctly configured

**If icon still doesn't show after rebuild:**
1. Uninstall the app completely: `adb uninstall com.spendly.money`
2. Clear device cache (Settings → Apps → Spendly Money → Clear Cache)
3. Rebuild and reinstall: `npx expo run:android`
4. Restart the device if needed

**Note:** Some Android launchers cache icons. If the icon still doesn't appear:
- Try a different launcher app
- Clear launcher cache
- Restart device

---

### 2. ✅ Google Sign-In Not Working

**Problem:** Social login (Google Sign-In) wasn't working on Android.

**Fixes Applied:**

1. **Added Google Sign-In Plugin to app.json:**
   ```json
   [
     "@react-native-google-signin/google-signin",
     {
       "iosUrlScheme": "com.googleusercontent.apps.913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu"
     }
   ]
   ```

2. **Fixed Duplicate Configuration:**
   - Removed duplicate `GoogleSignin.configure()` calls in `LoginScreen.tsx`
   - Consolidated into a single configuration with proper settings

3. **Configuration Details:**
   - Web Client ID: `913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com`
   - iOS Client ID: `913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu.apps.googleusercontent.com`
   - Android Client ID: Automatically handled by `google-services.json`

---

## ⚠️ Important: SHA-1 Fingerprint Configuration

For Google Sign-In to work on Android, you **MUST** add your app's SHA-1 fingerprint to Firebase Console.

### Get Your SHA-1 Fingerprint:

**For Debug Build:**
```bash
cd android
./gradlew signingReport
```

Look for the SHA1 value under `Variant: debug` → `Config: debug`

**Or using keytool:**
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Your Debug SHA-1 Fingerprint:**
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

⚠️ **Add this to Firebase Console now!**

**For Release Build:**
```bash
keytool -list -v -keystore /path/to/your/release.keystore -alias your-key-alias
```

### Add to Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `spendly-f8628`
3. Go to **Project Settings** (gear icon)
4. Scroll to **Your apps** section
5. Find your Android app (`com.spendly.money`)
6. Click **Add fingerprint**
7. Paste your SHA-1 fingerprint
8. Save

**⚠️ Without the SHA-1 fingerprint, Google Sign-In will fail on Android!**

---

## 🔄 Rebuild Instructions

After applying these fixes:

```bash
# 1. Clean and prebuild
npx expo prebuild --platform android --clean

# 2. Build and install
npx expo run:android
```

---

## 🧪 Testing

### Test Launcher Icon:
1. Uninstall existing app: `adb uninstall com.spendly.money`
2. Rebuild and install: `npx expo run:android`
3. Check app drawer for "Spendly Money" icon
4. Icon should be visible with white background

### Test Google Sign-In:
1. Open the app
2. Go to Login screen
3. Tap "Continue with Google"
4. Should open Google Sign-In flow
5. After successful sign-in, should authenticate with backend

**If Google Sign-In fails:**
- Check console logs: `adb logcat | grep -i google`
- Verify SHA-1 fingerprint is added to Firebase
- Ensure `google-services.json` is in project root
- Check that Google Play Services is installed on device

---

## 📋 Checklist

- [x] Google Sign-In plugin added to app.json
- [x] Duplicate GoogleSignin.configure() removed
- [x] Adaptive icon configuration verified
- [ ] SHA-1 fingerprint added to Firebase Console
- [ ] App rebuilt and tested
- [ ] Launcher icon visible on device
- [ ] Google Sign-In working on Android

---

## 🐛 Troubleshooting

### Icon Still Not Showing:
1. Check if icon files exist: `ls android/app/src/main/res/mipmap-*/ic_launcher*`
2. Verify adaptive icon XML: `cat android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
3. Try clearing Android build cache: `cd android && ./gradlew clean`
4. Rebuild: `npx expo prebuild --platform android --clean && npx expo run:android`

### Google Sign-In Still Failing:
1. **Check SHA-1 fingerprint:**
   ```bash
   cd android && ./gradlew signingReport
   ```
   Copy SHA1 and add to Firebase Console

2. **Verify google-services.json:**
   ```bash
   ls -la google-services.json
   ```
   Should exist and contain your package name: `com.spendly.money`

3. **Check logs for errors:**
   ```bash
   adb logcat | grep -i "google\|signin\|auth"
   ```

4. **Verify Google Play Services:**
   - Ensure device has Google Play Services installed
   - Update Google Play Services if needed

5. **Test with different Google account:**
   - Try with a different Google account
   - Check if account has proper permissions

---

## 📚 Additional Resources

- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Expo Google Sign-In Plugin](https://docs.expo.dev/versions/latest/sdk/google-sign-in/)
- [Android Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)

---

## ✅ Next Steps

1. **Get SHA-1 fingerprint** and add to Firebase Console
2. **Rebuild the app:** `npx expo run:android`
3. **Test both fixes** on your Android device
4. **Verify** launcher icon appears
5. **Test** Google Sign-In flow

---

**Last Updated:** After applying fixes for launcher icon and Google Sign-In
