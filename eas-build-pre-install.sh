#!/bin/bash

# EAS Build Pre-Install Hook
# This script ensures Google Service files are available during EAS Build

set -euo pipefail

echo "🔧 EAS Build Pre-Install Hook: Setting up Google Service files..."

# Check if files already exist (they might be in git or provided via secrets)
if [ -f "GoogleService-Info.plist" ] && [ -f "google-services.json" ]; then
    echo "✅ Google Service files already exist"
    exit 0
fi

# Try to get files from EAS environment variables if they exist
if [ -n "${GOOGLE_SERVICE_INFO_PLIST:-}" ]; then
    echo "📝 Writing GoogleService-Info.plist from environment variable..."
    echo "$GOOGLE_SERVICE_INFO_PLIST" > GoogleService-Info.plist
fi

if [ -n "${GOOGLE_SERVICES_JSON:-}" ]; then
    echo "📝 Writing google-services.json from environment variable..."
    echo "$GOOGLE_SERVICES_JSON" > google-services.json
fi

# Verify files exist
if [ ! -f "GoogleService-Info.plist" ]; then
    echo "⚠️  Warning: GoogleService-Info.plist not found. Build may fail."
    echo "💡 Tip: Add GOOGLE_SERVICE_INFO_PLIST as an EAS environment variable"
fi

if [ ! -f "google-services.json" ]; then
    echo "⚠️  Warning: google-services.json not found. Android build may fail."
    echo "💡 Tip: Add GOOGLE_SERVICES_JSON as an EAS environment variable"
fi

echo "✅ Pre-install hook completed"
