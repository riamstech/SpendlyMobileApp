# How to Send Test Notification to Android Device

## Method 1: Using the Script (Recommended)

1. **Get your Expo Push Token:**
   - Open the app on your Android device
   - Go to **Settings → Preferences → Enable Notifications**
   - Check the Metro bundler logs or device logs for: `✅ Expo Push Token: ExponentPushToken[...]`
   - Copy the full token (starts with `ExponentPushToken[`)

2. **Run the script:**
   ```bash
   node send-test-notification.js ExponentPushToken[your-token-here]
   ```

3. **Check your device** - You should receive a test notification!

## Method 2: Using Backend API (if available)

If your backend has a test notification endpoint, you can use it:

```bash
curl -X POST https://api.spendly.money/api/notifications/test \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test notification"}'
```

## Method 3: Using Expo Push Notification Tool

You can also use Expo's online tool:
1. Go to: https://expo.dev/notifications
2. Enter your Expo Push Token
3. Send a test notification

## Troubleshooting

- **No token in logs?** Make sure notifications are enabled in Settings
- **Permission denied?** Check device Settings → Apps → Spendly Money → Notifications
- **Token not working?** Make sure the device is registered with the backend
