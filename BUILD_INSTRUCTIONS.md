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

---

## 🛠 Troubleshooting

*   **"Cannot find native module"**: This usually means the JavaScript bundle expects a native module that isn't linked.
    *   *Solution:* Run `npx expo prebuild --clean` to regenerate native code, then `pod install` (iOS) or sync Gradle (Android).
*   **Signing Errors (iOS)**:
    *   *Solution:* Always open the `.xcworkspace` file (not `.xcodeproj`) and check the "Signing & Capabilities" tab in Xcode.
*   **Gradle Errors**:
    *   *Solution:* Check if `local.properties` exists in `android/` with the correct `sdk.dir` path.
