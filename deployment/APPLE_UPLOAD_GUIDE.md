# Apple App Store Upload Guide - Step by Step

This guide provides detailed, rejection-proof instructions for uploading the Spendly iOS app to TestFlight and the App Store.

---

## Prerequisites

Before starting, ensure you have:

✅ **Apple Developer Account** (enrolled in Apple Developer Program - $99/year)  
✅ **Xcode** (latest stable version from Mac App Store)  
✅ **CocoaPods** installed (`sudo gem install cocoapods`)  
✅ **App Store Connect** access with proper permissions  
✅ **Valid provisioning profiles and certificates** (Xcode can manage these automatically)

---

## Part 1: Pre-Upload Checklist

### 1.1 Update Version and Build Numbers

**Current Configuration (app.config.js):**
- **Version:** `1.0.2`
- **Build Number:** `3`

**Important Rules:**
- **Version** (`CFBundleShortVersionString`): User-facing version (e.g., 1.0.2)
- **Build Number** (`CFBundleVersion`): Must be **unique** and **incrementing** for each upload
- If you've already uploaded build `3` for version `1.0.2`, you must increment to `4` for the next upload

**To Update:**
1. Open `app.config.js`
2. Update `version` (if needed): `version: "1.0.2"`
3. Update `ios.buildNumber`: `buildNumber: "3"` (or higher if 3 is already uploaded)

### 1.2 Verify Required Permissions

Ensure all required permission descriptions are present in `app.config.js`:

```javascript
ios: {
  infoPlist: {
    NSCameraUsageDescription: "The app needs camera access to let you take photos of receipts.",
    NSPhotoLibraryUsageDescription: "The app needs photo library access to let you select receipt images.",
    NSMicrophoneUsageDescription: "The app needs microphone access to record videos.",
    ITSAppUsesNonExemptEncryption: false
  }
}
```

**Why This Matters:**
- Missing permission descriptions will cause **instant rejection**
- Apple requires clear explanations for why you need each permission
- `ITSAppUsesNonExemptEncryption: false` is required if you're not using custom encryption

### 1.3 Clean Build Environment

```bash
# Navigate to project root
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp

# Clean iOS build artifacts
cd ios
rm -rf Pods Podfile.lock build DerivedData
cd ..

# Regenerate native iOS project
npx expo prebuild --platform ios --clean

# Install CocoaPods dependencies
cd ios
pod install
cd ..
```

---

## Part 2: Build and Archive in Xcode

### 2.1 Open Project in Xcode

```bash
open ios/Spendly.xcworkspace
```

**⚠️ CRITICAL:** Always open the `.xcworkspace` file, **NOT** the `.xcodeproj` file!

### 2.2 Configure Signing

1. In Xcode, select **Spendly** project in the Navigator (left sidebar)
2. Select the **Spendly** target (under TARGETS)
3. Go to **Signing & Capabilities** tab
4. **Check** "Automatically manage signing"
5. Select your **Team** from the dropdown (your Apple Developer account)
6. Verify that **Bundle Identifier** is: `com.spendly.mobile`

**Expected Result:**
- ✅ "Signing Certificate: Apple Distribution: [Your Name]"
- ✅ "Provisioning Profile: Managed by Xcode"
- ✅ No red error messages

### 2.3 Verify Version and Build Number

1. Still in the **General** tab of the Spendly target
2. Check the **Identity** section:
   - **Version:** Should show `1.0.2` (or your current version)
   - **Build:** Should show `3` (or your current build number)

**If these don't match your `app.config.js`:**
- Run `npx expo prebuild --platform ios --clean` again
- Reopen Xcode

### 2.4 Select Build Destination

1. In the top toolbar, click the device selector (next to the Play/Stop buttons)
2. Select **"Any iOS Device (arm64)"**
3. **DO NOT** select a specific device or simulator

### 2.5 Create Archive

1. Go to **Product** → **Archive**
2. Wait for the build to complete (this may take 5-10 minutes)
3. If successful, the **Organizer** window will open automatically

**Common Build Errors and Fixes:**

| Error | Solution |
|-------|----------|
| "No signing certificate found" | Go to Xcode → Preferences → Accounts → Add your Apple ID |
| "Provisioning profile doesn't include signing certificate" | Enable "Automatically manage signing" |
| "Command PhaseScriptExecution failed" | Clean build folder: Product → Clean Build Folder, then try again |
| CocoaPods errors | Run `cd ios && pod install && cd ..` |

---

## Part 3: Upload to App Store Connect

### 3.1 Distribute App (Organizer Window)

1. In the **Organizer** window, select your archive
2. Click **Distribute App** button
3. Choose **App Store Connect**
4. Click **Next**

### 3.2 Distribution Options

**Select the following options:**

1. **Upload** (not "Export")
2. Click **Next**

### 3.3 App Store Connect Distribution Options

**CRITICAL SETTINGS to Avoid Rejection:**

1. ✅ **Include bitcode for iOS content:** UNCHECK (bitcode is deprecated)
2. ✅ **Upload your app's symbols:** **UNCHECK THIS**
   - **Why:** React Native apps often have missing dSYMs for frameworks like React, Hermes, etc.
   - **Impact:** Unchecking prevents upload failures. You can still symbolicate crashes locally.
3. ✅ **Manage Version and Build Number:** Check this (recommended)

Click **Next**

### 3.4 Re-sign Options

1. **Automatically manage signing** (recommended)
2. Click **Next**

### 3.5 Review and Upload

1. Review the summary
2. Click **Upload**
3. Wait for upload to complete (may take 10-30 minutes depending on file size and connection)

**Expected Result:**
- ✅ "Upload Successful" message
- ✅ You'll receive an email from Apple when processing is complete

---

## Part 4: App Store Connect Configuration

### 4.1 Wait for Processing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select **My Apps** → **Spendly**
3. The build will appear under **TestFlight** → **iOS Builds** after processing (10-60 minutes)

### 4.2 Add Build to TestFlight

1. Go to **TestFlight** tab
2. Under **Builds**, you should see your new build (version 1.0.2, build 3)
3. If prompted, provide **Export Compliance** information:
   - **Does your app use encryption?** → **No** (since `ITSAppUsesNonExemptEncryption: false`)
4. The build status will change to "Ready to Submit" or "Ready to Test"

### 4.3 Add Testers (Optional)

1. Go to **TestFlight** → **Internal Testing** or **External Testing**
2. Click **+** to add testers
3. Enter email addresses
4. Testers will receive an invitation to download via TestFlight app

---

## Part 5: Submit for App Store Review

### 5.1 Prepare App Information

1. Go to **App Store** tab in App Store Connect
2. Click **+ Version or Platform** → **iOS**
3. Enter version number: `1.0.2`

### 5.2 Fill Required Information

**App Information:**
- ✅ Name: Spendly
- ✅ Subtitle: (optional, max 30 characters)
- ✅ Privacy Policy URL: (required)
- ✅ Category: Finance
- ✅ Age Rating: Complete the questionnaire

**Version Information:**
- ✅ What's New in This Version: (release notes)
- ✅ Promotional Text: (optional)
- ✅ Description: (detailed app description)
- ✅ Keywords: (comma-separated, max 100 characters)
- ✅ Support URL: (required)
- ✅ Marketing URL: (optional)

**Screenshots:**
- ✅ Upload screenshots for required device sizes:
  - 6.7" Display (iPhone 14 Pro Max, 15 Pro Max)
  - 6.5" Display (iPhone 11 Pro Max, XS Max)
  - 5.5" Display (iPhone 8 Plus)

**Build:**
- ✅ Click **+** next to Build
- ✅ Select your uploaded build (1.0.2, build 3)

### 5.3 App Review Information

**Contact Information:**
- ✅ First Name, Last Name
- ✅ Phone Number
- ✅ Email Address

**Demo Account (if app requires login):**
- ✅ Username: (provide a test account)
- ✅ Password: (provide a test password)
- ✅ Notes: (any special instructions for reviewers)

**Notes:**
- Explain any features that might be unclear
- Mention if certain features require specific conditions

### 5.4 Submit for Review

1. Click **Add for Review**
2. Review all information
3. Click **Submit for Review**

**Expected Timeline:**
- ✅ In Review: 24-48 hours
- ✅ Review Duration: 1-3 days
- ✅ Total: 2-5 days typically

---

## Part 6: Common Rejection Reasons and Prevention

### 6.1 Metadata Rejections

| Rejection Reason | Prevention |
|------------------|------------|
| Missing privacy policy | Add valid privacy policy URL |
| Inaccurate screenshots | Use actual app screenshots, not mockups |
| Misleading description | Accurately describe app features |
| Missing demo account | Provide working test credentials |

### 6.2 Technical Rejections

| Rejection Reason | Prevention |
|------------------|------------|
| App crashes on launch | Test on physical device before submission |
| Missing permissions | Add all required `NS*UsageDescription` keys |
| Broken features | Test all core functionality |
| Network errors | Ensure API endpoints are accessible |

### 6.3 Design Rejections

| Rejection Reason | Prevention |
|------------------|------------|
| Incomplete app | Ensure all features are functional |
| Poor user experience | Follow iOS Human Interface Guidelines |
| Placeholder content | Remove all "lorem ipsum" or test data |

---

## Part 7: Post-Submission

### 7.1 Monitor Status

1. Check App Store Connect regularly
2. You'll receive emails for status changes:
   - "Waiting for Review"
   - "In Review"
   - "Pending Developer Release" (approved)
   - "Rejected" (with reasons)

### 7.2 If Rejected

1. Read the rejection message carefully
2. Address all issues mentioned
3. Increment build number (e.g., from 3 to 4)
4. Rebuild and reupload
5. Reply to the rejection in Resolution Center
6. Resubmit for review

### 7.3 If Approved

1. Choose release option:
   - **Automatically release** (goes live immediately)
   - **Manually release** (you control when it goes live)
2. Click **Release This Version** when ready

---

## Quick Command Reference

```bash
# Clean and rebuild
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..

# Open in Xcode
open ios/Spendly.xcworkspace

# After making changes, increment build number in app.config.js
# Then rebuild:
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
```

---

## Troubleshooting

### Upload Fails with "Missing dSYM" Errors

**Solution:** Uncheck "Upload your app's symbols" in distribution options (Step 3.3)

### Build Number Already Used

**Solution:** Increment `buildNumber` in `app.config.js`, run `npx expo prebuild --platform ios --clean`, and rebuild

### "No Signing Certificate"

**Solution:** 
1. Xcode → Preferences → Accounts
2. Add your Apple ID
3. Enable "Automatically manage signing"

### Archive Option Grayed Out

**Solution:** Ensure "Any iOS Device (arm64)" is selected, not a simulator

---

## Final Checklist Before Upload

- [ ] Version and build numbers are correct and incremented
- [ ] All permission descriptions are present in `app.config.js`
- [ ] App tested on physical device
- [ ] All features work correctly
- [ ] API endpoints are production-ready
- [ ] Privacy policy URL is valid
- [ ] Demo account credentials are ready (if applicable)
- [ ] Screenshots are prepared
- [ ] "Upload symbols" is UNCHECKED in distribution options

---

**Follow these steps exactly, and your upload should succeed without rejection!**
