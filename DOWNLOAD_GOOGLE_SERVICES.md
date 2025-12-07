# 📥 Download Updated google-services.json

## Current Status

✅ **Android OAuth Client Created:**
- Client ID: `913299133500-amotbv2j7a0oocminjcai970i5tjn5mq.apps.googleusercontent.com`
- Package: `com.spendly.money`
- SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

❌ **google-services.json Not Updated:**
- Current file doesn't include the Android client
- Need to download updated file from Firebase

---

## 📋 Step-by-Step: Download Updated File

### Step 1: Go to Firebase Console

1. Open: https://console.firebase.google.com/
2. Select project: **spendly-f8628**
3. Click ⚙️ (gear icon) next to "Project Overview"
4. Select **"Project settings"**

### Step 2: Find Your Android App

1. Scroll down to **"Your apps"** section
2. Find the **Android app** with package name: `com.spendly.money`
3. If you don't see it, click **"Add app"** → **Android** and register it

### Step 3: Download google-services.json

1. In the Android app section, you'll see:
   - App nickname (if set)
   - Package name: `com.spendly.money`
   - **"Download google-services.json"** button
2. Click **"Download google-services.json"** button
3. The file will download to your Downloads folder

### Step 4: Replace in Your Project

**Option A: Using Terminal (Recommended)**
```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp

# Backup current file (optional)
cp google-services.json google-services.json.backup

# Replace with downloaded file
cp ~/Downloads/google-services.json ./google-services.json
```

**Option B: Manual**
1. Open Finder
2. Go to Downloads folder
3. Find `google-services.json`
4. Copy it
5. Go to your project root: `/Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp`
6. Replace the existing `google-services.json` file

### Step 5: Verify the Android Client is Included

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp

# Check for Android client (type 1)
cat google-services.json | grep -A 5 "client_type.*1"

# Check for your Android client ID
cat google-services.json | grep "amotbv2j7a0oocminjcai970i5tjn5mq"
```

**Expected output:**
- Should see `"client_type": 1` (Android client)
- Should see your Android client ID: `913299133500-amotbv2j7a0oocminjcai970i5tjn5mq`

### Step 6: Rebuild the App

```bash
# Clean and prebuild to include new google-services.json
npx expo prebuild --platform android --clean

# Build and install
npx expo run:android
```

---

## ⚠️ Important Notes

### If Firebase Doesn't Show Updated File:

1. **Wait 2-3 minutes:**
   - Firebase needs time to sync the new OAuth client
   - Try downloading again after waiting

2. **Check OAuth Client in Google Cloud:**
   - Go to Google Cloud Console
   - APIs & Services → Credentials
   - Verify the Android client exists and is saved

3. **Refresh Firebase Console:**
   - Try refreshing the page
   - Or close and reopen Firebase Console

### If Android App Not Registered in Firebase:

If you don't see the Android app in Firebase:

1. Click **"Add app"** → **Android**
2. Enter:
   - **Package name:** `com.spendly.money`
   - **App nickname:** "Spendly Money" (optional)
   - **Debug signing certificate SHA-1:** `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
3. Click **"Register app"**
4. Download `google-services.json`

---

## ✅ Expected google-services.json Structure

After downloading, your `google-services.json` should have:

```json
{
  "client": [{
    "oauth_client": [
      {
        "client_id": "913299133500-amotbv2j7a0oocminjcai970i5tjn5mq.apps.googleusercontent.com",
        "client_type": 1  // ← Your new Android client
      },
      {
        "client_id": "913299133500-6iap3k1rqitbd5gr92lf1uhsf8d8h36f.apps.googleusercontent.com",
        "client_type": 3  // ← Existing Web client
      }
    ]
  }]
}
```

---

## 🧪 After Rebuild: Test Google Sign-In

1. Open the app on Android device
2. Go to Login screen
3. Tap "Continue with Google"
4. Should work now! ✅

---

## 📋 Quick Checklist

- [ ] Go to Firebase Console → Project Settings
- [ ] Find Android app (`com.spendly.money`)
- [ ] Click "Download google-services.json"
- [ ] Replace file in project: `cp ~/Downloads/google-services.json ./google-services.json`
- [ ] Verify Android client: `cat google-services.json | grep "amotbv2j7a0oocminjcai970i5tjn5mq"`
- [ ] Rebuild: `npx expo prebuild --platform android --clean`
- [ ] Install: `npx expo run:android`
- [ ] Test Google Sign-In

---

**Once you download and replace the google-services.json file, rebuild the app and Android Google Sign-In should work!** 🚀
