#!/bin/bash

# Script to set up EAS environment variables for Google Service files
# Run this script to securely store your Firebase config files in EAS

echo "🔐 Setting up EAS environment variables for Firebase config files..."
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
echo "⚠️  Note: The 'eas secret:create' command is deprecated."
echo "⚠️  Please use the EAS Dashboard or 'eas env:create' command instead."
echo ""
echo "To set up the environment variables manually:"
echo ""
echo "1. Go to: https://expo.dev/accounts/riamstech/projects/SpendlyMobileApp/secrets"
echo ""
echo "2. Add the following environment variables:"
echo ""
echo "   Variable name: GOOGLE_SERVICE_INFO_PLIST"
echo "   Value: (paste the content of GoogleService-Info.plist)"
echo ""
echo "   Variable name: GOOGLE_SERVICES_JSON"
echo "   Value: (paste the content of google-services.json)"
echo ""
echo "3. Or use the CLI commands below:"
echo ""
echo "   For iOS (GoogleService-Info.plist):"
echo "   eas env:create --name GOOGLE_SERVICE_INFO_PLIST --value \"\$(cat GoogleService-Info.plist)\" --scope project"
echo ""
echo "   For Android (google-services.json):"
echo "   eas env:create --name GOOGLE_SERVICES_JSON --value \"\$(cat google-services.json)\" --scope project"
echo ""
