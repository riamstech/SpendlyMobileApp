/**
 * Script to send a test push notification to your Android device
 * 
 * Usage:
 * 1. Get your Expo Push Token from the app logs (look for "✅ Expo Push Token:")
 *    - Open the app on your Android device
 *    - Go to Settings → Preferences → Enable Notifications
 *    - Check Metro bundler logs or device logs for the token
 * 
 * 2. Run: node send-test-notification.js YOUR_PUSH_TOKEN
 * 
 * Or set it as an environment variable:
 * EXPO_PUSH_TOKEN=your_token node send-test-notification.js
 * 
 * Example:
 * node send-test-notification.js ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 */

const https = require('https');

// Expo Push Notification API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Project ID from app.config.js
const PROJECT_ID = '69fcbfda-6485-4d30-9d69-3cefc6544941';

// Get push token from command line argument or environment variable
const pushToken = process.argv[2] || process.env.EXPO_PUSH_TOKEN;

if (!pushToken) {
  console.error('❌ Error: Push token is required!');
  console.log('\nUsage:');
  console.log('  node send-test-notification.js YOUR_PUSH_TOKEN');
  console.log('\nOr set environment variable:');
  console.log('  EXPO_PUSH_TOKEN=your_token node send-test-notification.js');
  console.log('\nTo get your push token:');
  console.log('  1. Open the app on your Android device');
  console.log('  2. Go to Settings → Preferences → Enable Notifications');
  console.log('  3. Check the app logs for "✅ Expo Push Token:"');
  process.exit(1);
}

// Notification payload
const notification = {
  to: pushToken,
  sound: 'default',
  title: 'Test Notification from Spendly',
  body: 'This is a test notification to verify push notifications are working! 🎉',
  data: {
    screen: 'dashboard',
    type: 'test',
  },
  priority: 'high',
  channelId: 'default',
};

// Convert to JSON
const postData = JSON.stringify([notification]);

// Request options
const options = {
  hostname: 'exp.host',
  port: 443,
  path: '/--/api/v2/push/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  },
};

console.log('📤 Sending test notification...');
console.log('📱 Push Token:', pushToken.substring(0, 20) + '...');
console.log('📋 Notification:', JSON.stringify(notification, null, 2));
console.log('');

// Make the request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Response:', JSON.stringify(response, null, 2));
      
      if (response.data && response.data[0]) {
        const result = response.data[0];
        if (result.status === 'ok') {
          console.log('\n🎉 Notification sent successfully!');
          console.log('📱 Check your Android device for the notification.');
        } else {
          console.error('\n❌ Failed to send notification:', result.message);
        }
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(postData);
req.end();
