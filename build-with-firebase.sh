#!/bin/bash

# Firebase Build Script for Spendly Mobile App
# This script builds the app with Firebase and then securely removes config files

echo "🔥 Starting Firebase-enabled build..."

# Check if Firebase config files exist
if [ ! -f "GoogleService-Info.plist" ]; then
    echo "❌ Error: GoogleService-Info.plist not found!"
    exit 1
fi

if [ ! -f "google-services.json" ]; then
    echo "❌ Error: google-services.json not found!"
    exit 1
fi

echo "✅ Firebase config files found"

# Stop any running builds
echo "🛑 Stopping any running builds..."
pkill -f "expo run-ios" || true
sleep 2

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npx expo prebuild --clean

# Build for iOS
echo "📱 Building for iOS with Firebase..."
npx expo run:ios --device "Rasheed"

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Securely remove Firebase config files
    echo "🔒 Securely removing Firebase config files..."
    srm -f GoogleService-Info.plist google-services.json 2>/dev/null || rm -f GoogleService-Info.plist google-services.json
    
    echo "✅ Firebase config files removed"
    echo "🎉 Build complete and config files cleaned up!"
else
    echo "❌ Build failed!"
    echo "⚠️  Firebase config files NOT removed (you may need them for debugging)"
    exit 1
fi
