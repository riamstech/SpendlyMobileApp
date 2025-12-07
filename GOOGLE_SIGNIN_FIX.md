# 🔧 Google Sign-In DEVELOPER_ERROR (Code 10) Fix

## Problem
```
ERROR  Google Sign-In error: [Error: DEVELOPER_ERROR: Follow troubleshooting instructions...]
ERROR  Error code: 10
```

## Root Causes
1. **Wrong webClientId** - The webClientId in code didn't match google-services.json
2. **SHA-1 Fingerprint Missing** - Must be added to Firebase Console

## ✅ Fixes Applied

### 1. Updated webClientId in LoginScreen.tsx
Changed from:
```javascript
webClientId: '913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com'
```

To (matching google-services.json):
```javascript
webClientId: '913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f.apps.googleusercontent.com'
```

This is the OAuth client ID (type 3) from your `google-services.json` file.

---

## ⚠️ CRITICAL: Add SHA-1 Fingerprint to Firebase

**This is REQUIRED for Google Sign-In to work on Android!**

### Your Debug SHA-1 Fingerprint:
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

### Steps to Add SHA-1 to Firebase:

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/
   - Select project: **spendly-f8628**

2. **Navigate to Project Settings:**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"

3. **Find Your Android App:**
   - Scroll to "Your apps" section
   - Find: **com.spendly.money** (Android app)

4. **Add SHA-1 Fingerprint:**
   - Click "Add fingerprint" button
   - Paste: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - Click "Save"

5. **Wait a few minutes** for Firebase to propagate the changes

---

## 🔄 After Adding SHA-1

1. **Rebuild the app:**
   ```bash
   npx expo run:android
   ```

2. **Test Google Sign-In:**
   - Open the app
   - Go to Login screen
   - Tap "Continue with Google"
   - Should work now! ✅

---

## 📋 Verification Checklist

- [x] webClientId updated to match google-services.json
- [ ] SHA-1 fingerprint added to Firebase Console
- [ ] App rebuilt after SHA-1 added
- [ ] Google Sign-In tested and working

---

## 🐛 If Still Not Working

### 1. Verify SHA-1 is Added:
- Go to Firebase Console → Project Settings → Your apps → Android app
- Check "SHA certificate fingerprints" section
- Should see: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

### 2. Check Package Name:
- Verify `com.spendly.money` matches in:
  - `app.json` → `android.package`
  - `AndroidManifest.xml` → `package`
  - Firebase Console → Android app package name

### 3. Verify google-services.json:
```bash
cat google-services.json | grep "package_name"
```
Should show: `"package_name": "com.spendly.money"`

### 4. Check Logs:
```bash
adb logcat | grep -i "google\|signin\|auth"
```

### 5. Clear App Data:
```bash
adb shell pm clear com.spendly.money
```

### 6. Rebuild from Scratch:
```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

---

## 📚 Additional Notes

- **webClientId** must be the Web application OAuth client ID (type 3) from google-services.json
- **SHA-1 fingerprint** is required for Android Google Sign-In
- Changes in Firebase Console can take 5-10 minutes to propagate
- For production builds, you'll need to add the release SHA-1 as well

---

## ✅ Expected Result

After adding SHA-1 and rebuilding:
- Google Sign-In should open the account picker
- After selecting an account, should authenticate successfully
- No more DEVELOPER_ERROR (code 10)

---

**Last Updated:** After fixing webClientId mismatch
