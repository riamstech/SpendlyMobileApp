# Spendly Mobile App - Build Instructions

This document provides step-by-step instructions for building the Spendly mobile app for both development (with Expo server) and production (standalone) releases.

## Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js** (LTS version)
- **npm** or **yarn**
- **CocoaPods** (for iOS, `sudo gem install cocoapods`)
- **Xcode** (for iOS, available on macOS)
- **Android Studio** (for Android, with SDK and NDK installed)
- **expo-dev-client** (for development builds with Expo server)

## Initial Setup

Before building, verify dependencies are installed and the native directories are generated:

```bash
# Install dependencies
npm install

# (Optional) Prebuild to generate android/ios folders fresh
npx expo prebuild --clean
```

---

## 📱 Part 1: Development Builds (WITH Expo Server)

These builds require the Expo development server (Metro bundler) to run. They are used for development and testing on physical devices.

### 🤖 Android: Development Build with Expo Server

#### Step 1: Start Expo Development Server
```bash
# From project root
npm start
# or
expo start --dev-client
```

#### Step 2: Build and Install Development APK
```bash
# Prebuild if needed
npx expo prebuild --platform android

# Build development APK
cd android
./gradlew assembleDebug

# The APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Step 3: Install to Physical Device
```bash
# Connect your Android device via USB
# Enable USB Debugging in Developer Options

# Install the APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or replace existing installation
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

#### Step 4: Connect to Expo Server
1. Launch the app on your device
2. The app will show a connection screen
3. Ensure your device and computer are on the same network
4. Scan the QR code or enter the connection URL manually
5. The app will connect to the Expo development server and load your JavaScript

**Note:** The app requires the Expo server to be running (`npm start`) to function.

### 🍎 iOS: Development Build with Expo Server

#### Step 1: Start Expo Development Server
```bash
# From project root
npm start
# or
expo start --dev-client
```

#### Step 2: Build and Install Development App
```bash
# Prebuild if needed
npx expo prebuild --platform ios

# Install pods
cd ios
pod install
cd ..

# Build and run via Xcode
open ios/Spendly.xcworkspace
```

#### Step 3: Configure and Build in Xcode
1. **Open the workspace** in Xcode (already opened above)
2. **Connect your iOS device** via USB
3. **Select your device** from the device selector
4. **Configure signing:**
   - Select **Spendly** project in Navigator
   - Select **Spendly** target
   - Go to **Signing & Capabilities**
   - Check **Automatically manage signing**
   - Select your **Team**
5. **Build Configuration:** Keep it as **Debug** (default)
6. **Press Play** (`Cmd + R`) to build and install

#### Step 4: Connect to Expo Server
1. Launch the app on your device
2. The app will show a connection screen
3. Ensure your device and computer are on the same network
4. Scan the QR code or enter the connection URL manually
5. The app will connect to the Expo development server and load your JavaScript

**Note:** The app requires the Expo server to be running (`npm start`) to function.

---

## 🚀 Part 2: Production Builds (WITHOUT Expo Server - Standalone)

These builds are **standalone applications** that run independently without requiring Expo Go or an Expo development server. All JavaScript is bundled into the app.

### ⚠️ Important: Remove expo-dev-client for Production

For true standalone production builds, you need to remove `expo-dev-client`:

```bash
# Remove expo-dev-client
npm uninstall expo-dev-client

# Clean iOS build artifacts
cd ios
rm -rf Pods Podfile.lock build
cd ..

# Clean Android build artifacts
cd android
./gradlew clean
cd ..

# Regenerate native code
npx expo prebuild --platform all --clean

# Reinstall iOS pods
cd ios
pod install
cd ..
```

**Alternative:** If you want to keep `expo-dev-client` for development, use EAS Build with production profile (see EAS Build section below).

---

### 🤖 Android: Production Standalone Build

#### Step 1: Generate Production APK
```bash
# Navigate to android directory
cd android

# Build release APK
./gradlew assembleRelease

# The APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

#### Step 2: Install Production APK to Device
```bash
# Connect your Android device via USB
# Enable USB Debugging

# Install the APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Or replace existing installation
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Note:** The app will run standalone without requiring Expo server.

---

### 🍎 iOS: Production Standalone Build

#### Step 1: Build Production App
```bash
# Ensure pods are installed
cd ios
pod install
cd ..

# Build via command line
cd ios
xcodebuild -workspace Spendly.xcworkspace \
  -scheme Spendly \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  clean build

# The built app will be at:
# ~/Library/Developer/Xcode/DerivedData/Spendly-*/Build/Products/Release-iphoneos/Spendly.app
```

#### Step 2: Install to Physical Device via Xcode
1. **Open the workspace:**
   ```bash
   open ios/Spendly.xcworkspace
   ```

2. **Connect your iOS device** via USB

3. **Select your device** from the device selector

4. **Configure signing:**
   - Select **Spendly** project in Navigator
   - Select **Spendly** target
   - Go to **Signing & Capabilities**
   - Check **Automatically manage signing**
   - Select your **Team**

5. **Set Build Configuration to Release:**
   - Go to **Product** > **Scheme** > **Edit Scheme...**
   - Select **Run** on the sidebar
   - Change **Build Configuration** to **Release**
   - Click **Close**

6. **Build and install:**
   - Press **Play** (`Cmd + R`) or go to **Product** > **Run**

**Note:** The app will run standalone without requiring Expo server.

---

## 📦 Part 3: Generate Production Release Files (.aab and .ipa)

These are the files you need to submit to Google Play Store (.aab) and Apple App Store (.ipa).

### 🤖 Generate Android App Bundle (.aab) for Google Play Store

#### Command to Generate .aab File:
```bash
cd android
./gradlew bundleRelease
```

#### Output Location:
```
android/app/build/outputs/bundle/release/app-release.aab
```

#### Verify the .aab File:
```bash
# Check file exists and size
ls -lh android/app/build/outputs/bundle/release/app-release.aab

# Should show file size (typically 20-50MB)
```

#### Upload to Google Play Console:
1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Go to **Production** > **Create new release**
4. Upload the `.aab` file from `android/app/build/outputs/bundle/release/app-release.aab`
5. Fill in release notes and submit

---

### 🍎 Generate iOS App Archive (.ipa) for App Store

#### Method 1: Using Xcode (Recommended)

#### Step 1: Archive the App
1. **Open the workspace:**
   ```bash
   open ios/Spendly.xcworkspace
   ```

2. **Select "Any iOS Device (arm64)"** from the device selector (not a specific device)

3. **Configure for Release:**
   - Go to **Product** > **Scheme** > **Edit Scheme...**
   - Select **Archive** on the sidebar
   - Ensure **Build Configuration** is set to **Release**
   - Click **Close**

4. **Create Archive:**
   - Go to **Product** > **Archive**
   - Wait for the archiving process to complete (may take several minutes)
   - The **Organizer** window will open automatically

#### Step 2: Export .ipa File
1. In the **Organizer** window, select your archive
2. Click **Distribute App**
3. Choose distribution method:
   - **App Store Connect** - For App Store submission
   - **Ad Hoc** - For testing on specific devices
   - **Enterprise** - For enterprise distribution
   - **Development** - For development testing
4. Click **Next** and follow the prompts
5. Choose signing options (usually "Automatically manage signing")
6. Click **Export**
7. Choose a location to save the `.ipa` file

#### Output Location:
The `.ipa` file will be saved to the location you specified (typically your Desktop or Downloads folder).

#### Method 2: Using Command Line (Advanced)

#### Step 1: Create Archive
```bash
cd ios

# Create archive
xcodebuild -workspace Spendly.xcworkspace \
  -scheme Spendly \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath ./build/Spendly.xcarchive \
  archive
```

#### Step 2: Export .ipa File
You need an `ExportOptions.plist` file. Create it or use one from a previous export:

```bash
# Export IPA for App Store
xcodebuild -exportArchive \
  -archivePath ./build/Spendly.xcarchive \
  -exportPath ./build/ipa \
  -exportOptionsPlist ExportOptions.plist
```

#### Create ExportOptions.plist (if needed):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>9YJ79K2L2D</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
```

Save this as `ios/ExportOptions.plist` and adjust the `teamID` if needed.

#### Output Location:
```
ios/build/ipa/Spendly.ipa
```

#### Upload to App Store Connect:
1. Use **Transporter** app (available on Mac App Store)
2. Or use Xcode Organizer: **Distribute App** > **App Store Connect** > **Upload**
3. Or use command line:
   ```bash
   xcrun altool --upload-app \
     --type ios \
     --file ios/build/ipa/Spendly.ipa \
     --username YOUR_APPLE_ID \
     --password YOUR_APP_SPECIFIC_PASSWORD
   ```

---

## ☁️ EAS Build (Alternative - Cloud Builds)

EAS Build is Expo's cloud build service. It handles the build process in the cloud and can generate production builds without removing `expo-dev-client`.

### Setup EAS Build

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Configure build (if not already done)
eas build:configure
```

### Build Commands

#### Development Build (with dev client):
```bash
# Android
eas build --platform android --profile development

# iOS
eas build --platform ios --profile development
```

#### Production Build (standalone, no dev server):
```bash
# Android - generates .aab
eas build --platform android --profile production

# iOS - generates .ipa
eas build --platform ios --profile production
```

#### Preview Build (standalone, for testing):
```bash
# Android - generates .apk
eas build --platform android --profile preview

# iOS - generates .ipa
eas build --platform ios --profile preview
```

The `eas.json` file already has these profiles configured:
- **development**: `developmentClient: true` (requires Expo server)
- **preview**: `developmentClient: false` (standalone)
- **production**: `developmentClient: false` (standalone)

---

## 📱 Installing Standalone Builds to Physical Devices

### 🤖 Android: Install APK/AAB to Physical Device

#### Prerequisites:
- **Android Debug Bridge (ADB)** installed (comes with Android Studio SDK Platform Tools)
- **USB Debugging** enabled on your Android device:
  1. Go to **Settings** > **About Phone**
  2. Tap **Build Number** 7 times to enable Developer Options
  3. Go to **Settings** > **Developer Options**
  4. Enable **USB Debugging**
- Device connected via USB cable

#### Installation Steps:

1. **Verify device connection:**
   ```bash
   adb devices
   ```
   You should see your device listed.

2. **Install the APK:**
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

3. **For replacing an existing installation:**
   ```bash
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Wireless Installation (ADB over WiFi):**
   ```bash
   # Connect device via USB first
   adb tcpip 5555
   
   # Find device IP address
   adb shell ip addr show wlan0 | grep "inet "
   
   # Connect wirelessly
   adb connect <DEVICE_IP>:5555
   
   # Install APK
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

**Note:** `.aab` files cannot be installed directly. They must be uploaded to Google Play Store. For direct installation, use `.apk` files.

### 🍎 iOS: Install to Physical Device

#### Method 1: Direct Installation via Xcode
1. **Connect your iOS device** to your Mac via USB cable
2. **Trust the computer** on your device (if prompted)
3. **Open the project in Xcode:**
   ```bash
   open ios/Spendly.xcworkspace
   ```
4. **Select your device** from the device selector
5. **Press Play** (`Cmd + R`) to build and install

#### Method 2: Install IPA File
1. **Export IPA from Xcode** (see Part 3 above)
2. **Install via Xcode:**
   - Open **Xcode** > **Window** > **Devices and Simulators**
   - Select your connected device
   - Drag and drop the `.ipa` file into the **Installed Apps** section

3. **Install via Finder (macOS Catalina+):**
   - Connect your device
   - Open **Finder** and select your device from the sidebar
   - Drag and drop the `.ipa` file into the device window

4. **Trust the Developer Certificate (First Time Only):**
   - On your iOS device, go to **Settings** > **General** > **VPN & Device Management**
   - Find your developer certificate and tap **Trust**

#### Method 3: Install via TestFlight (For Beta Testing)
1. Upload `.ipa` to App Store Connect via Xcode or Transporter
2. Add testers in App Store Connect
3. Testers install via TestFlight app

---

## 🔍 Verifying Build Type

### Development Build (with Expo server):
- ✅ Requires `npm start` or `expo start` to be running
- ✅ Shows connection screen on launch
- ✅ JavaScript loads from development server
- ✅ Hot reload and fast refresh work
- ✅ Can use Expo dev tools

### Production Build (standalone):
- ✅ Works without Expo server
- ✅ No connection screen on launch
- ✅ JavaScript bundled in `main.jsbundle` (Android) or app bundle (iOS)
- ✅ App size: ~30-50MB (includes bundled JavaScript)
- ✅ Works offline (for basic functionality)

### Verify Standalone Build:
```bash
# Android: Check APK contains bundled JS
unzip -l android/app/build/outputs/apk/release/app-release.apk | grep -i "index.android.bundle\|assets/index.android.bundle"

# iOS: Check app bundle contains main.jsbundle
ls -lh ~/Library/Developer/Xcode/DerivedData/Spendly-*/Build/Products/Release-iphoneos/Spendly.app/main.jsbundle
```

---

## 🛠 Troubleshooting

### Build Issues

*   **"Cannot find native module"**: 
    *   *Solution:* Run `npx expo prebuild --clean` to regenerate native code, then `pod install` (iOS) or sync Gradle (Android).

*   **Signing Errors (iOS)**:
    *   *Solution:* Always open the `.xcworkspace` file (not `.xcodeproj`) and check the "Signing & Capabilities" tab in Xcode.

*   **Gradle Errors**:
    *   *Solution:* Check if `local.properties` exists in `android/` with the correct `sdk.dir` path.

*   **App shows "Unable to connect to Expo" after production build**:
    *   *Solution:* This means `expo-dev-client` is still included. Remove it and rebuild (see Part 2 instructions).

### Device Installation Issues

*   **Android: "device unauthorized" or "device offline"**:
    *   *Solution:* 
        - Check USB debugging is enabled on device
        - Accept the "Allow USB debugging" prompt on your device
        - Try `adb kill-server && adb start-server`
        - Verify connection with `adb devices`

*   **Android: "INSTALL_FAILED_INSUFFICIENT_STORAGE"**:
    *   *Solution:* Free up space on your device

*   **Android: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"**:
    *   *Solution:* Uninstall the existing app first: `adb uninstall com.spendly.money`

*   **iOS: "No devices found" in Xcode**:
    *   *Solution:*
        - Ensure device is unlocked and trusted
        - Check USB cable connection
        - Restart Xcode and reconnect device
        - Verify device appears in **Window** > **Devices and Simulators**

*   **iOS: "No signing certificate found"**:
    *   *Solution:*
        - Ensure you have a valid Apple Developer account
        - In Xcode, go to **Preferences** > **Accounts** and add your Apple ID
        - Select your team in **Signing & Capabilities**

*   **iOS: App installs but crashes immediately**:
    *   *Solution:*
        - Check device logs in Xcode: **Window** > **Devices and Simulators** > Select device > **View Device Logs**
        - Verify all native dependencies are properly linked
        - Ensure the app is built for the correct architecture (arm64 for physical devices)

---

## ⚡ Quick Reference: Build Commands

### Development Builds (with Expo server):
```bash
# Start Expo server
npm start

# Android
cd android && ./gradlew assembleDebug

# iOS
# Use Xcode with Debug configuration
```

### Production Builds (standalone):
```bash
# Remove expo-dev-client first
npm uninstall expo-dev-client
npx expo prebuild --platform all --clean

# Android APK
cd android && ./gradlew assembleRelease

# Android AAB (for Play Store)
cd android && ./gradlew bundleRelease

# iOS (via Xcode)
# Archive in Xcode, then export .ipa

# iOS (via command line)
cd ios && xcodebuild -workspace Spendly.xcworkspace -scheme Spendly -configuration Release -destination 'generic/platform=iOS' archive
```

### EAS Build:
```bash
# Production Android AAB
eas build --platform android --profile production

# Production iOS IPA
eas build --platform ios --profile production
```

---

## 📝 Important Notes

- **Development builds** require the Expo development server to be running
- **Production builds** are standalone and don't require any server
- **.aab files** are for Google Play Store submission only (cannot install directly)
- **.ipa files** are for App Store submission or Ad Hoc/Enterprise distribution
- Always test production builds on physical devices before submitting to stores
- Ensure API endpoints are correctly configured in environment variables for production builds
