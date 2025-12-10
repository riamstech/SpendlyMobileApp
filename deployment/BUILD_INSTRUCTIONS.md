# Spendly Mobile App - Build Instructions

This document provides step-by-step instructions for generating native builds for both Android and iOS.

## Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js** (LTS version)
- **npm** or **yarn**
- **CocoaPods** (for iOS, `sudo gem install cocoapods`)
- **Xcode** (for iOS, available on macOS)
- **Android Studio** (for Android, with SDK and NDK installed)

## Initial Setup

Before building, verify dependencies are installed and the native directories are generated:

```bash
# Install dependencies
npm install

# (Optional) Prebuild to generate android/ios folders fresh
npx expo prebuild --clean
```

---

## 🤖 Android Build

### 1. Prebuild the Project
If you haven't already:
```bash
npx expo prebuild --platform android
```

### 2. Generate APK (Release)
Navigate to the `android` directory and run the Gradle assembler:

```bash
cd android
./gradlew assembleRelease
```

### 3. Locate the Output
Once the build is successful ("BUILD SUCCESSFUL"), the APK will be located at:
*   **Path:** `android/app/build/outputs/apk/release/app-release.apk`

### 4. Generate AAB (Android App Bundle) Support
To generate an `.aab` file for Google Play Store submission manually:

```bash
cd android
./gradlew bundleRelease
```

*   **Output Path:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## ☁️ Expo Application Services (EAS) Build

To generate cloud builds using EAS (requires an Expo account):

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Configure Build
If you haven't already configured the project:
```bash
eas build:configure
```

### 3. Run Build
*   **Android:**
    ```bash
    eas build --platform android --profile production
    ```
*   **iOS:**
    ```bash
    eas build --platform ios --profile production
    ```

*Note: Follow the CLI prompts to log in and set up credentials.*

---

## 🍎 iOS Build

### 1. Prebuild the Project
If you haven't already:
```bash
npx expo prebuild --platform ios
```

### 2. Install Pods
Ensure CocoaPods are installed and up to date:
```bash
cd ios
pod install
```

### 3. Configure Signing in Xcode
1.  Open the workspace:
    ```bash
    xed .. # Opens from ios folder, or use `open ios/Spendly.xcworkspace`
    ```
2.  In Xcode, verify the following:
    *   Select **Spendly** Project in the Navigator.
    *   Select **Spendly** Target.
    *   Go to **Signing & Capabilities**.
    *   Ensure **Automatically manage signing** is CHECKED.
    *   Select your **Team**.

### 4. Build and Run (Release Mode)
To run on a connected device as a standalone app:
1.  Connect your device.
2.  In Xcode Menu: **Product** > **Scheme** > **Edit Scheme...**
3.  Select **Run** on the sidebar.
4.  Change **Build Configuration** to **Release**.
5.  Click Close.
6.  Press **Play** (`Cmd + R`) to build and install.

### 5. Generate Release Build (Archive) for App Store
To create a build for App Store Connect distribution:

1.  **Select "Any iOS Device (arm64)"** as the storage target (instead of a specific connected device).
2.  In Xcode Menu: **Product** > **Archive**.
3.  Wait for the archiving process to complete.
4.  Once the "Organizer" window opens, select your archive and click **Distribute App**.
5.  Select **App Store Connect** > **Upload** > **Next**.
6.  Follow the prompts to handle signing and upload the build.

Alternatively, you can export the `.ipa` file and upload it using the **Transporter** app (available on Mac App Store).

---

## 🛠 Troubleshooting

*   **"Cannot find native module"**: This usually means the JavaScript bundle expects a native module that isn't linked.
    *   *Solution:* Run `npx expo prebuild --clean` to regenerate native code, then `pod install` (iOS) or sync Gradle (Android).
*   **Signing Errors (iOS)**:
    *   *Solution:* Always open the `.xcworkspace` file (not `.xcodeproj`) and check the "Signing & Capabilities" tab in Xcode.
*   **Gradle Errors**:
    *   *Solution:* Check if `local.properties` exists in `android/` with the correct `sdk.dir` path.

---

## ⚡ Local Native Build (Automated)

We have created a data-driven shell script to automate the native build process without using EAS Cloud.

**Prerequisites:**
- Android Studio & SDK installed (`$HOME/Library/Android/sdk`).
- Xcode installed (for iOS).
- Cocoapods installed (`sudo gem install cocoapods`).

**Usage:**

1.  **Make the script executable (if needed):**
    ```bash
    chmod +x deployment/build_native.sh
    ```

2.  **Run the script from project root:**
    ```bash
    # Build both platforms (Default)
    ./deployment/build_native.sh

    # Build Android only
    ./deployment/build_native.sh android

    # Build iOS only
    ./deployment/build_native.sh ios

    # Build with Version Bump (applies to package.json before build)
    ./deployment/build_native.sh android 1.0.5
    ./deployment/build_native.sh both 1.1.0

    # Build with Version and Output Folder (artifacts copied to folder)
    ./deployment/build_native.sh both 1.1.0 ./builds/v1.1.0
    ```

**iOS Export Note:**
To automatically generate an `.ipa` file after archiving, you need an `ExportOptions.plist` file in the `ios/` directory. If it doesn't exist, the script will stop at creating the `.xcarchive`, which you can verify/distribute via Xcode Organizer.

To generate `ExportOptions.plist`:
1.  Archive manually once in Xcode.
2.  "Distribute App" -> "Ad Hoc" (or desired method).
3.  Proceed until the summary screen.
4.  Export the artifacts; the folder will contain a valid `ExportOptions.plist`.
5.  Copy that file to `ios/ExportOptions.plist`.
