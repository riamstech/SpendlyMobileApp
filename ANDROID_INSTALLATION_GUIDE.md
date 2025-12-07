# 📱 Android Installation Guide

## ✅ Current Status

The Spendly app is **installed** on your Android device!

- **Package Name:** `com.spendly.money`
- **Version:** 1.0.0
- **Device:** WCR7N18822001158

---

## 🚀 Quick Start

### Launch the App

**Option 1: From Device**
- Open your Android device
- Find "Spendly Money" in your app drawer
- Tap to launch

**Option 2: Via ADB**
```bash
adb shell monkey -p com.spendly.money -c android.intent.category.LAUNCHER 1
```

---

## 🔨 Rebuild & Reinstall

### Method 1: Development Build (Recommended)

This builds and installs directly to your connected device:

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
npx expo run:android
```

**What it does:**
1. Builds the Android APK
2. Installs it on your connected device
3. Launches the app automatically

**Requirements:**
- Android device connected via USB
- USB debugging enabled
- `adb devices` shows your device

---

### Method 2: Expo Go (Quick Testing)

For quick testing without building:

1. **Install Expo Go** from Google Play Store
2. **Start Expo dev server:**
   ```bash
   npm start
   ```
3. **Scan QR code** with Expo Go app
4. App loads instantly! ⚡

**Note:** Some native features may not work in Expo Go.

---

### Method 3: Build APK for Manual Installation

Build a standalone APK you can install manually:

```bash
# Using EAS Build (cloud build)
npx eas build --platform android --profile preview

# Or build locally
cd android
./gradlew assembleRelease
# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

Then install the APK:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 🛠️ Setup Requirements

### Android SDK Configuration

The Android SDK path is configured in:
```
android/local.properties
```

**SDK Location:** `/Users/mahammadrasheed/Library/Android/sdk`

If you need to update it, edit `android/local.properties`:
```properties
sdk.dir=/path/to/your/android/sdk
```

---

## 📋 Prerequisites

### 1. Android Development Tools

✅ **Already Installed:**
- Android SDK: `/Users/mahammadrasheed/Library/Android/sdk`
- ADB: `/usr/local/bin/adb`
- Java: `/usr/bin/java`

### 2. Device Setup

**Enable USB Debugging:**
1. Go to Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back to Settings → Developer Options
4. Enable "USB Debugging"
5. Connect device via USB

**Verify Connection:**
```bash
adb devices
# Should show: WCR7N18822001158    device
```

---

## 🔍 Troubleshooting

### Issue: "SDK location not found"

**Solution:**
```bash
# Create/update local.properties
echo "sdk.dir=/Users/mahammadrasheed/Library/Android/sdk" > android/local.properties
```

### Issue: "Device not found"

**Solution:**
1. Check USB connection
2. Verify USB debugging is enabled
3. Try: `adb kill-server && adb start-server`
4. Check: `adb devices`

### Issue: "Build failed"

**Solution:**
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
npx expo run:android
```

### Issue: "App crashes on launch"

**Solution:**
1. Check logs: `adb logcat | grep -i spendly`
2. Clear app data: `adb shell pm clear com.spendly.money`
3. Reinstall: `npx expo run:android`

---

## 📱 App Information

- **Package:** `com.spendly.money`
- **Label:** Spendly Money
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 36
- **Build Tools:** 36.0.0

---

## 🎯 Next Steps

1. **Test the app** on your device
2. **Check logs** if issues occur:
   ```bash
   adb logcat | grep -i spendly
   ```
3. **Rebuild** when you make changes:
   ```bash
   npx expo run:android
   ```

---

## 📚 Useful Commands

```bash
# List installed packages
adb shell pm list packages | grep spendly

# Uninstall app
adb uninstall com.spendly.money

# View app info
adb shell dumpsys package com.spendly.money

# View logs
adb logcat | grep -i spendly

# Launch app
adb shell monkey -p com.spendly.money -c android.intent.category.LAUNCHER 1

# Clear app data
adb shell pm clear com.spendly.money
```

---

## ✅ Installation Complete!

Your Spendly app is ready to use on your Android device! 🎉

For questions or issues, check the logs or rebuild the app.
