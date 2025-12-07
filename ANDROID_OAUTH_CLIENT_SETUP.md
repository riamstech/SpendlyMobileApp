# 🔧 Android OAuth Client Setup Guide

## Current OAuth Client Configuration

**Client ID:** `913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com`
**Type:** Web application ✅
**Status:** This is correct for `webClientId` in react-native-google-signin

---

## ⚠️ Important: SHA-1 Fingerprint Configuration

For Android Google Sign-In to work, you need to add the **SHA-1 fingerprint** to **TWO places**:

### 1. Firebase Console (Already Done ✅)
- Firebase Console → Project Settings → Android app
- SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

### 2. Google Cloud Console OAuth Client (May Be Missing ⚠️)

**For Web Application OAuth clients used with Android:**
- The SHA-1 fingerprint might also need to be associated with the OAuth client
- However, Web application clients typically don't require SHA-1
- **Android OAuth clients** (type 1) require SHA-1

---

## 🔍 Check if Android OAuth Client Exists

### Option 1: Check in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Project: **spendly-f8628**
3. **APIs & Services** → **Credentials**
4. Look for **OAuth 2.0 Client IDs**
5. Check if there's an **Android** type client with:
   - Package name: `com.spendly.money`
   - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

### Option 2: Check google-services.json

The `google-services.json` should have an Android OAuth client (type 1), but currently it only shows:
- Type 3 (Web client): `913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f.apps.googleusercontent.com`

**Missing:** Type 1 (Android client)

---

## ✅ Solution: Create Android OAuth Client

If there's no Android OAuth client, create one:

### Steps:

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Project: **spendly-f8628**

2. **Create OAuth Client:**
   - **APIs & Services** → **Credentials**
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

3. **Configure Android Client:**
   - **Application type:** Select **"Android"**
   - **Name:** "Spendly Android App" (or any name)
   - **Package name:** `com.spendly.money`
   - **SHA-1 certificate fingerprint:** `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - Click **"CREATE"**

4. **Download Updated google-services.json:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Project: **spendly-f8628**
   - ⚙️ → **Project settings**
   - Scroll to **Your apps** → Android app
   - Click **"Download google-services.json"**
   - Replace the existing file in your project

5. **Rebuild the app:**
   ```bash
   npx expo prebuild --platform android --clean
   npx expo run:android
   ```

---

## 📋 Current Configuration Status

### ✅ What's Working:
- Web OAuth client exists: `913299133500-pn633h3t96sht7ama46r8736jjfann5v`
- SHA-1 added to Firebase Console
- webClientId configured correctly in code

### ⚠️ What Might Be Missing:
- Android OAuth client (type 1) in Google Cloud Console
- Android OAuth client in google-services.json

---

## 🔄 Alternative: Use Only Web Client

If you want to use only the Web client (current approach):

1. **Ensure SHA-1 is in Firebase** ✅ (Already done)
2. **Verify webClientId matches** ✅ (Already configured)
3. **Wait for Firebase propagation** (5-10 minutes)
4. **Clear app data and test:**
   ```bash
   adb shell pm clear com.spendly.money
   ```

---

## 🧪 Testing After Creating Android OAuth Client

1. **Create Android OAuth client** (steps above)
2. **Download new google-services.json**
3. **Replace in project:**
   ```bash
   cp ~/Downloads/google-services.json ./google-services.json
   ```
4. **Rebuild:**
   ```bash
   npx expo prebuild --platform android --clean
   npx expo run:android
   ```
5. **Test Google Sign-In**

---

## 📊 Expected google-services.json Structure

After creating Android OAuth client, `google-services.json` should have:

```json
{
  "client": [{
    "oauth_client": [
      {
        "client_id": "...",
        "client_type": 1  // Android client
      },
      {
        "client_id": "...",
        "client_type": 3  // Web client
      }
    ]
  }]
}
```

---

## 🐛 If Still Not Working

1. **Check logs:**
   ```bash
   adb logcat | grep -i "google\|signin\|error" | tail -30
   ```

2. **Verify SHA-1 in both places:**
   - Firebase Console ✅
   - Google Cloud Console (if Android OAuth client exists)

3. **Try config doctor:**
   ```bash
   npx @react-native-google-signin/config-doctor --package-name com.spendly.money
   ```

---

**Last Updated:** After reviewing OAuth client configuration
