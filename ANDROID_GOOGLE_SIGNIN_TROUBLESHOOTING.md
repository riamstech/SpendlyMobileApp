# 🔧 Android Google Sign-In Troubleshooting

## Current Issue
Android Google Sign-In is still not working.

## Changes Made

### 1. Updated webClientId for Android
Changed Android to use the **same webClientId as iOS** (the original working one):
- **Before:** `913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f.apps.googleusercontent.com` (from google-services.json)
- **After:** `913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com` (original working one)

**Reason:** The webClientId from `google-services.json` might not be the correct OAuth client configured in Google Cloud Console.

---

## ✅ Verification Checklist

### 1. SHA-1 Fingerprint in Firebase
**Your Debug SHA-1:**
```
5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
```

**Verify in Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project: **spendly-f8628**
3. ⚙️ → **Project settings**
4. Scroll to **Your apps** → Android app (`com.spendly.money`)
5. Check **SHA certificate fingerprints** section
6. Should see: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

**If missing:** Add it now!

---

### 2. Web Client ID in Google Cloud Console

**Verify the webClientId exists:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Project: **spendly-f8628**
3. **APIs & Services** → **Credentials**
4. Look for **OAuth 2.0 Client IDs**
5. Find: `913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com`
6. **Application type** should be: **Web application**

**If not found:** This might be the issue. You may need to:
- Create a new Web application OAuth client
- Or use a different existing webClientId

---

### 3. Package Name Verification

**Verify package name matches everywhere:**
- `app.json` → `android.package`: `com.spendly.money` ✅
- `AndroidManifest.xml` → `package`: `com.spendly.money` ✅
- Firebase Console → Android app package: `com.spendly.money` ✅
- `google-services.json` → `package_name`: `com.spendly.money` ✅

---

## 🔄 Next Steps

### Step 1: Rebuild the App
```bash
npx expo run:android
```

### Step 2: Test Google Sign-In
1. Open app on Android device
2. Go to Login screen
3. Tap "Continue with Google"
4. Check for errors

### Step 3: Check Logs
```bash
adb logcat | grep -i "google\|signin\|auth\|error"
```

Look for:
- `DEVELOPER_ERROR`
- `Error code: 10`
- Any authentication errors

---

## 🐛 Common Issues & Solutions

### Issue 1: DEVELOPER_ERROR (Code 10)

**Causes:**
- SHA-1 fingerprint not in Firebase
- Wrong webClientId
- Package name mismatch

**Solutions:**
1. **Verify SHA-1 in Firebase** (see checklist above)
2. **Check webClientId** matches Google Cloud Console
3. **Verify package name** matches everywhere

---

### Issue 2: Wrong webClientId

**Symptoms:**
- Sign-in fails immediately
- DEVELOPER_ERROR
- No account picker appears

**Solution:**
- The webClientId must be a **Web application** OAuth client in Google Cloud Console
- Not an Android client
- Must be configured in the same Firebase project

---

### Issue 3: SHA-1 Not Propagated

**Symptoms:**
- SHA-1 added but still getting errors
- Works after waiting 10+ minutes

**Solution:**
- Firebase changes can take 5-10 minutes to propagate
- Wait and try again
- Clear app data: `adb shell pm clear com.spendly.money`

---

## 🔍 Debugging Steps

### 1. Check Current Configuration
```bash
# View the configured webClientId in logs
adb logcat | grep "Google Sign-In configured"
```

### 2. Check for Errors
```bash
# View all Google Sign-In related logs
adb logcat | grep -i "google\|signin" | tail -50
```

### 3. Verify google-services.json
```bash
cat google-services.json | grep -A 5 "package_name"
```

### 4. Test with Config Doctor
```bash
npx @react-native-google-signin/config-doctor --package-name com.spendly.money
```

---

## 📋 Alternative: Use Different webClientId

If the current webClientId doesn't work, try:

### Option 1: Use google-services.json webClientId
```javascript
webClientId: '913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f.apps.googleusercontent.com'
```

### Option 2: Create New Web OAuth Client
1. Go to Google Cloud Console
2. Create new OAuth 2.0 Client ID
3. Type: **Web application**
4. Use that client ID as webClientId

---

## ✅ Expected Configuration

### Current Setup:
```javascript
GoogleSignin.configure({
  webClientId: '913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com', // Same for iOS and Android
  iosClientId: '913299133500-c6hjl99i7q14h40ne17mm2e2jrh2q9pu.apps.googleusercontent.com', // iOS only
  offlineAccess: true,
  scopes: ['email', 'profile'],
});
```

---

## 🧪 Testing After Fix

1. **Rebuild:** `npx expo run:android`
2. **Clear app data:** `adb shell pm clear com.spendly.money`
3. **Test Google Sign-In**
4. **Check logs for errors**

---

## 📞 If Still Not Working

Please provide:
1. **Exact error message** from logs
2. **Error code** (if any)
3. **Screenshot** of the error (if visible)
4. **Logs output:** `adb logcat | grep -i "google\|signin\|error" | tail -30`

This will help identify the specific issue.

---

**Last Updated:** After changing Android webClientId to match iOS
