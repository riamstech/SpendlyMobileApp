#!/bin/bash

# Script to download and check the SHA1 signature of the latest build

BUILD_ID="9042dcf2-45c3-4c95-9a16-95c06b324684"
AAB_URL="https://expo.dev/artifacts/eas/iPdfrmgKRNWSH8ezXZQwxo.aab"
EXPECTED_SHA1="86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68"

echo "Downloading AAB file..."
curl -L -o /tmp/build-check.aab "$AAB_URL"

if [ $? -eq 0 ]; then
    echo "Checking signature..."
    SHA1_OUTPUT=$(keytool -printcert -jarfile /tmp/build-check.aab 2>&1 | grep -i "SHA1:" | head -1)
    
    if [ ! -z "$SHA1_OUTPUT" ]; then
        ACTUAL_SHA1=$(echo "$SHA1_OUTPUT" | awk '{print $2}')
        echo ""
        echo "Expected SHA1: $EXPECTED_SHA1"
        echo "Actual SHA1:   $ACTUAL_SHA1"
        echo ""
        
        EXPECTED_CLEAN=$(echo "$EXPECTED_SHA1" | tr -d ':')
        ACTUAL_CLEAN=$(echo "$ACTUAL_SHA1" | tr -d ':')
        
        if [ "$EXPECTED_CLEAN" = "$ACTUAL_CLEAN" ]; then
            echo "✅ MATCH! Build is signed with the correct keystore."
        else
            echo "❌ MISMATCH! Build is still signed with the wrong keystore."
            echo "You need to rebuild after configuring EAS credentials."
        fi
    else
        echo "Could not read signature from AAB file."
    fi
    
    rm -f /tmp/build-check.aab
else
    echo "Failed to download AAB file."
fi
