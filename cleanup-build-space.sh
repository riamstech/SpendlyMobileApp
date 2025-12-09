#!/bin/bash

# Script to clean up build artifacts and free disk space

echo "🧹 Cleaning up build artifacts to free disk space..."
echo ""

# Clean Android build folders
echo "📱 Cleaning Android build folders..."
cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp/android
./gradlew clean 2>/dev/null || echo "Gradle clean failed or not needed"
rm -rf app/build
rm -rf build
echo "✅ Android build folders cleaned"

# Clean Gradle cache (optional - can free a lot of space)
echo ""
read -p "Do you want to clean Gradle cache? This will free more space but slow down next build (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Cleaning Gradle cache..."
    rm -rf ~/.gradle/caches
    echo "✅ Gradle cache cleaned"
fi

# Clean node_modules (if needed)
echo ""
read -p "Do you want to clean node_modules? You'll need to run 'npm install' after (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Cleaning node_modules..."
    cd /Users/mahammadrasheed/WebstormProjects/SpendlyMobileApp
    rm -rf node_modules
    echo "✅ node_modules cleaned (run 'npm install' to restore)"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Check disk space:"
df -h / | tail -1
