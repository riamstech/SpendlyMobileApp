# 🔔 Simple Push Notification Test

Since the logs aren't showing, let's test notifications a different way.

## ✅ **Simplified Testing Method**

### **Option 1: Test with a Simple Script**

1. **First, let's verify the app has the push token stored in your backend**

Check your backend database:
```sql
SELECT * FROM user_devices ORDER BY created_at DESC LIMIT 5;
```

If you see a record with `fcm_token` (the Expo push token), copy that token.

---

### **Option 2: Send Test Notification Directly**

Use this simple curl command (replace `YOUR_TOKEN` with the token from database):

```bash
curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
  "to": "YOUR_TOKEN_HERE",
  "title": "Test",
  "body": "Testing notifications!",
  "sound": "default"
}'
```

---

### **Option 3: Use Expo's Push Tool**

1. Go to: **https://expo.dev/notifications**
2. Get the token from your database (from `user_devices` table)
3. Paste it in the tool
4. Send a test notification

---

## 🔍 **Why Logs Might Not Show:**

The app might be running in **production mode** instead of development mode. This means:
- ✅ Notifications still work
- ❌ Console logs don't show in Metro
- ✅ You can still test with the methods above

---

## 🎯 **Quick Test:**

1. **Check your database:**
   ```bash
   ssh -i ~/Downloads/Spendly.pem ubuntu@44.210.80.75
   mysql -u root -p
   use spendly_db;
   SELECT device_uuid, fcm_token, platform FROM user_devices ORDER BY created_at DESC LIMIT 1;
   ```

2. **Copy the `fcm_token`**

3. **Send test notification:**
   ```bash
   curl -H "Content-Type: application/json" \
        -X POST https://exp.host/--/api/v2/push/send \
        -d '{
     "to": "PASTE_TOKEN_HERE",
     "title": "Test Notification",
     "body": "If you see this, notifications work!",
     "sound": "default"
   }'
   ```

---

## 📱 **Expected Result:**

If notifications are working:
- You'll see a notification on your iPhone
- Badge count will increase
- Tapping it will open the app

---

**Try the database check first - that will tell us if the token was registered!**
