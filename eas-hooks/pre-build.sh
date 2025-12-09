#!/usr/bin/env bash

# EAS Build Hook: Pre-build script to create Google Service files from environment variables
# This script runs before the build starts and creates the necessary Firebase config files

set -e

echo "🔧 Running pre-build hook..."

# Create GoogleService-Info.plist for iOS if the secret exists
if [ -n "$GOOGLE_SERVICE_INFO_PLIST" ]; then
  echo "📝 Creating GoogleService-Info.plist from environment variable..."
  echo "$GOOGLE_SERVICE_INFO_PLIST" > ./GoogleService-Info.plist
  echo "✅ GoogleService-Info.plist created"
else
  echo "⚠️  Warning: GOOGLE_SERVICE_INFO_PLIST environment variable not set"
  echo "⚠️  iOS build may fail if GoogleService-Info.plist is required"
fi

# Create google-services.json for Android if the secret exists
if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "📝 Creating google-services.json from environment variable..."
  echo "$GOOGLE_SERVICES_JSON" > ./google-services.json
  echo "✅ google-services.json created"
else
  echo "⚠️  Warning: GOOGLE_SERVICES_JSON environment variable not set"
  echo "⚠️  Android build may fail if google-services.json is required"
fi

echo "✅ Pre-build hook completed"
