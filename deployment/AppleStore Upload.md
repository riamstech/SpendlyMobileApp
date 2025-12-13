# Apple App Store Release Guide (Fresh Start)

This guide is a **clean, from-scratch, step-by-step process** to release your **Spendly iOS app** to **Apple App Store** using **Expo + React Native**. It assumes you want to **wipe old iOS artifacts and start fresh** to avoid signing, build, and upload issues.

---

## Part 0: One-Time Preparation (Do This Once)

### 0.1 Apple & System Requirements

Ensure the following are ready:

* ✅ Apple Developer Program (Individual or Organization)
* ✅ App created in **App Store Connect** (Bundle ID must already exist)
* ✅ Latest **Xcode** installed
* ✅ Command Line Tools installed:

```bash
xcode-select --install
```

* ✅ CocoaPods installed:

```bash
sudo gem install cocoapods
```

* ✅ Expo CLI (local usage):

```bash
npm install
```

---

## Part 1: FULL CLEAN RESET (Important)

This removes **all old iOS build data**, Pods, caches, and DerivedData.

### 1.1 Close Everything

* Close **Xcode**
* Stop Metro / Expo servers

### 1.2 Clear Derived Data (Global)

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### 1.3 Clean Project iOS Artifacts

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp

# Remove iOS native folder completely
rm -rf ios

# Optional: clear Expo cache
npx expo start -c
```

---

## Part 2: Verify App Configuration

### 2.1 Update Version & Build Number

Edit **app.config.js** (or app.json):

```js
expo: {
  version: "1.0.3", // increment if previously used
  ios: {
    buildNumber: "1", // MUST be unique every upload
    bundleIdentifier: "com.spendly.mobile",
    infoPlist: {
      NSCameraUsageDescription: "The app needs camera access to scan receipts.",
      NSPhotoLibraryUsageDescription: "The app needs photo access to upload receipts.",
      NSMicrophoneUsageDescription: "The app needs microphone access for video recording.",
      ITSAppUsesNonExemptEncryption: false
    }
  }
}
```

⚠️ **Rules**

* Build number must increase **every upload**
* Version increases only when you want a new App Store version

---

## Part 3: Recreate iOS Project (Fresh)

```bash
# Generate fresh ios folder
npx expo prebuild --platform ios --clean

# Install pods
cd ios
pod install
cd ..
```

---

## Part 4: Xcode Setup (Very Important)

### 4.1 Open Workspace

```bash
open ios/Spendly.xcworkspace
```

⚠️ Always open `.xcworkspace`, never `.xcodeproj`

---

### 4.2 Configure Signing

In Xcode:

1. Select **Spendly** (Project)
2. Select **Spendly** target
3. Go to **Signing & Capabilities**
4. ✅ Enable **Automatically manage signing**
5. Select your **Apple Developer Team**
6. Confirm:

    * Bundle ID: `com.spendly.mobile`
    * Provisioning Profile: Managed by Xcode
    * Signing Certificate: Apple Distribution

No red errors should appear ❗

---

### 4.3 Verify Version & Build

In **General → Identity**:

* Version → `1.0.3`
* Build → `1`

If wrong:

```bash
npx expo prebuild --platform ios --clean
```

Reopen Xcode.

---

## Part 5: Create Archive

### 5.1 Select Device

Top Xcode toolbar → select:

```
Any iOS Device (arm64)
```

(Not simulator ❌)

### 5.2 Archive

```
Product → Archive
```

* Wait until Organizer opens
* Archive must succeed without errors

---

## Part 6: Upload to App Store Connect

### 6.1 Distribute App

In Organizer:

1. Select archive
2. Click **Distribute App**
3. Choose **App Store Connect**
4. Click **Next**

---

### 6.2 Distribution Options (IMPORTANT)

Select carefully:

* ✅ Upload
* ❌ Include bitcode (unchecked)
* ❌ Upload app symbols (unchecked)
* ✅ Automatically manage signing

Why symbols unchecked?

* Prevents React Native / Hermes dSYM upload failures

Click **Upload**

---

## Part 7: App Store Connect Setup

### 7.1 Wait for Processing

* Go to **App Store Connect → My Apps → Spendly**
* Processing takes 10–60 minutes

---

### 7.2 TestFlight (Optional but Recommended)

* Open **TestFlight** tab
* Answer export compliance:

    * Encryption → **No**
* Add internal testers if needed

---

## Part 8: Submit to App Store

### 8.1 Create Version

* App Store → + Version → iOS
* Version: `1.0.3`

### 8.2 Required Fields

* App Name: Spendly
* Category: Finance
* Privacy Policy URL (mandatory)
* Support URL (mandatory)
* Description & Keywords
* Screenshots (real device screenshots only)

### 8.3 App Review Info

* Contact details
* Demo account (if login required)
* Notes for reviewer

---

## Part 9: Submit for Review

* Click **Add for Review**
* Submit

⏳ Review timeline:

* In Review: 24–48 hrs
* Approval: 1–3 days

---

## Part 10: After Approval

Choose release option:

* Automatic
* Manual (recommended for control)

Click **Release This Version** 🎉

---

## Common Failures & Fixes

| Issue                  | Fix                         |
| ---------------------- | --------------------------- |
| Build already exists   | Increment build number      |
| No signing certificate | Xcode → Settings → Accounts |
| Archive disabled       | Select Any iOS Device       |
| dSYM upload error      | Uncheck upload symbols      |

---

## FINAL PRE-UPLOAD CHECKLIST

* [ ] Build number incremented
* [ ] Tested on physical iPhone
* [ ] Privacy policy URL valid
* [ ] Demo account ready
* [ ] Screenshots uploaded
* [ ] No console crashes

---

✅ **This guide is optimized for ZERO rejections and clean uploads.**
