# Google Play Service Account Setup Guide

## What is a Google Service Account Key?

A Google Service Account JSON key is required for EAS to automatically upload your app to Google Play Store. This is different from `google-services.json` (which is for Firebase).

## How to Create a Google Service Account Key

### Step 1: Go to Google Play Console

1. Visit: https://play.google.com/console
2. Select your app (or create one if you haven't)

### Step 2: Enable Google Play Android Developer API

1. In Google Play Console, go to **Settings** → **API access**
2. Click **Create new service account**
3. Follow the link to Google Cloud Console

### Step 3: Create Service Account in Google Cloud Console

1. In Google Cloud Console, click **Create Service Account**
2. Enter a name (e.g., "EAS Build Service Account")
3. Click **Create and Continue**
4. Skip the optional steps and click **Done**

### Step 4: Create and Download JSON Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create** - this will download the JSON key file

### Step 5: Link Service Account to Play Console

1. Go back to Google Play Console → **Settings** → **API access**
2. Find your service account and click **Grant access**
3. Select permissions:
   - ✅ **View app information and download bulk reports**
   - ✅ **Manage production releases**
   - ✅ **Manage testing track releases**
   - ✅ **Manage testing track releases** (for internal testing)
4. Click **Invite user**

### Step 6: Provide Key to EAS

When EAS prompts for the service account key:

```bash
# If you have the file, provide the path:
# Path to Google Service Account file: /path/to/your-service-account-key.json
```

Or configure it via credentials command:

```bash
eas credentials
```

Then select Android → Google Play → Service Account Key

## Quick Setup Command

If you already have the service account JSON file:

```bash
eas credentials
```

Then:
1. Select **Android**
2. Select **Google Play**
3. Select **Service Account Key**
4. Provide the path to your JSON key file

## Troubleshooting

### Error: "google-services.json instead of your service account key"
- Make sure you're providing the **Service Account JSON key**, not `google-services.json`
- The service account key filename usually looks like: `api-123456789012-abcdefg-1234567890ab.json`

### Where to find your service account key:
- Check your Downloads folder
- Or go to Google Cloud Console → IAM & Admin → Service Accounts → Your account → Keys

### If you lost the key:
- You'll need to create a new one (delete the old key first in Google Cloud Console)
- Then link it again in Play Console
