# App Store Rejection Fixes - Implementation Plan

## Issue 1: Guideline 4.8 - Login Services (Sign in with Apple Required)

### Current State
- ✅ Google Sign-In implemented
- ❌ Sign in with Apple NOT implemented

### Apple's Requirements
Apps using third-party login (Google) MUST also offer Sign in with Apple with these features:
1. Limits data collection to name and email
2. Allows users to hide email from the app
3. No advertising tracking without consent

### Solution: Implement Sign in with Apple

#### Step 1: Install Dependencies
```bash
npm install expo-apple-authentication
```

#### Step 2: Update app.config.js
Already has `expo-apple-authentication` in plugins (added during prebuild).

#### Step 3: Add Apple Sign-In to Login/Signup Screens
Files to modify:
- `src/screens/LoginScreen.tsx`
- `src/screens/SignupScreen.tsx`

Add Apple Sign-In button ABOVE Google Sign-In button (Apple guideline compliance).

#### Step 4: Backend API Support
Backend endpoint needed: `POST /auth/apple-login`
Payload:
```json
{
  "identityToken": "string",
  "user": {
    "email": "string",
    "familyName": "string",
    "givenName": "string"
  },
  "device_name": "string"
}
```

---

## Issue 2: Guideline 3.1.1 - In-App Purchase Required

### Current State
- ✅ Stripe payment implemented (web/external)
- ❌ Apple In-App Purchase NOT implemented for iOS

### Apple's Requirements
Digital subscriptions MUST use Apple In-App Purchase on iOS.
External payment methods (Stripe) are NOT allowed for digital content.

### Solution: Implement StoreKit (In-App Purchase)

#### Step 1: Create Products in App Store Connect
1. Go to App Store Connect > My Apps > Spendly
2. Features > In-App Purchases
3. Create subscription products:
   - Monthly Pro: `com.spendly.mobile.pro.monthly`
   - Yearly Pro: `com.spendly.mobile.pro.yearly`

#### Step 2: Install Dependencies
```bash
npm install react-native-iap
cd ios && pod install && cd ..
```

#### Step 3: Implement StoreKit Integration
Files to modify:
- `src/screens/SettingsScreen.tsx`
- Create `src/services/inAppPurchase.ts`

#### Step 4: Backend Server Receipt Validation
Backend endpoint needed: `POST /subscriptions/apple/verify`
Payload:
```json
{
  "receiptData": "base64_string",
  "transactionId": "string",
  "productId": "string"
}
```

Backend must:
1. Receive receipt from app
2. Validate with Apple servers
3. Grant subscription access
4. Store transaction details

#### Step 5: Handle Platform-Specific Payment
```typescript
if (Platform.OS === 'ios') {
  // Use Apple In-App Purchase
  await purchaseWithApple();
} else if (Platform.OS === 'android') {
  // Use Google Play Billing or Stripe
  await purchaseWithStripe();
}
```

---

## Implementation Priority

### Phase 1: Sign in with Apple (CRITICAL - Required for approval)
1. ✅ Install `expo-apple-authentication`
2. Add Apple Sign-In button to LoginScreen
3. Add Apple Sign-In button to SignupScreen
4. Backend API endpoint for Apple authentication
5. Test on physical iOS device
6. **Estimated time: 2-3 hours**

### Phase 2: In-App Purchase (CRITICAL - Required for approval)
1. Create products in App Store Connect
2. Install `react-native-iap`
3. Implement purchase flow for iOS
4. Backend receipt validation
5. Handle subscription lifecycle (renew, cancel, expire)
6. Test with sandbox account
7. **Estimated time: 4-6 hours**

### Phase 3: Testing & Submission
1. Test Apple Sign-In on device
2. Test IAP with sandbox account
3. Update App Store screenshots if needed
4. Resubmit to App Review
5. **Estimated time: 1-2 hours**

---

## Code Changes Required

### Frontend (React Native)
- [ ] `src/screens/LoginScreen.tsx` - Add Apple Sign-In
- [ ] `src/screens/SignupScreen.tsx` - Add Apple Sign-In  
- [ ] `src/screens/SettingsScreen.tsx` - Add IAP for iOS
- [ ] `src/services/inAppPurchase.ts` - New file for IAP logic
- [ ] `src/api/services/auth.ts` - Add Apple auth method

### Backend (Laravel)
- [ ] `POST /auth/apple-login` - Apple authentication endpoint
- [ ] `POST /subscriptions/apple/verify` - Receipt validation
- [ ] Subscription lifecycle management
- [ ] Apple Server-to-Server notifications webhook

---

## Testing Checklist

### Apple Sign-In
- [ ] Sign in with Apple works on iOS
- [ ] Email hidden option works
- [ ] User data saved correctly
- [ ] Existing users can link Apple account

### In-App Purchase
- [ ] Products load from App Store
- [ ] Purchase flow completes
- [ ] Receipt validation works
- [ ] Subscription access granted
- [ ] Cancellation handled
- [ ] Renewal handled
- [ ] Refund handled

---

## Notes

1. **Platform-specific**: These changes only affect iOS. Android can continue using Google Sign-In and Stripe.

2. **Revenue split**: Apple takes 30% of in-app purchases (15% after year 1).

3. **External link**: For US storefront, you MAY add a link to external payment, but IAP must still be available.

4. **Compliance**: Both features are REQUIRED for App Store approval.

---

**Ready to implement? Let me know which phase to start with!**
