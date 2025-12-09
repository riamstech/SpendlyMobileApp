# Android Build & Publish Options (Without Expo/EAS)

## Option 1: Build Locally with React Native CLI

### Prerequisites
- Android Studio installed
- Java JDK installed
- Android SDK configured
- Local signing key

### Steps

1. **Generate native Android project** (if not already done)
```bash
npx expo prebuild --platform android
```

2. **Build the APK/AAB locally**
```bash
cd android
./gradlew bundleRelease  # For AAB (Play Store)
# OR
./gradlew assembleRelease  # For APK (testing)
```

3. **Find the built file**
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

4. **Upload to Play Console manually**
- Go to https://play.google.com/console
- Upload the AAB file

**Pros:**
- ✅ No Expo/EAS dependency
- ✅ Full control over build process
- ✅ Free (no build minutes)

**Cons:**
- ❌ Requires local setup
- ❌ Slower builds
- ❌ Need to manage signing keys yourself

---

## Option 2: GitHub Actions (Free CI/CD)

### Setup GitHub Actions workflow

Create `.github/workflows/android-build.yml`:

```yaml
name: Android Build

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
    
    - name: Install dependencies
      run: npm install
    
    - name: Generate Android project
      run: npx expo prebuild --platform android --no-install
    
    - name: Build AAB
      run: |
        cd android
        ./gradlew bundleRelease
    
    - name: Upload AAB
      uses: actions/upload-artifact@v3
      with:
        name: app-release
        path: android/app/build/outputs/bundle/release/app-release.aab
```

**Pros:**
- ✅ Free for public repos
- ✅ Automated builds
- ✅ No Expo dependency

**Cons:**
- ❌ Requires GitHub repo
- ❌ Need to set up signing keys as secrets

---

## Option 3: Bitrise (Cloud CI/CD)

1. Sign up at https://bitrise.io
2. Connect your GitHub/GitLab repo
3. Use React Native workflow
4. Configure Android build
5. Automatically uploads to Play Store

**Pros:**
- ✅ Free tier available
- ✅ Easy setup
- ✅ Automatic Play Store upload

**Cons:**
- ❌ Limited free builds
- ❌ Another service to manage

---

## Option 4: Codemagic (Cloud CI/CD)

1. Sign up at https://codemagic.io
2. Connect your repo
3. Configure Android build
4. Set up Play Store credentials
5. Automatic builds and uploads

**Pros:**
- ✅ Free tier (500 build minutes/month)
- ✅ Built for mobile apps
- ✅ Easy Play Store integration

**Cons:**
- ❌ Limited free tier

---

## Option 5: Build Locally, Upload Manually

### Step 1: Build locally
```bash
# Generate native code
npx expo prebuild --platform android

# Build AAB
cd android
./gradlew bundleRelease
```

### Step 2: Sign the AAB (if needed)
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore your-keystore.jks \
  app-release.aab \
  your-key-alias
```

### Step 3: Upload to Play Console
1. Go to https://play.google.com/console
2. Select your app
3. Go to Production → Create new release
4. Upload the AAB file

**Pros:**
- ✅ Complete control
- ✅ No external services
- ✅ Free

**Cons:**
- ❌ Manual process
- ❌ Need local setup

---

## Option 6: Use Expo Build Service (But Download & Upload Manually)

Even if you use EAS Build, you can:
1. Build with EAS: `eas build --profile production --platform android`
2. Download the AAB from build logs
3. Upload manually to Play Console (no service account needed)

This way you use Expo for building but not for publishing.

---

## Option 7: Fastlane (Automation Tool)

### Setup Fastlane

1. **Install Fastlane**
```bash
gem install fastlane
```

2. **Initialize in android folder**
```bash
cd android
fastlane init
```

3. **Configure Fastfile**
```ruby
default_platform(:android)

platform :android do
  desc "Build and upload to Play Store"
  lane :release do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "production",
      aab: "app/build/outputs/bundle/release/app-release.aab"
    )
  end
end
```

4. **Run**
```bash
fastlane android release
```

**Pros:**
- ✅ Powerful automation
- ✅ Can integrate with any CI/CD
- ✅ Handles signing, uploading, etc.

**Cons:**
- ❌ Requires setup
- ❌ Still needs service account for Play Store

---

## Recommended Approach

**For simplicity:** Use **Option 1 (Local Build)** or **Option 6 (EAS Build, Manual Upload)**

**For automation:** Use **Option 2 (GitHub Actions)** or **Option 4 (Codemagic)**

---

## Current Situation

Since you're using Expo, the easiest non-Expo publishing option is:

1. **Keep using EAS for building** (it's convenient)
2. **Download the AAB** from build logs
3. **Upload manually to Play Console** (no service account needed)

This gives you the benefits of EAS builds without needing Play Store API credentials.
