#!/bin/bash

# Rise and Bloom - Production Build Script
# This script builds the app for production release

echo "🚀 Rise and Bloom - Production Build"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if keystore exists
KEYSTORE_PATH="android/app/rise-and-bloom-release.jks"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "${RED}❌ Error: Production keystore not found at $KEYSTORE_PATH${NC}"
    echo ""
    echo "Please run the keystore generation script first:"
    echo "  bash scripts/generate-keystore.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Keystore found${NC}"

# Step 1: Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf android/app/build/

# Step 2: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Step 3: Build web app
echo ""
echo "🔨 Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build web application${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Web build complete${NC}"

# Step 4: Sync with Capacitor
echo ""
echo "🔄 Syncing with Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to sync with Capacitor${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Capacitor sync complete${NC}"

# Step 5: Build Android release
echo ""
echo "📱 Building Android release..."
cd android

# Build AAB (recommended for Play Store)
echo ""
echo "Building Android App Bundle (AAB)..."
./gradlew bundleRelease

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build release AAB${NC}"
    cd ..
    exit 1
fi

echo -e "${GREEN}✅ AAB build complete${NC}"

# Also build APK for testing
echo ""
echo "Building APK for testing..."
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  APK build failed, but AAB succeeded${NC}"
else
    echo -e "${GREEN}✅ APK build complete${NC}"
fi

cd ..

# Step 6: Show results
echo ""
echo "🎉 Production build completed successfully!"
echo ""
echo "📁 Build artifacts:"
echo "   • AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo "   • APK: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "📝 Next steps:"
echo "   1. Test the APK on physical devices"
echo "   2. Upload AAB to Google Play Console"
echo "   3. Complete store listing with screenshots and descriptions"
echo "   4. Submit for review"
echo ""
echo -e "${GREEN}🚀 Ready for Play Store submission!${NC}"