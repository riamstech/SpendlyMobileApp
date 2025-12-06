# Mobile App UI/UX Fixes - Implementation Plan

## Overview
This document outlines 9 tasks to improve the Spendly Mobile App UI/UX by referencing the SpendlyApp (web version) implementation.

---

## Task List

### ✅ Task 1: Add Budget Section to Dashboard
**Priority:** High  
**Estimated Time:** 30 minutes  
**Status:** Pending

**Description:**
Add budget section above the Income vs Expense chart on the Dashboard page.

**Reference:**
- File: `SpendlyApp/src/components/Dashboard.tsx`
- Look for budget display component

**Implementation Steps:**
1. Search for budget component in SpendlyApp
2. Check if budget API endpoint exists in mobile app
3. Add budget section component to DashboardScreen
4. Position it above the Income vs Expense chart
5. Style to match mobile design

**Files to Modify:**
- `/SpendlyMobileApp/src/screens/DashboardScreen.tsx`

---

### ✅ Task 2: Fix Expense Data Display in Reports
**Priority:** High  
**Estimated Time:** 20 minutes  
**Status:** Pending

**Description:**
Verify and fix expense data display in the Reports page tiles.

**Implementation Steps:**
1. Check current expense calculation logic
2. Compare with SpendlyApp implementation
3. Verify API response data
4. Fix any display or calculation issues
5. Test with real data

**Files to Modify:**
- `/SpendlyMobileApp/src/screens/ReportsScreen.tsx`

---

### ✅ Task 3: Add Spending By Category Section
**Priority:** High  
**Estimated Time:** 45 minutes  
**Status:** Pending

**Description:**
Add "Spending By Category" section to Reports page.

**Reference:**
- File: `SpendlyApp/src/components/Reports.tsx`

**Implementation Steps:**
1. Find Spending By Category component in SpendlyApp
2. Extract the chart/visualization logic
3. Adapt for React Native (use react-native-chart-kit or similar)
4. Add to ReportsScreen
5. Connect to existing category data

**Files to Modify:**
- `/SpendlyMobileApp/src/screens/ReportsScreen.tsx`

---

### ✅ Task 4: Add Category Breakdown Section
**Priority:** High  
**Estimated Time:** 45 minutes  
**Status:** Pending

**Description:**
Add "Category Breakdown" section to Reports page.

**Reference:**
- File: `SpendlyApp/src/components/Reports.tsx`

**Implementation Steps:**
1. Find Category Breakdown component in SpendlyApp
2. Check if it's different from Spending By Category
3. Implement the breakdown view (likely a list/table)
4. Add to ReportsScreen
5. Style for mobile

**Files to Modify:**
- `/SpendlyMobileApp/src/screens/ReportsScreen.tsx`

---

### ✅ Task 5: Fix Dark Mode Text in Budget Chart
**Priority:** Medium  
**Estimated Time:** 15 minutes  
**Status:** Pending

**Description:**
Fix text visibility in "Top Spending Categories" chart on Budget page in dark mode.

**Implementation Steps:**
1. Locate the chart component in BudgetScreen
2. Check current text color configuration
3. Add theme-aware text colors
4. Test in both light and dark modes
5. Ensure contrast meets accessibility standards

**Files to Modify:**
- `/SpendlyMobileApp/src/screens/BudgetScreen.tsx` (or similar)

---

### ✅ Task 6: Simplify Settings Features Section
**Priority:** Low  
**Estimated Time:** 10 minutes  
**Status:** Pending

**Description:**
Keep only "Refer and Earn" in Features and Rewards section, comment out other options.

**Implementation Steps:**
1. Open SettingsScreen.tsx
2. Find Features and Rewards section
3. Comment out all options except "Refer and Earn"
4. Add comments explaining why others are disabled
5. Verify UI looks clean

**Files to Modify:**
- `/SpendlyMobileApp/src/screens/SettingsScreen.tsx`

---

### ✅ Task 7: Add Renew Button to Subscription Section
**Priority:** Medium  
**Estimated Time:** 30 minutes  
**Status:** Pending

**Description:**
Display "Renew" button in Settings page subscription section.

**Reference:**
- File: `SpendlyApp/src/components/Settings.tsx`

**Implementation Steps:**
1. Check SpendlyApp for renew button implementation
2. Add renew button to subscription section
3. Connect to subscription renewal flow
4. Handle button press (navigate to upgrade screen)
5. Show only for expired/expiring subscriptions

**Files to Modify:**
- `/SpendlyMobileApp/src/screens/SettingsScreen.tsx`

---

### ✅ Task 8: Add Subscription Expiry Warning to Dashboard
**Priority:** High  
**Estimated Time:** 45 minutes  
**Status:** Pending

**Description:**
Show expiry message and renewal link on Dashboard for expired/expiring users.

**Reference:**
- File: `SpendlyApp/src/components/Dashboard.tsx`

**Implementation Steps:**
1. Find expiry warning component in SpendlyApp
2. Check user subscription status API
3. Calculate days until expiry
4. Create warning banner component
5. Add "Renew Now" link/button
6. Position at top of Dashboard
7. Show only when subscription is expired or expiring soon (e.g., < 7 days)

**Files to Modify:**
- `/SpendlyMobileApp/src/screens/DashboardScreen.tsx`
- Possibly: `/SpendlyMobileApp/src/api/services/subscriptions.ts`

---

### ✅ Task 9: Change Premium Upgrade to One-Time Billing
**Priority:** High  
**Estimated Time:** 60 minutes  
**Status:** Pending

**Description:**
Update upgrade premium dialogue to show "Billed One Time" instead of recurring billing.

**Implementation Steps:**
1. **Frontend Changes:**
   - Find upgrade/premium modal component
   - Change billing text from "recurring" to "Billed One Time"
   - Update pricing display
   - Remove any auto-renewal messaging

2. **Backend Changes (if needed):**
   - Check subscription creation logic
   - Ensure one-time payment is supported
   - Update subscription duration calculation
   - Modify renewal logic to not auto-renew

**Files to Modify:**
- Frontend: `/SpendlyMobileApp/src/components/UpgradePremiumModal.tsx` (or similar)
- Backend: `/SpendlyBackendAPI/app/Http/Controllers/ProSubscriptionController.php`
- Backend: `/SpendlyBackendAPI/app/Models/ProSubscription.php`

---

### ✅ Task 10: Integrate Push Notifications
**Priority:** High  
**Estimated Time:** 90 minutes  
**Status:** Pending

**Description:**
Implement push notifications for the mobile app using Expo Notifications and Firebase Cloud Messaging (FCM).

**Backend Status:**
- ✅ UserDevice model exists
- ✅ UserDeviceController exists (stores FCM tokens)
- ✅ NotificationController exists (manages notifications)
- ✅ NotificationService likely exists
- ⚠️ Need to verify FCM sending implementation

**Frontend Status:**
- ❌ expo-notifications not installed
- ❌ No device registration service
- ❌ No notification handlers
- ❌ No FCM configuration

**Implementation Steps:**

1. **Install Dependencies:**
   ```bash
   npx expo install expo-notifications expo-device expo-constants
   ```

2. **Configure Firebase (app.json):**
   - Add FCM configuration
   - Set up notification icon and color

3. **Create Notification Service (Frontend):**
   - File: `/SpendlyMobileApp/src/services/notificationService.ts`
   - Register device for push notifications
   - Get FCM token
   - Handle notification permissions
   - Listen for notifications (foreground/background)

4. **Create Device API Service:**
   - File: `/SpendlyMobileApp/src/api/services/devices.ts`
   - Register device with backend
   - Send FCM token to backend

5. **Integrate in App.tsx:**
   - Initialize notifications on app start
   - Register device token
   - Set up notification listeners
   - Handle notification taps

6. **Backend Verification:**
   - Check NotificationService for FCM sending
   - Verify push notification sending works
   - Test with test notification

7. **Add Notification Settings:**
   - Add toggle in Settings screen
   - Allow users to enable/disable notifications

8. **Test Notifications:**
   - Test foreground notifications
   - Test background notifications
   - Test notification tap handling
   - Test on both iOS and Android

**Files to Create:**
- `/SpendlyMobileApp/src/services/notificationService.ts`
- `/SpendlyMobileApp/src/api/services/devices.ts`

**Files to Modify:**
- `/SpendlyMobileApp/App.tsx`
- `/SpendlyMobileApp/app.json`
- `/SpendlyMobileApp/package.json`
- `/SpendlyMobileApp/src/screens/SettingsScreen.tsx`
- Backend: `/SpendlyBackendAPI/app/Services/NotificationService.php` (verify)

**Configuration Needed:**
- Firebase project setup
- FCM server key
- iOS APNs certificate (for production)
- Android google-services.json

---

## Implementation Order

### Phase 1: High Priority Fixes (Do First)
1. ✅ Task 2: Fix Expense Data Display (20 min)
2. ✅ Task 1: Add Budget Section to Dashboard (30 min)
3. ✅ Task 8: Add Subscription Expiry Warning (45 min)
4. ✅ Task 9: Change to One-Time Billing (60 min)
5. ✅ **Task 10: Integrate Push Notifications (90 min)** 🆕

### Phase 2: Reports Page Enhancements
6. ✅ Task 3: Add Spending By Category (45 min)
7. ✅ Task 4: Add Category Breakdown (45 min)

### Phase 3: Settings & Polish
8. ✅ Task 7: Add Renew Button (30 min)
9. ✅ Task 5: Fix Dark Mode Chart Text (15 min)
10. ✅ Task 6: Simplify Features Section (10 min)

---

## Total Estimated Time
**~6 hours 50 minutes** (was ~5h 20min)

---

## Notes
- All tasks reference SpendlyApp for implementation details
- Test each task in both light and dark modes
- Verify on both iOS and Android if applicable
- Ensure all changes are responsive
- Commit after each completed task
- **Push notifications require Firebase setup**

---

## Progress Tracking

- [ ] Task 1: Budget Section
- [ ] Task 2: Expense Data Fix
- [ ] Task 3: Spending By Category
- [ ] Task 4: Category Breakdown
- [ ] Task 5: Dark Mode Chart Fix
- [ ] Task 6: Settings Features Cleanup
- [ ] Task 7: Renew Button
- [ ] Task 8: Expiry Warning
- [ ] Task 9: One-Time Billing
- [ ] **Task 10: Push Notifications** 🆕

---

**Last Updated:** 2025-12-07
