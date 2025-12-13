# Play Store Upload Instructions (App Signing Enrolled)

You are enrolled in **Google Play App Signing**. This means Google signs the final APK for you, and you must upload artifacts signed with your dedicated **Upload Key**, not your App Signing Key.

## 1. Reset Your Upload Key 
Since you previously tried to sign with the App Signing Key (and it was rejected), you must tell Google to accept your **NEW Upload Key**.

1.  **Go to Google Play Console**
2.  Navigate to **Release > Setup > App integrity**.
3.  Scroll to **Upload key certificate**.
4.  Click **Request upload key reset**.
5.  Select **"I lost my upload key"** (or similar option).
6.  Upload the `deployment/upload_certificate.pem` file found in your project.
7.  **Wait 48 hours**: Google enforces this security delay.

## 2. Upload the New AAB
After the 48-hour wait is over:

1.  **Go to Google Play Console**.
2.  **Create a new release**.
3.  Upload the generated AAB file:
    `android/app/build/outputs/bundle/release/app-release.aab`

## Credentials (Used Automatically)

The project is now configured to use this dedicated Upload Key automatically.

*   **Keystore:** `deployment/spendly-upload-key.jks`
*   **Key Alias:** `spendly-upload`
*   **Store Password:** `spendly123`
*   **Key Password:** `spendly123`

You do not need to enter these manually; `gradle.properties` handles it.
