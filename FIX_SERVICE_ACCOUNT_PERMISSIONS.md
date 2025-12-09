# Fix Service Account Permissions

## Current Issue

The service account `spendly-money@spendly-f8628.iam.gserviceaccount.com` is missing the necessary permissions to submit apps to Google Play Store.

## How to Fix

### Step 1: Go to Google Play Console

1. Visit: https://play.google.com/console
2. Sign in with your Google account
3. Select your app: **Spendly Money** (com.spendly.money)

### Step 2: Navigate to API Access

1. In the left sidebar, click **Settings** (gear icon)
2. Click **API access**
3. You should see your service account listed: `spendly-money@spendly-f8628.iam.gserviceaccount.com`

### Step 3: Grant Permissions

1. Find your service account in the list
2. Click **Grant access** (or **Manage access** if already granted)
3. **Select ALL of these permissions**:
   - ✅ **View app information and download bulk reports**
   - ✅ **Manage production releases**
   - ✅ **Manage testing track releases** (for internal testing)
   - ✅ **Manage testing track releases** (for alpha/beta testing)

4. Click **Invite user** or **Save**

### Step 4: Wait for Permissions to Propagate

- Wait 2-3 minutes for permissions to propagate
- The service account status should show as "Active" with a green checkmark

### Step 5: Retry Submission

After granting permissions, retry the submission:

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
eas submit --platform android --latest --profile production
```

## Alternative: Create New Service Account

If the service account doesn't appear or you can't grant permissions:

### Option 1: Create New Service Account in Play Console

1. Go to: https://play.google.com/console
2. **Settings** → **API access**
3. Click **Create new service account**
4. Follow the link to Google Cloud Console
5. Create the service account
6. Download the JSON key
7. Go back to Play Console and grant permissions
8. Update EAS credentials with the new JSON key

### Option 2: Use Existing Service Account

If you already have the service account JSON file (`spendly-f8628-e7107529f114.json`):

1. Make sure it's linked in Play Console
2. Grant the permissions listed above
3. The submission should work

## Verify Service Account Status

In Play Console → Settings → API access, you should see:
- Service account email: `spendly-money@spendly-f8628.iam.gserviceaccount.com`
- Status: **Active** ✅
- Permissions: All the permissions listed above should be checked

## Common Issues

### "Service account not found"
- The service account might not be linked to your Play Console
- Create a new service account or link the existing one

### "Insufficient permissions"
- Make sure ALL required permissions are granted
- Wait a few minutes after granting permissions
- Try refreshing the Play Console page

### "API not enabled"
- Make sure Google Play Android Developer API is enabled
- Visit: https://console.developers.google.com/apis/api/androidpublisher.googleapis.com/overview?project=913299133500

## Quick Checklist

- [ ] Google Play Android Developer API is enabled
- [ ] Service account exists in Play Console
- [ ] Service account has all required permissions
- [ ] Service account status is "Active"
- [ ] Waited 2-3 minutes after granting permissions

## Next Steps After Fixing

Once permissions are granted:

```bash
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
eas submit --platform android --latest --profile production
```

The submission should succeed!
