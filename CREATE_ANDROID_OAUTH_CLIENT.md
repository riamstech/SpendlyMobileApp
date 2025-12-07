# 🔧 Create Android OAuth Client - Step by Step

## Current Situation

You have:
- ✅ **Web OAuth Client:** `913299133500-pn633h3t96sht7ama46r8736jjfann5v` (for webClientId)
- ❌ **Android OAuth Client:** Missing (needed for native Android sign-in)

## Why Android OAuth Client is Needed

For `react-native-google-signin` on Android:
- **webClientId** (Web app) - Used for idToken generation ✅ You have this
- **Android OAuth Client** (type 1) - Used for native Android sign-in flow ❌ Missing

The Android OAuth client is automatically read from `google-services.json`, but it needs to be created first.

---

## 📋 Step-by-Step: Create Android OAuth Client

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com/
2. Select project: **spendly-f8628**
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Create OAuth Client ID

1. Click **"+ CREATE CREDENTIALS"** button (top of page)
2. Select **"OAuth client ID"**

### Step 3: Configure Android Client

1. **Application type:** Select **"Android"** (not Web application)
2. **Name:** Enter `Spendly Android App` (or any descriptive name)
3. **Package name:** Enter `com.spendly.money`
4. **SHA-1 certificate fingerprint:** Enter:
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```
5. Click **"CREATE"** button

### Step 4: Download Updated google-services.json

After creating the Android OAuth client:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project: **spendly-f8628**
3. Click ⚙️ (gear icon) → **Project settings**
4. Scroll to **"Your apps"** section
5. Find your **Android app** (`com.spendly.money`)
6. Click **"Download google-services.json"** button
7. **Replace** the existing `google-services.json` in your project root

### Step 5: Verify google-services.json

After downloading, check that it now includes an Android OAuth client:

```bash
cat google-services.json | grep -A 10 "client_type"
```

You should see:
- `"client_type": 1` (Android client) ✅
- `"client_type": 3` (Web client) ✅

### Step 6: Rebuild the App

```bash
# Clean and prebuild
npx expo prebuild --platform android --clean

# Rebuild and install
npx expo run:android
```

### Step 7: Test Google Sign-In

1. Open the app
2. Go to Login screen
3. Tap "Continue with Google"
4. Should work now! ✅

---

## 📊 Expected Result

After creating Android OAuth client:

### In Google Cloud Console:
- You'll see **two** OAuth clients:
  1. **Web application:** `913299133500-pn633h3t96sht7ama46r8736jjfann5v` (existing)
  2. **Android:** New client with package `com.spendly.money` (new)

### In google-services.json:
```json
{
  "client": [{
    "oauth_client": [
      {
        "client_id": "...",
        "client_type": 1  // ← New Android client
      },
      {
        "client_id": "913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f",
        "client_type": 3  // ← Existing Web client
      }
    ]
  }]
}
```

---

## ⚠️ Important Notes

1. **SHA-1 Fingerprint:**
   - Must match your debug keystore: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
   - For release builds, you'll need to add the release SHA-1 later

2. **Package Name:**
   - Must exactly match: `com.spendly.money`
   - Check in `app.json` → `android.package`

3. **Firebase Sync:**
   - After creating Android OAuth client, download new `google-services.json`
   - Changes can take a few minutes to sync

---

## 🐛 Troubleshooting

### If Android OAuth Client Creation Fails:

1. **Check package name:** Must be exactly `com.spendly.money`
2. **Check SHA-1 format:** Use colons, no spaces
3. **Verify project:** Make sure you're in the correct Google Cloud project

### If google-services.json Doesn't Update:

1. Wait 2-3 minutes for Firebase to sync
2. Try downloading again
3. Check Firebase Console → Project Settings → Android app

### If Still Not Working After Creating Android Client:

1. **Verify both clients exist:**
   - Web client: `913299133500-pn633h3t96sht7ama46r8736jjfann5v`
   - Android client: New one with package `com.spendly.money`

2. **Check logs:**
   ```bash
   adb logcat | grep -i "google\|signin\|error" | tail -30
   ```

3. **Clear app data:**
   ```bash
   adb shell pm clear com.spendly.money
   ```

---

## ✅ Checklist

- [ ] Android OAuth client created in Google Cloud Console
- [ ] Package name: `com.spendly.money`
- [ ] SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- [ ] New `google-services.json` downloaded from Firebase
- [ ] `google-services.json` replaced in project
- [ ] App rebuilt with `npx expo prebuild --platform android --clean`
- [ ] Google Sign-In tested and working

---

**This should fix the Android Google Sign-In issue!** 🎉
