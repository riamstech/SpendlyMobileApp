# Fix: Build iOS App in Release Mode (Not Debug)

## The Problem

You got this error:
```
No script URL provided. Make sure the packager is running or you have embedded a JS bundle in your application bundle.
```

This happens because Xcode built in **Debug mode** which requires the Metro bundler (React Native packager) to be running. For a standalone native app, you need **Release mode**.

## Solution: Build in Release Mode in Xcode

### Method 1: Change Scheme in Xcode (Recommended)

1. **In Xcode**, click on **"Spendly"** next to the device selector at the top
2. Select **"Edit Scheme..."**
3. In the left sidebar, select **"Run"**
4. Change **"Build Configuration"** from **"Debug"** to **"Release"**
5. Click **"Close"**
6. **Product > Clean Build Folder** (Cmd+Shift+K)
7. Click **Play button ▶️** to build and run

### Method 2: Command Line (Alternative)

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp/ios

# Build Release version
xcodebuild -workspace Spendly.xcworkspace \
  -scheme Spendly \
  -configuration Release \
  -destination 'platform=iOS,name=Rasheed' \
  -allowProvisioningUpdates \
  clean build

# Install on device
xcrun devicectl device install app \
  --device 2AD079F5-12BF-5F53-9CA5-F33436ED0889 \
  ~/Library/Developer/Xcode/DerivedData/Spendly-*/Build/Products/Release-iphoneos/Spendly.app
```

## Why This Happens

- **Debug builds**: Look for Metro bundler at `http://192.168.68.100:8081`
- **Release builds**: Have JavaScript bundle embedded, work standalone

## Verification

After building in Release mode, the app should:
- ✅ Launch without requiring Metro bundler
- ✅ Work completely offline (for UI)
- ✅ Only need internet for API calls
- ✅ Show "Sign in with Apple" button

---

**Current Status**: Release build is running in terminal...
