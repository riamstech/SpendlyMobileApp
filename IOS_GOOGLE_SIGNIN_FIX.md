# 🔧 iOS Google Sign-In Fix

## Problem
iOS Google Sign-In stopped working after fixing Android Google Sign-In.

## Root Cause
When fixing Android Google Sign-In, I changed the `webClientId` to match `google-services.json`:
- **Changed from:** `913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com` (was working for iOS)
- **Changed to:** `913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f.apps.googleusercontent.com` (from google-services.json, Android-specific)

This broke iOS because iOS needs the original webClientId.

## ✅ Fix Applied

### Platform-Specific webClientId Configuration

Updated `LoginScreen.tsx` to use different `webClientId` for iOS and Android:

```javascript
const webClientId = Platform.OS === 'ios' 
  ? '913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com' // Original iOS webClientId
  : '913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f.apps.googleusercontent.com'; // Android webClientId from google-services.json
```

### Why Different Client IDs?

- **iOS:** Uses the original webClientId that was configured and working
- **Android:** Uses the webClientId from `google-services.json` (type 3 OAuth client)
- Both platforms need `webClientId` for idToken generation
- The `iosClientId` remains the same for both: `913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu.apps.googleusercontent.com`

---

## 📋 Current Configuration

### iOS:
- **webClientId:** `913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com`
- **iosClientId:** `913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu.apps.googleusercontent.com`
- **URL Scheme:** `com.googleusercontent.apps.913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu` (in app.json)

### Android:
- **webClientId:** `913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f.apps.googleusercontent.com`
- **iosClientId:** `913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu.apps.googleusercontent.com` (not used on Android)
- **Android Client ID:** Automatically handled by `google-services.json`

---

## 🧪 Testing

### Test iOS Google Sign-In:

1. **Rebuild iOS app:**
   ```bash
   npx expo run:ios
   ```

2. **Open the app on iOS device/simulator**

3. **Go to Login screen**

4. **Tap "Continue with Google"**

5. **Expected:**
   - Google Sign-In flow should work
   - Should authenticate successfully
   - No errors

### Test Android Google Sign-In:

1. **Android should still work** (no changes to Android config)
2. **Verify it still works after this fix**

---

## ✅ Verification Checklist

- [x] Platform-specific webClientId implemented
- [x] iOS webClientId restored to original working value
- [x] Android webClientId remains from google-services.json
- [ ] **iOS Google Sign-In tested and working**
- [ ] **Android Google Sign-In still working**

---

## 📚 Notes

### Why webClientId is Important:

- **Required for idToken generation** on both platforms
- Used for server-side authentication
- Must match the OAuth client configured in Google Cloud Console
- iOS and Android can use different webClientIds if needed

### Configuration Flow:

1. **iOS:** Uses `iosClientId` for native sign-in, `webClientId` for idToken
2. **Android:** Uses Android client from `google-services.json` for native sign-in, `webClientId` for idToken
3. Both platforms send `idToken` to backend for authentication

---

## 🐛 If Still Not Working

### iOS Issues:

1. **Check logs:**
   ```bash
   # iOS Simulator
   xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Spendly"'
   
   # Physical device (via Xcode)
   # View logs in Xcode → Window → Devices and Simulators → View Device Logs
   ```

2. **Verify URL Scheme:**
   - Check `app.json` → `ios.infoPlist.CFBundleURLTypes`
   - Should include: `com.googleusercontent.apps.913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu`

3. **Check GoogleService-Info.plist:**
   - Ensure file exists and is properly configured
   - Verify REVERSED_CLIENT_ID matches URL scheme

4. **Rebuild iOS:**
   ```bash
   npx expo prebuild --platform ios --clean
   npx expo run:ios
   ```

---

## ✅ Expected Result

After this fix:
- ✅ iOS Google Sign-In should work again
- ✅ Android Google Sign-In should still work
- ✅ Both platforms use appropriate webClientId
- ✅ idToken generation works on both platforms

---

**Last Updated:** After fixing iOS Google Sign-In with platform-specific webClientId
