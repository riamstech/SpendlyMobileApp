# iOS App Rebuild Guide - Fix CSV/PDF Downloads

## Problem
The native modules (`expo-file-system`, `expo-sharing`, `expo-print`) are not included in the current iOS build, causing CSV downloads to fail.

## Solution
Rebuild the iOS app with proper code signing to include all native modules.

---

## Step-by-Step Instructions

### 1. Configure Xcode Signing (Xcode should be open now)

In Xcode:
1. **Select the "Spendly" project** in the left sidebar (the blue icon at the top)
2. **Select the "Spendly" target** (under TARGETS, not PROJECTS)
3. Click on the **"Signing & Capabilities"** tab at the top
4. **Check the box** for "Automatically manage signing"
5. **Select your team** from the "Team" dropdown: `ENLJM2DLPF`
6. Make sure "Signing Certificate" shows your certificate
7. **Close Xcode** (Cmd+Q)

### 2. Clean Build Folders (Optional but Recommended)

Run this command to clean old build artifacts:
```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/Spendly-*
```

### 3. Start Fresh Build

Run the build command:
```bash
npx expo run:ios --device "Rasheed"
```

This will:
- ✅ Compile all native modules (FileSystem, Sharing, Print)
- ✅ Sign the app with your certificate
- ✅ Install on your device "Rasheed"
- ⏱️ Take approximately 5-10 minutes

### 4. Wait for Build to Complete

You'll see output like:
```
› Building Spendly
› Compiling...
› Linking...
› Installing on Rasheed...
✓ Build successful
```

### 5. Test Downloads

Once the app is installed:
1. Open the app on your device
2. Go to **Reports** screen
3. Click **Download CSV** - should work! ✅
4. Click **Download PDF** - should work! ✅

---

## What's Fixed

✅ **PDF Download** - Backend API fixed and deployed
✅ **CSV Download** - Backend API created and deployed
✅ **Native Modules** - Will be included after rebuild

## Troubleshooting

### If build fails with signing error:
- Make sure you completed Step 1 (Xcode signing configuration)
- Try running: `npx expo run:ios --device "Rasheed" --no-build-cache`

### If FileSystem still not available:
- The app might not have rebuilt properly
- Try: `cd ios && pod install && cd ..`
- Then rebuild: `npx expo run:ios --device "Rasheed"`

### If downloads still fail:
- Check console logs for specific error messages
- Verify backend is deployed: `curl https://api.spendly.money/api/reports/export/csv`

---

## Expected Result

After rebuild, both CSV and PDF downloads will:
1. Call the backend API
2. Get the report data
3. Save to device storage
4. Open iOS share sheet
5. Allow sharing via any app (Messages, Email, Files, etc.)

🎉 **You're all set!** Just follow the steps above and the downloads will work perfectly.
