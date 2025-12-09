# Configure EAS Credentials

## Important: Run from Project Root

The `eas credentials` command must be run from the **project root directory**, not from `android/app/`.

## Steps to Configure EAS Credentials

1. **Navigate to project root**:
   ```bash
   cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
   ```

2. **Run EAS credentials**:
   ```bash
   eas credentials
   ```

3. **Follow the prompts**:
   - Select **Android**
   - Select **production** profile
   - Choose **Set up a new Android Keystore** (or **Update existing** if one exists)
   - Select **I want to upload my own keystore**
   - Provide the path: `android/app/spendly-release-key.jks`
   - Enter keystore password: `changeit`
   - Enter key alias: `spendly-release`
   - Enter key password: `changeit`

## Keystore Details

- **Keystore Path**: `android/app/spendly-release-key.jks`
- **Keystore Password**: `changeit`
- **Key Alias**: `spendly-release`
- **Key Password**: `changeit`
- **SHA1**: `86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68`

## After Configuration

Once configured, your EAS builds will automatically use this keystore for signing. You can then build with:

```bash
eas build --profile production --platform android
```

The build will be signed with the correct key that Play Store expects.
