#!/bin/bash

# Script to find the release keystore with the correct SHA1 fingerprint
# Expected SHA1: 86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68

EXPECTED_SHA1="86:5B:EF:BB:37:91:4B:B2:9B:82:77:6B:92:FC:71:4A:F5:8F:AB:68"
EXPECTED_SHA1_CLEAN=$(echo "$EXPECTED_SHA1" | tr -d ':')

echo "Searching for keystore with SHA1: $EXPECTED_SHA1"
echo "================================================"
echo ""

# Search in common locations
SEARCH_DIRS=(
  "$HOME"
  "$HOME/Documents"
  "$HOME/Desktop"
  "$HOME/Downloads"
  "/Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp/android"
  "/Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp"
)

FOUND=0

for dir in "${SEARCH_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "Searching in: $dir"
    find "$dir" -type f \( -name "*.jks" -o -name "*.keystore" \) 2>/dev/null | while read keystore; do
      echo "  Checking: $keystore"
      
      # Try to get SHA1 (will prompt for password if needed)
      SHA1_OUTPUT=$(keytool -list -v -keystore "$keystore" 2>&1 | grep -i "SHA1:" | head -1)
      
      if [ ! -z "$SHA1_OUTPUT" ]; then
        SHA1=$(echo "$SHA1_OUTPUT" | awk '{print $2}' | tr -d ':')
        SHA1_FORMATTED=$(echo "$SHA1_OUTPUT" | awk '{print $2}')
        
        echo "    SHA1: $SHA1_FORMATTED"
        
        if [ "$SHA1" = "$EXPECTED_SHA1_CLEAN" ]; then
          echo ""
          echo "✅ FOUND MATCHING KEYSTORE!"
          echo "   Path: $keystore"
          echo "   SHA1: $SHA1_FORMATTED"
          echo ""
          FOUND=1
        fi
      fi
    done
  fi
done

if [ $FOUND -eq 0 ]; then
  echo ""
  echo "❌ No matching keystore found with SHA1: $EXPECTED_SHA1"
  echo ""
  echo "Next steps:"
  echo "1. Check your backups or secure storage"
  echo "2. Check with team members who might have it"
  echo "3. Check Expo Dashboard: https://expo.dev/accounts/riamstech/projects/SpendlyMobileApp/credentials"
  echo "4. Contact Expo support if the keystore was managed by EAS"
fi
