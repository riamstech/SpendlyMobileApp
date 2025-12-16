# Sign in with Apple - Implementation Complete ✅

## Changes Made

### Frontend (React Native)

#### 1. Auth Service (`src/api/services/auth.ts`)
- ✅ Added `appleLogin()` method
- Sends Apple identity token to backend `/auth/social/verify` endpoint
- Handles user data (email, name) if provided
- Stores auth token on successful login

#### 2. Login Screen (`src/screens/LoginScreen.tsx`)
- ✅ Added import for `expo-apple-authentication`
- ✅ Added `handleAppleLogin()` function
- ✅ Added Apple Sign-In button (iOS only)
- Button positioned ABOVE Google Sign-In (per Apple guidelines)
- Uses native Apple button component with proper styling

#### 3. Signup Screen (`src/screens/SignupScreen.tsx`)
- ✅ Added import for `expo-apple-authentication`
- ✅ Added `handleAppleSignup()` function
- ✅ Added Apple Sign-Up button (iOS only)
- Button positioned ABOVE Google Sign-In (per Apple guidelines)
- Uses `SIGN_UP` button type for signup context

## How It Works

### User Flow
1. User taps "Sign in with Apple" button
2. iOS native authentication dialog appears
3. User authenticates with Face ID/Touch ID/Password
4. User can choose to hide email (relay email)
5. App receives identity token + user info
6. Token sent to backend for verification
7. Backend validates token with Apple servers
8. User logged in or account created

### Button Behavior
- **iOS**: Shows native Apple Sign-In button
- **Android/Web**: Button hidden (conditional rendering)

### API Payload
```json
{
  "provider": "apple",
  "token": "eyJraWQiOiJXNl...",
  "user": {
    "email": "user@example.com",
    "givenName": "John",
    "familyName": "Doe"
  },
  "device_name": "iOS 18.0 - React Native"
}
```

## Backend Requirements

### Endpoint: `POST /auth/social/verify`

The backend must:

1. **Verify the identity token with Apple**:
   ```php
   // Decode JWT and verify signature
   $publicKey = getApplePublicKey($token);
   $decoded = JWT::decode($token, $publicKey, ['RS256']);
   ```

2. **Extract user information**:
   ```php
   $appleUserId = $decoded->sub; // Unique Apple user ID
   $email = $decoded->email ?? null;
   ```

3. **Create or find user**:
   ```php
   $user = User::firstOrCreate(
       ['apple_id' => $appleUserId],
       [
           'email' => $email ?? generateRelayEmail(),
           'name' => $request->user['givenName'] . ' ' . $request->user['familyName'],
           'email_verified_at' => now(),
       ]
   );
   ```

4. **Generate token and return**:
   ```php
   $token = $user->createToken($request->device_name)->plainTextToken;
   return response()->json([
       'token' => $token,
       'user' => $user,
       'is_new_user' => $user->wasRecentlyCreated
   ]);
   ```

### Important Notes

**Email Relay**:
- User can choose "Hide My Email"
- Apple provides relay email: `xxxxx@privaterelay.appleid.com`
- Backend must accept and store relay emails

**User ID**:
- Use `sub` claim from JWT as unique identifier
- Store in `apple_id` column
- Email can change (if user changes relay settings)

**Name Availability**:
- Name only provided on FIRST sign-in
- Subsequent sign-ins: name will be null
- Backend should store name on first auth

## Testing

### Test on Physical iOS Device
1. Connect iPhone via USB
2. Build and install: `cd ios && xcodebuild -workspace Spendly.xcworkspace -scheme Spendly -configuration Release -destination 'platform=iOS,name=Rasheed' clean build`
3. Install on device
4. Tap "Sign in with Apple"
5. Authenticate with Face ID
6. Verify login success

### Sandbox Testing
- Use App Store Connect sandbox tester account
- Go to Settings > Sign in with Apple > Test Environment
- Add sandbox Apple ID

## App Store Compliance

✅ **Guideline 4.8 Requirements Met**:
- [x] Offers Sign in with Apple alongside Google Sign-In
- [x] Limits data collection (only name + email)
- [x] Allows users to hide email (Apple relay)
- [x] No advertising tracking without consent
- [x] Apple button positioned prominently (above other social logins)

## Next Steps

1. **Backend Implementation**: Implement Apple token verification in backend
2. **Database Migration**: Add `apple_id` column to users table
3. **Test End-to-End**: Verify complete auth flow works
4. **Update Privacy Policy**: Mention Sign in with Apple option
5. **Resubmit to App Store**: Address Guideline 4.8 rejection

---

**Status**: ✅ Frontend implementation complete. Ready for backend integration and testing.
