#!/bin/bash

# Build Script for Spendly Mobile App (Native Build)
# Usage: ./build_native.sh [android|ios|both]
# Default: both

# Ensure we are in the project root
cd "$(dirname "$0")/.." || exit

PLATFORM=$1
VERSION=$2
OUTPUT_DIR=$3

if [ -z "$PLATFORM" ]; then
  PLATFORM="both"
fi

# Handle Output Directory
if [ ! -z "$OUTPUT_DIR" ]; then
  # Resolve to absolute path if needed, or just use as is (mkdir -p handles it)
  if [[ "$OUTPUT_DIR" != /* ]]; then
    OUTPUT_DIR="$(pwd)/$OUTPUT_DIR"
  fi
  echo "📂 Output directory set to: $OUTPUT_DIR"
  mkdir -p "$OUTPUT_DIR"
fi

if [ ! -z "$VERSION" ]; then
  echo "🆙 Updating version to $VERSION..."
  # Requires 'npm' to be available
  npm version $VERSION --no-git-tag-version --allow-same-version
  
  # Also update app.json/app.config.js usually requires prebuild to pick it up, 
  # which we do below.
  echo "✅ Version updated in package.json to $VERSION"
fi

echo "🚀 Starting Native Build Process for: $PLATFORM"

# Android Build
if [ "$PLATFORM" == "android" ] || [ "$PLATFORM" == "both" ]; then
  echo "--------------------------------------------------"
  echo "🤖 Starting Android Build..."
  echo "--------------------------------------------------"
  
  # 1. Prebuild Expo
  echo "📦 Running Expo Prebuild for Android..."
  npx expo prebuild --platform android --clean
  
  # 2. Fix SDK Location (if needed)
  if ! grep -q "sdk.dir" android/local.properties 2>/dev/null; then
    echo "🔧 Setting Android SDK path in local.properties..."
    echo "sdk.dir=$HOME/Library/Android/sdk" >> android/local.properties
  fi
  
  # 3. Build APK and AAB
  echo "🏗️  Building Android Release APK and AAB..."
  cd android && ./gradlew assembleRelease bundleRelease && cd ..
  
  if [ $? -eq 0 ]; then
    echo "✅ Android Build Successful!"
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
    
    echo "📂 APK Location: $APK_PATH"
    echo "📂 AAB Location: $AAB_PATH"
    
    if [ ! -z "$OUTPUT_DIR" ]; then
      cp "$APK_PATH" "$OUTPUT_DIR/app-release.apk"
      echo "🚀 Copied APK to: $OUTPUT_DIR/app-release.apk"
      
      if [ -f "$AAB_PATH" ]; then
        cp "$AAB_PATH" "$OUTPUT_DIR/app-release.aab"
        echo "🚀 Copied AAB to: $OUTPUT_DIR/app-release.aab"
      fi
    fi
  else
    echo "❌ Android Build Failed!"
    exit 1
  fi
fi

# iOS Build
if [ "$PLATFORM" == "ios" ] || [ "$PLATFORM" == "both" ]; then
  echo "--------------------------------------------------"
  echo "🍎 Starting iOS Build..."
  echo "--------------------------------------------------"
  
  # 1. Prebuild Expo
  echo "📦 Running Expo Prebuild for iOS..."
  npx expo prebuild --platform ios --clean
  
  # 2. Build Archive
  echo "🏗️  Archiving iOS Project..."
  # Note: Adjust 'Spendly' scheme/workspace if it differs in future configurations
  cd ios
  xcodebuild -workspace Spendly.xcworkspace \
             -scheme Spendly \
             -configuration Release \
             -sdk iphoneos \
             -archivePath Spendly.xcarchive \
             archive
             
  if [ $? -eq 0 ]; then
    echo "✅ iOS Archive Successful!"
    
    # 3. Export IPA (Optional - requires ExportOptions.plist)
    # Check if ExportOptions.plist exists, if not, skip export or create one
    if [ -f "ExportOptions.plist" ]; then
      echo "📦 Exporting IPA..."
      xcodebuild -exportArchive \
                 -archivePath Spendly.xcarchive \
                 -exportOptionsPlist ExportOptions.plist \
                 -exportPath .
                 
      if [ $? -eq 0 ]; then
        echo "✅ iOS Export Successful!"
        echo "📂 IPA Location: ios/Spendly.ipa"
        
        if [ ! -z "$OUTPUT_DIR" ]; then
          cp "Spendly.ipa" "$OUTPUT_DIR/Spendly.ipa"
          echo "🚀 Copied IPA to: $OUTPUT_DIR/Spendly.ipa"
        fi
      else
        echo "⚠️  iOS Export Failed (Check ExportOptions.plist)"
      fi
    else
      echo "ℹ️  Skipping IPA export (ExportOptions.plist not found)."
      echo "📂 Archive Location: ios/Spendly.xcarchive"
      echo "👉 Open Xcode -> Window -> Organizer to distribute manually."
    fi
    cd ..
  else
    echo "❌ iOS Archive Failed!"
    cd ..
    exit 1
  fi
fi

echo "--------------------------------------------------"
echo "🎉 Build Process Completed for $PLATFORM"
echo "--------------------------------------------------"
