# Android Play Store Release Guide

This guide walks you **step by step** through generating a **clean Android release build (AAB)** for your **Spendly React Native / Expo app** and uploading it to **Google Play Store**.

---

## 📂 Key Files Location

All important deployment files are located in the `deployment/` directory:
- `spendly-release-key.jks`: The **Keystore** used to sign the app. **NEVER DELETE THIS.**
- `pepk.jar`: Tool for Google Play App Signing encryption.
- `encryption_public_key.pem`: Google's public key for encryption.

---

## Part 1: Prerequisites

Ensure the following are ready:
* ✅ Google Play Developer Account
* ✅ App created in **Google Play Console**
* ✅ Android Studio installed
* ✅ Node.js + npm installed

---

## Part 2: Generating the Release Build (AAB)

We have already configured `gradle.properties` to automatically use the `spendly-release-key.jks` located in the `deployment/` folder.

### 2.1 Clean and Build

Run the following commands in your project root:

```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

### 2.2 Output File

The generated AAB file will be located at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

✅ **This is the file you upload to the Google Play Store.**

---

## Part 3: Versioning for Updates

For every new update you release to the Play Store, you **MUST** increment the `versionCode` in `android/app/build.gradle` (or `app.config.js` / `app.json` if managed by Expo).

| Field       | Purpose | Rule |
| ----------- | ------- | ---- |
| `versionName` | User-facing version (e.g., "1.0.0") | Can match previous checks |
| `versionCode` | Internal build number (e.g., 4) | **MUST INCREASE every upload** |

---

## Part 4: Upload to Google Play Console

1. Go to **Google Play Console**
2. Select your app **Spendly**
3. Navigate to **Release > Production** (or Internal Testing)
4. Click **Create new release**
5. Upload the `app-release.aab` file generated in Step 2.2.
6. Enter release notes and save.

---

## Part 5: Keystore Information (CRITICAL)

**Do not lose these credentials.** They are required to update the app forever.

* **Keystore File:** `deployment/spendly-release-key.jks`
* **Keystore Password:** `changeit`
* **Key Alias:** `spendly-release`
* **Key Password:** `changeit`

---

## Troubleshooting

| Issue | Fix |
| :--- | :--- |
| `versionCode` already used | Increment `versionCode` in `app.json` or `build.gradle` |
| "Wrong Key" error | Ensure you are using `spendly-release-key.jks` (configured in `gradle.properties`) |
| Build fails | Run `cd android && ./gradlew clean` and try again |

---

✅ **This guide assumes you are using the configured `spendly-release-key.jks` in the `deployment/` folder.**
