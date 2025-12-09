#!/bin/bash

# Script to create EAS environment variables for Firebase config files
# This script will create the environment variables interactively

set -e

echo "🔐 Creating EAS environment variables for Firebase config files..."
echo ""

# Check if files exist
if [ ! -f "GoogleService-Info.plist" ]; then
    echo "❌ Error: GoogleService-Info.plist not found!"
    exit 1
fi

if [ ! -f "google-services.json" ]; then
    echo "❌ Error: google-services.json not found!"
    exit 1
fi

echo "📝 Reading GoogleService-Info.plist..."
PLIST_CONTENT=$(cat GoogleService-Info.plist)

echo "📝 Reading google-services.json..."
JSON_CONTENT=$(cat google-services.json)

echo ""
echo "Creating GOOGLE_SERVICE_INFO_PLIST environment variable..."
echo "When prompted, the content will be automatically provided."
echo ""

# Create iOS environment variable
echo "$PLIST_CONTENT" | eas env:create --name GOOGLE_SERVICE_INFO_PLIST --scope project --type string --visibility public

echo ""
echo "Creating GOOGLE_SERVICES_JSON environment variable..."
echo "When prompted, the content will be automatically provided."
echo ""

# Create Android environment variable
echo "$JSON_CONTENT" | eas env:create --name GOOGLE_SERVICES_JSON --scope project --type string --visibility public

echo ""
echo "✅ Environment variables created successfully!"
echo ""
echo "You can verify them by running: eas env:list --scope project"
