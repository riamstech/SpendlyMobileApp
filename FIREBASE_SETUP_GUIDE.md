# 🔥 Firebase Setup Guide for Push Notifications

## 📋 Prerequisites
- Firebase account (free tier is sufficient)
- Google account
- iOS Developer account (for APNs)
- Android app package name: `com.spendly.money`
- iOS bundle ID: `com.spendly.mobile`

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: **Spendly**
4. Enable Google Analytics (optional but recommended)
5. Click "Create project"

---

## Step 2: Add iOS App to Firebase

### 2.1 Register iOS App
1. In Firebase Console, click "Add app" → iOS
2. Enter iOS bundle ID: `com.spendly.mobile`
3. Enter App nickname: `Spendly iOS`
4. Enter App Store ID (optional, can add later)
5. Click "Register app"

### 2.2 Download GoogleService-Info.plist
1. Download `GoogleService-Info.plist`
2. Save it to your project root: `/Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp/`
3. **IMPORTANT:** Add to `.gitignore` to keep credentials secure

### 2.3 Configure APNs (Apple Push Notification service)
1. In Firebase Console → Project Settings → Cloud Messaging
2. Under "Apple app configuration" → APNs Authentication Key
3. Upload your APNs key (.p8 file) from Apple Developer account
4. Enter Key ID and Team ID

**To get APNs key from Apple:**
- Go to [Apple Developer](https://developer.apple.com/account/resources/authkeys/list)
- Create new key with "Apple Push Notifications service (APNs)" enabled
- Download .p8 file
- Note the Key ID and Team ID

---

## Step 3: Add Android App to Firebase

### 3.1 Register Android App
1. In Firebase Console, click "Add app" → Android
2. Enter Android package name: `com.spendly.money`
3. Enter App nickname: `Spendly Android`
4. Enter SHA-1 (optional, for Google Sign-In)
5. Click "Register app"

### 3.2 Download google-services.json
1. Download `google-services.json`
2. Save it to your project root: `/Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp/`
3. **IMPORTANT:** Add to `.gitignore` to keep credentials secure

---

## Step 4: Install Firebase Packages

Run these commands in your project:

```bash
# Install Firebase packages
npx expo install @react-native-firebase/app @react-native-firebase/messaging

# Or use npm
npm install @react-native-firebase/app @react-native-firebase/messaging
```

---

## Step 5: Configure app.json

Update your `app.json` with Firebase configuration:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/messaging"
    ]
  }
}
```

---

## Step 6: Update .gitignore

Add these lines to `.gitignore`:

```
# Firebase config files (contain sensitive keys)
GoogleService-Info.plist
google-services.json
```

---

## Step 7: iOS Configuration

### 7.1 Enable Push Notifications Capability
1. Open Xcode
2. Select your project → Signing & Capabilities
3. Click "+ Capability"
4. Add "Push Notifications"
5. Add "Background Modes" → Check "Remote notifications"

### 7.2 Update Info.plist
The `GoogleService-Info.plist` will be automatically linked by Expo.

---

## Step 8: Android Configuration

### 8.1 Update AndroidManifest.xml
Add these permissions (Expo handles this automatically):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

---

## Step 9: Test Firebase Connection

Create a test file to verify Firebase is working:

```typescript
// src/services/firebaseTest.ts
import messaging from '@react-native-firebase/messaging';

export async function testFirebaseConnection() {
  try {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Firebase authorization status:', authStatus);
    }

    // Get FCM token
    const token = await messaging().getToken();
    console.log('✅ FCM Token:', token);

    return { success: true, token };
  } catch (error) {
    console.error('❌ Firebase connection error:', error);
    return { success: false, error };
  }
}
```

---

## Step 10: Send Test Notification

### From Firebase Console:
1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your FCM token
6. Click "Test"

### From Backend (Node.js example):
```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification
async function sendNotification(fcmToken, title, body) {
  const message = {
    notification: {
      title: title,
      body: body
    },
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.log('Error sending message:', error);
  }
}
```

---

## 📱 Quick Setup Commands

Run these commands in order:

```bash
# 1. Install Firebase packages
npx expo install @react-native-firebase/app @react-native-firebase/messaging

# 2. Prebuild with Firebase config
npx expo prebuild --clean

# 3. Build for iOS
npx expo run:ios --device "Rasheed"

# 4. Build for Android (when ready)
npx expo run:android
```

---

## 🔧 Troubleshooting

### Issue: "GoogleService-Info.plist not found"
**Solution:** Ensure the file is in the project root and path in app.json is correct.

### Issue: "Firebase not initialized"
**Solution:** Make sure you ran `npx expo prebuild` after adding Firebase config.

### Issue: "APNs certificate invalid"
**Solution:** Verify you uploaded the correct .p8 key and Key ID in Firebase Console.

### Issue: "No FCM token received"
**Solution:** 
- Check device has internet connection
- Verify Firebase config files are correct
- Check permissions are granted

---

## 📊 Firebase Console Features

Once set up, you can use Firebase Console to:
- ✅ Send test notifications
- ✅ View notification analytics
- ✅ Create notification campaigns
- ✅ Schedule notifications
- ✅ Target specific user segments
- ✅ A/B test notifications
- ✅ View delivery reports

---

## 🔐 Security Best Practices

1. **Never commit Firebase config files to Git**
   - Add to `.gitignore`
   - Use environment variables for CI/CD

2. **Restrict API keys**
   - In Firebase Console → Project Settings → General
   - Restrict keys to specific apps/domains

3. **Use Firebase Security Rules**
   - Restrict who can send notifications
   - Validate notification data

4. **Rotate keys regularly**
   - Update APNs keys annually
   - Monitor for unauthorized access

---

## 📚 Next Steps

After Firebase is set up:
1. ✅ Update notification service to use Firebase
2. ✅ Test on both iOS and Android
3. ✅ Integrate with backend
4. ✅ Add notification categories
5. ✅ Implement action buttons
6. ✅ Add badge count management

---

**Ready to implement? Let me know when you have:**
- ✅ Firebase project created
- ✅ `GoogleService-Info.plist` downloaded
- ✅ `google-services.json` downloaded
- ✅ APNs key uploaded to Firebase

Then I'll update the code to use Firebase! 🚀
