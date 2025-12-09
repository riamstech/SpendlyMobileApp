# Verify Service Account Permissions

## Current Issue

The service account permissions are still not working. Let's verify they're set correctly.

## Step-by-Step Verification

### 1. Go to Play Console

Visit: https://play.google.com/console
- Sign in
- Select your app: **Spendly Money** (com.spendly.money)

### 2. Navigate to API Access

1. Click **Settings** (gear icon) in the left sidebar
2. Click **API access**

### 3. Find Your Service Account

Look for: `spendly-money@spendly-f8628.iam.gserviceaccount.com`

### 4. Check Service Account Status

The service account should show:
- **Status**: Active (green checkmark) ✅
- **Access**: Should show permissions granted

### 5. Verify Permissions

Click on the service account or click **Manage access** / **Grant access**

Make sure ALL of these are checked:

#### Required Permissions:
- ✅ **View app information and download bulk reports**
- ✅ **Manage production releases** 
- ✅ **Manage testing track releases** (this is critical for internal testing)

### 6. Important: App-Level Permissions

After granting account-level permissions, you may need to grant **app-specific permissions**:

1. In the API access page, find your service account
2. Click on it or click **Manage access**
3. You should see a list of your apps
4. Make sure **Spendly Money** (com.spendly.money) is listed
5. If not, click **Grant access** and select the app
6. Grant the same permissions for that specific app

### 7. Re-invite Service Account (If Needed)

If the service account shows as "Pending" or "Invited":

1. Click **Remove access** (if it exists)
2. Click **Grant access** again
3. Select the service account: `spendly-money@spendly-f8628.iam.gserviceaccount.com`
4. Grant all permissions
5. Make sure to grant access to the specific app: **Spendly Money**

### 8. Wait for Propagation

- Wait **5-10 minutes** after granting permissions
- Permissions can take time to propagate through Google's systems

## Common Issues

### Issue: Service Account Not Listed
**Solution**: The service account might not be linked. You need to:
1. Go to Google Cloud Console
2. Create or verify the service account exists
3. Go back to Play Console → API access
4. Click **Create new service account** or **Link existing service account**

### Issue: Permissions Granted But Still Failing
**Solution**: 
1. Try removing and re-granting permissions
2. Make sure you granted permissions for the **specific app** (not just account-level)
3. Wait longer (up to 10 minutes)
4. Check if the service account status is "Active" not "Pending"

### Issue: Can't Find Service Account
**Solution**:
1. Verify the email: `spendly-money@spendly-f8628.iam.gserviceaccount.com`
2. Check Google Cloud Console → IAM & Admin → Service Accounts
3. Make sure it exists and is active

## Alternative: Manual Upload

If permissions continue to fail, you can upload manually:

1. **Download the AAB**:
   - URL: https://expo.dev/artifacts/eas/onxcz8EEutJaaXVFdv2CQ.aab
   - Or from: https://expo.dev/accounts/riamstech/projects/SpendlyMobileApp/builds/031fa2db-243b-43e9-831a-d62d0d8dd3e4

2. **Upload to Play Console**:
   - Go to: https://play.google.com/console
   - Select: **Spendly Money**
   - Go to: **Testing** → **Internal testing**
   - Click: **Create new release**
   - Upload the AAB file
   - Fill in release notes
   - Review and roll out

This bypasses the API and works immediately.

## Verification Checklist

Before retrying submission, verify:

- [ ] Service account is listed in Play Console → Settings → API access
- [ ] Service account status is "Active" (green checkmark)
- [ ] All three permissions are checked:
  - [ ] View app information and download bulk reports
  - [ ] Manage production releases
  - [ ] Manage testing track releases
- [ ] App-specific permissions are granted (for com.spendly.money)
- [ ] Waited 5-10 minutes after granting permissions
- [ ] Tried removing and re-granting permissions if still failing

## Next Steps

1. Verify all permissions are set correctly (follow steps above)
2. Wait 5-10 minutes
3. Retry submission:
   ```bash
   cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
   eas submit --platform android --latest --profile production
   ```

Or use manual upload as a workaround.
