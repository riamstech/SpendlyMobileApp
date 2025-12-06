# 🧪 Testing Guide for New Features

**Date:** 2025-12-07  
**Features to Test:** Dark Mode Charts, Settings Simplification, Renew Button, One-Time Billing, Push Notifications

---

## 📋 Pre-Testing Checklist

### ✅ Completed:
- [x] All code changes committed
- [x] Backend deployed to EC2
- [x] Push notification infrastructure integrated
- [x] iOS build running: `npx expo run:ios --device "Rasheed"`

### ⏳ Waiting:
- [ ] iOS build to complete
- [ ] App to install on device

---

## 🧪 Test Plan

### **Test 1: Dark Mode Chart Text** 🌙

**Location:** Budget Screen  
**What to test:** Chart text visibility in dark mode

**Steps:**
1. Open the app
2. Navigate to Budget screen (from bottom tab)
3. Check if "Top Spending Categories" chart is visible
4. Toggle dark mode in Settings
5. Return to Budget screen
6. **Verify:** Chart labels and legend text are clearly visible in both light and dark mode

**Expected Result:**
- ✅ Light mode: Black text on white background
- ✅ Dark mode: White text on dark background
- ✅ All text is readable

**Files Changed:** `BudgetScreen.tsx`

---

### **Test 2: Simplified Settings Features** ⚙️

**Location:** Settings Screen  
**What to test:** Features section only shows "Refer and Earn"

**Steps:**
1. Open Settings from bottom tab
2. Expand "Features and Rewards" section
3. **Verify:** Only "Refer and Earn" option is visible
4. **Verify:** Savings Goals, Analytics, and Receipts are NOT visible

**Expected Result:**
- ✅ Only "Refer and Earn" shown
- ✅ Other features hidden
- ✅ Section still expandable/collapsible

**Files Changed:** `SettingsScreen.tsx`

---

### **Test 3: Renew Subscription Button** 🔄

**Location:** Settings > Subscription Section  
**What to test:** Renew button appears and is clickable

**Steps:**
1. Open Settings
2. Expand "Subscription" section
3. **Verify:** "Renew Subscription" button is visible
4. **Verify:** Button has refresh icon
5. Tap the button
6. **Verify:** Action is triggered (check console logs or modal appears)

**Expected Result:**
- ✅ Button visible with icon
- ✅ Button styled correctly (primary color)
- ✅ Tapping triggers renewal flow

**Files Changed:** `SettingsScreen.tsx`

---

### **Test 4: One-Time Billing** 💳

**Location:** Backend (Subscription Flow)  
**What to test:** Payments are one-time, not recurring

**Steps:**
1. **Note:** This requires testing the payment flow
2. If you have a test Stripe account, initiate a subscription
3. Check Stripe dashboard
4. **Verify:** Payment mode is "payment" not "subscription"
5. **Verify:** No recurring billing is set up

**Expected Result:**
- ✅ Stripe shows one-time payment
- ✅ No subscription created
- ✅ User gets access for specified period

**Files Changed:** `ProSubscriptionController.php` (Backend)  
**Deployed:** ✅ EC2 Production

---

### **Test 5: Push Notifications** 🔔

**Location:** Entire App  
**What to test:** Notification permissions, registration, and receiving

#### **Part A: Initialization**

**Steps:**
1. Fresh install or login to the app
2. Navigate to Dashboard (triggers notification init)
3. Check console logs for:
   ```
   🔔 Initializing push notifications...
   ✅ Notification permissions granted
   ✅ Push token obtained: ExponentPushToken[...]
   📱 Device UUID: ...
   ✅ Device registered for push notifications
   ✅ Notification listeners set up
   ```

**Expected Result:**
- ✅ Permission dialog appears
- ✅ User grants permission
- ✅ Push token obtained
- ✅ Device registered with backend
- ✅ No errors in console

#### **Part B: Test Local Notification**

**Steps:**
1. Add a test button temporarily (or use console):
   ```typescript
   await notificationService.scheduleLocalNotification(
     'Test Notification',
     'This is a test from Spendly!',
     { screen: 'dashboard' },
     5 // 5 seconds
   );
   ```
2. Wait 5 seconds
3. **Verify:** Notification appears

**Expected Result:**
- ✅ Notification appears after 5 seconds
- ✅ Notification shows title and body
- ✅ Tapping notification logs to console

#### **Part C: Backend Verification**

**Steps:**
1. Check backend database
2. Query `user_devices` table
3. **Verify:** Your device is registered with:
   - device_uuid
   - platform (ios)
   - fcm_token (Expo push token)
   - app_version

**Expected Result:**
- ✅ Device record exists
- ✅ All fields populated
- ✅ Token is valid Expo push token

**Files Changed:** `App.tsx`, `notificationService.ts`, `devicesService.ts`

---

## 🐛 Troubleshooting

### Issue: iOS Build Fails
**Solution:**
```bash
# Clean and rebuild
cd ios
rm -rf Pods Podfile.lock
cd ..
npx expo prebuild --clean
npx expo run:ios --device "Rasheed"
```

### Issue: Notification Permission Not Requested
**Possible Causes:**
- Not on physical device (simulator doesn't support push)
- Already denied permissions (check device settings)
- Not reaching dashboard screen

**Solution:**
- Ensure you're on physical device
- Reset app permissions in iOS Settings
- Check console logs for errors

### Issue: Device Not Registered with Backend
**Possible Causes:**
- Not authenticated
- Backend endpoint not accessible
- Network error

**Solution:**
- Check console logs for error details
- Verify `/api/devices` endpoint is accessible
- Check authentication token

### Issue: Dark Mode Chart Text Still Not Visible
**Possible Causes:**
- Old build (changes not included)
- Cache issue

**Solution:**
- Ensure latest code is built
- Force quit and restart app
- Clear app cache

---

## 📊 Test Results Template

Copy this template to track your testing:

```
## Test Results - [Date]

### Test 1: Dark Mode Chart Text
- [ ] Light mode text visible
- [ ] Dark mode text visible
- [ ] No visual issues
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** 

### Test 2: Simplified Settings
- [ ] Only "Refer and Earn" visible
- [ ] Other features hidden
- [ ] Section works correctly
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** 

### Test 3: Renew Button
- [ ] Button visible
- [ ] Button clickable
- [ ] Action triggered
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** 

### Test 4: One-Time Billing
- [ ] Payment mode is "payment"
- [ ] No recurring subscription
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** 

### Test 5: Push Notifications
- [ ] Permission requested
- [ ] Token obtained
- [ ] Device registered
- [ ] Local notification works
- [ ] Backend record exists
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** 

## Overall Status
- **Tests Passed:** _/5
- **Tests Failed:** _/5
- **Ready for Production:** YES / NO
```

---

## 🚀 Next Steps After Testing

### If All Tests Pass:
1. ✅ Mark features as production-ready
2. ✅ Update version number
3. ✅ Create release notes
4. ✅ Deploy to TestFlight/App Store (if applicable)

### If Tests Fail:
1. ❌ Document issues
2. ❌ Create bug reports
3. ❌ Fix and retest
4. ❌ Repeat until all pass

---

## 📝 Console Commands for Testing

### Check Notification Status:
```typescript
// In React Native Debugger or console
const status = await notificationService.requestPermissions();
console.log('Permission status:', status);

const token = await notificationService.getExpoPushToken();
console.log('Push token:', token);
```

### Test Local Notification:
```typescript
await notificationService.scheduleLocalNotification(
  'Test Title',
  'Test Body',
  { test: true },
  5
);
```

### Check Device Registration:
```bash
# On backend server
ssh -i ~/Downloads/Spendly.pem ubuntu@44.210.80.75
mysql -u root -p
use spendly_db;
SELECT * FROM user_devices ORDER BY created_at DESC LIMIT 5;
```

---

## 📚 Additional Resources

- **Push Notifications Guide:** `PUSH_NOTIFICATIONS_GUIDE.md`
- **Implementation Progress:** `.agent/workflows/implementation-progress.md`
- **UI Fixes Plan:** `.agent/workflows/ui-fixes-plan.md`

---

**Happy Testing! 🎉**

If you encounter any issues, check the console logs first. Most problems will show detailed error messages there.
