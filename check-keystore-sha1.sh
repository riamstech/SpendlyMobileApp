#!/bin/bash

# Script to check the SHA1 fingerprint of spendly-release-key.jks
# Expected SHA1: 86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68

EXPECTED_SHA1="86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68"
KEYSTORE_PATH="android/app/spendly-release-key.jks"

echo "Checking keystore: $KEYSTORE_PATH"
echo "Expected SHA1: $EXPECTED_SHA1"
echo ""
echo "Please enter the keystore password when prompted:"
echo ""

# Get SHA1 from keystore
SHA1_OUTPUT=$(keytool -list -v -keystore "$KEYSTORE_PATH" 2>&1 | grep -i "SHA1:" | head -1)

if [ ! -z "$SHA1_OUTPUT" ]; then
    ACTUAL_SHA1=$(echo "$SHA1_OUTPUT" | awk '{print $2}')
    echo "Actual SHA1:   $ACTUAL_SHA1"
    echo ""
    
    # Compare (remove colons for comparison)
    EXPECTED_CLEAN=$(echo "$EXPECTED_SHA1" | tr -d ':')
    ACTUAL_CLEAN=$(echo "$ACTUAL_SHA1" | tr -d ':')
    
    if [ "$EXPECTED_CLEAN" = "$ACTUAL_CLEAN" ]; then
        echo "✅ MATCH! This is the correct keystore."
        echo ""
        echo "Next steps:"
        echo "1. Create android/key.properties file with your keystore details"
        echo "2. The build.gradle is already configured to use it"
        exit 0
    else
        echo "❌ MISMATCH! This is NOT the correct keystore."
        echo ""
        echo "Expected: $EXPECTED_SHA1"
        echo "Actual:   $ACTUAL_SHA1"
        echo ""
        echo "You need to find the keystore with SHA1: $EXPECTED_SHA1"
        exit 1
    fi
else
    echo "❌ Could not read SHA1 from keystore."
    echo "Make sure you entered the correct password."
    exit 1
fi
