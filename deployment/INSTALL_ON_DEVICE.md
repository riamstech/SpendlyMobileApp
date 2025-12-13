# How to Install Release APK on Physical Device

This guide explains how to build and install the "pure native" release version of the app on your Android device locally.

## 1. Build the APK
The AAB file is for the Play Store. for direct installation, you need an **APK**.

Run this command in your terminal:
```bash
cd android
./gradlew assembleRelease
```
*Output: `android/app/build/outputs/apk/release/app-release.apk`*

## 2. Connect Your Device
1.  Connect your Android phone via USB.
2.  Enable **Developer Options** (Settings > About Phone > Tap "Build Number" 7 times).
3.  Enable **USB Debugging** in Developer Options.
4.  Verify connection:
    ```bash
    adb devices
    ```

## 3. Install the App
Run this command from the project root:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

*   `-r`: Reinstalls the app if it already exists (keeping data).

## Troubleshooting
*   **"Device unauthorized"**: Check your phone screen and tap "Allow" on the USB debugging prompt.
*   **"App not installed"**: You might have a Debug version installed. Uninstall the existing app manually from your phone and try again.
