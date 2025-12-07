# 🔔 Notification Permissions Fix

## Problem
The app was not asking for notification permissions on Android devices.

## Root Causes

1. **Missing POST_NOTIFICATIONS Permission** ❌
   - Android 13+ (API 33+) requires explicit `POST_NOTIFICATIONS` permission
   - This permission was not declared in `AndroidManifest.xml`
   - Without it, the system won't show the permission dialog

2. **Permission Not in app.json** ❌
   - Notification permission not listed in Android permissions array

3. **Limited Logging** ⚠️
   - Hard to debug why permissions weren't being requested

## ✅ Fixes Applied

### 1. Added POST_NOTIFICATIONS Permission

**AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

**app.json:**
```json
"permissions": [
  "android.permission.RECORD_AUDIO",
  "android.permission.POST_NOTIFICATIONS"
]
```

### 2. Enhanced Permission Request Logging

Added detailed logging to track:
- Current permission status
- Permission request flow
- Grant/deny results
- Whether user can be asked again

### 3. Improved Error Handling

Better logging when permissions are denied:
- Shows permission status
- Indicates if user can be asked again
- Provides guidance for manual enablement

---

## 🔄 How It Works Now

### Permission Request Flow:

1. **User logs in/signs up** → Navigates to dashboard
2. **Dashboard loads** → `initializeNotifications()` is called
3. **Permission check** → Checks current permission status
4. **Request if needed** → Shows system permission dialog (Android 13+)
5. **Get push token** → If granted, retrieves Expo push token
6. **Register device** → Registers with backend

### Android Version Behavior:

- **Android 12 and below:**
  - Notifications are granted by default
  - No permission dialog shown
  - Works automatically

- **Android 13+ (API 33+):**
  - Requires `POST_NOTIFICATIONS` permission
  - System shows permission dialog
  - User must explicitly grant permission

---

## 🧪 Testing

### Test Notification Permissions:

1. **Rebuild the app:**
   ```bash
   npx expo run:android
   ```

2. **Login to the app**

3. **Navigate to dashboard**

4. **Check logs:**
   ```bash
   adb logcat | grep -i "notification\|permission"
   ```

5. **Expected behavior:**
   - On Android 13+: System permission dialog should appear
   - On Android 12-: No dialog (auto-granted)
   - Check logs for permission status

### Verify Permission Status:

```bash
adb shell dumpsys package com.spendly.money | grep -A 5 "permission"
```

Or check in app logs:
```
🔔 Checking notification permissions...
📋 Current permission status: undetermined
📱 Requesting notification permissions...
✅ Permission request result: granted
✅ Notification permissions granted!
```

---

## 📋 Checklist

- [x] POST_NOTIFICATIONS added to AndroidManifest.xml
- [x] Notification permission added to app.json
- [x] Enhanced logging in permission request
- [x] Improved error handling
- [ ] **App rebuilt with new permissions** ← Do this now!
- [ ] **Tested on Android device**
- [ ] **Permission dialog appears (Android 13+)**
- [ ] **Notifications working after grant**

---

## 🐛 Troubleshooting

### If Permission Dialog Still Doesn't Appear:

1. **Check Android Version:**
   ```bash
   adb shell getprop ro.build.version.sdk
   ```
   - If < 33: No dialog needed (auto-granted)
   - If ≥ 33: Dialog should appear

2. **Verify Permission in Manifest:**
   ```bash
   grep POST_NOTIFICATIONS android/app/src/main/AndroidManifest.xml
   ```
   Should show: `<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>`

3. **Check Logs:**
   ```bash
   adb logcat | grep -i "notification\|permission"
   ```
   Look for permission request logs

4. **Clear App Data and Rebuild:**
   ```bash
   adb uninstall com.spendly.money
   npx expo prebuild --platform android --clean
   npx expo run:android
   ```

5. **Manually Check Permissions:**
   - Settings → Apps → Spendly Money → Notifications
   - Should show if notifications are enabled

### If Permissions Are Denied:

1. **User can enable manually:**
   - Settings → Apps → Spendly Money → Notifications
   - Toggle "Allow notifications"

2. **Check if can ask again:**
   - Look for `canAskAgain: true/false` in logs
   - If false, user must enable manually

---

## 📚 Android Notification Permissions

### Android 12 and Below:
- Notifications granted automatically
- No permission dialog
- Can be disabled in Settings

### Android 13+ (API 33+):
- Requires `POST_NOTIFICATIONS` permission
- System shows permission dialog
- Must be declared in manifest
- User must explicitly grant

### Target SDK 36 (Android 14):
- Definitely requires `POST_NOTIFICATIONS`
- Permission must be in manifest
- Runtime permission request required

---

## ✅ Expected Result

After rebuild:
- ✅ Permission dialog appears on Android 13+ devices
- ✅ User can grant/deny notifications
- ✅ Push token obtained after grant
- ✅ Device registered with backend
- ✅ Notifications work properly

---

**Last Updated:** After adding POST_NOTIFICATIONS permission and improving logging
