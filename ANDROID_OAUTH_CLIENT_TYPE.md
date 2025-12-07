# ⚠️ Android OAuth Client Type Issue

## What You Created

You created an **"Installed" application** type OAuth client:
- **Client ID:** `913299133500-amotbv2j7a0oocminjcai970i5tjn5mq.apps.googleusercontent.com`
- **Type:** Installed application

## What You Need

For Android with `react-native-google-signin`, you need an **"Android" application** type OAuth client, not "Installed".

---

## 🔄 Solution: Create Correct Android OAuth Client

### Step 1: Delete or Keep the Installed Client

You can keep the "Installed" client (it won't hurt), but you need to create an **Android** type client.

### Step 2: Create Android OAuth Client

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Project: **spendly-f8628**
   - **APIs & Services** → **Credentials**

2. **Create New OAuth Client:**
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - **Application type:** Select **"Android"** (NOT "Installed")
   - **Name:** "Spendly Android App"
   - **Package name:** `com.spendly.money`
   - **SHA-1 certificate fingerprint:**
     ```
     5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
     ```
   - Click **"CREATE"**

3. **Note the New Client ID:**
   - You'll get a new client ID (different from the installed one)
   - This will be the Android OAuth client

### Step 3: Download Updated google-services.json

After creating the Android OAuth client:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project: **spendly-f8628**
3. ⚙️ → **Project settings**
4. Scroll to **"Your apps"** → Android app (`com.spendly.money`)
5. Click **"Download google-services.json"**
6. **Replace** the existing file in your project

### Step 4: Verify google-services.json

After downloading, check that it includes the Android client:

```bash
cat google-services.json | grep -A 5 "client_type"
```

You should see:
- `"client_type": 1` ← Android client (NEW)
- `"client_type": 3` ← Web client (existing)

### Step 5: Rebuild

```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

---

## 📊 Difference Between Client Types

### "Installed" Application Type:
- Used for desktop applications
- Used for Chrome extensions
- **NOT suitable for Android native apps**

### "Android" Application Type:
- Used for Android native applications
- Requires package name and SHA-1 fingerprint
- **This is what you need** ✅

### "Web application" Type:
- Used for web apps and server-side
- Used as `webClientId` in react-native-google-signin
- **You already have this** ✅

---

## ✅ Expected Configuration After Fix

### In Google Cloud Console, you'll have:
1. **Web application:** `913299133500-pn633h3t96sht7ama46r8736jjfann5v` (for webClientId)
2. **Android:** New client with package `com.spendly.money` (for native Android sign-in)
3. **Installed:** `913299133500-amotbv2j7a0oocminjcai970i5tjn5mq` (can keep or delete)

### In google-services.json:
```json
{
  "client": [{
    "oauth_client": [
      {
        "client_id": "NEW_ANDROID_CLIENT_ID",
        "client_type": 1  // ← Android client
      },
      {
        "client_id": "913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f",
        "client_type": 3  // ← Web client
      }
    ]
  }]
}
```

### In Your Code:
```javascript
GoogleSignin.configure({
  webClientId: '913299133500-pn633h3t96sht7ama46r8736jjfann5v.apps.googleusercontent.com', // Web client
  // Android client is automatically read from google-services.json
});
```

---

## 🐛 If You Can't Create Android Type

If the "Android" option is not available:

1. **Check OAuth consent screen:**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Make sure it's configured (even if in testing mode)

2. **Check API enablement:**
   - Go to **APIs & Services** → **Library**
   - Search for "Google Sign-In API" or "Identity Toolkit API"
   - Make sure it's enabled

3. **Try different browser:**
   - Sometimes the UI differs between browsers

---

## 📋 Quick Checklist

- [ ] Created **Android** type OAuth client (not Installed)
- [ ] Package name: `com.spendly.money`
- [ ] SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- [ ] Downloaded new `google-services.json` from Firebase
- [ ] Replaced `google-services.json` in project
- [ ] Rebuilt app: `npx expo prebuild --platform android --clean`
- [ ] Tested Google Sign-In

---

**The key is: Create an "Android" type client, not "Installed"!** 🎯
