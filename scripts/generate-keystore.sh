#!/bin/bash

# Rise and Bloom - Production Keystore Generation Script
# This script generates a production keystore for Android app signing

echo "🔐 Rise and Bloom - Production Keystore Generator"
echo "================================================="
echo ""

# Set keystore details
KEYSTORE_NAME="rise-and-bloom-release.jks"
KEY_ALIAS="rise-and-bloom"
VALIDITY_DAYS=10000
KEY_SIZE=2048

echo "Generating production keystore with the following details:"
echo "📁 Keystore file: $KEYSTORE_NAME"
echo "🔑 Key alias: $KEY_ALIAS"
echo "📅 Validity: $VALIDITY_DAYS days (~27 years)"
echo "🔐 Key size: $KEY_SIZE bits"
echo ""

# Generate the keystore
echo "⚡ Generating keystore..."
keytool -genkey -v \
  -keystore "$KEYSTORE_NAME" \
  -keyalg RSA \
  -keysize $KEY_SIZE \
  -validity $VALIDITY_DAYS \
  -alias "$KEY_ALIAS"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore generated successfully!"
    echo ""
    echo "📍 IMPORTANT: Save these details securely:"
    echo "   • Keystore file: $KEYSTORE_NAME"
    echo "   • Key alias: $KEY_ALIAS"
    echo "   • Store password: [what you entered]"
    echo "   • Key password: [what you entered]"
    echo ""
    echo "🔒 Security recommendations:"
    echo "   • Store the keystore file in a secure location"
    echo "   • Back up the keystore and passwords securely"
    echo "   • Never commit the keystore to version control"
    echo "   • Use the same keystore for all future app updates"
    echo ""
    echo "➡️  Next steps:"
    echo "   1. Move $KEYSTORE_NAME to android/app/ directory"
    echo "   2. Update android/app/build.gradle with your passwords"
    echo "   3. Build release version with: ./gradlew bundleRelease"
else
    echo ""
    echo "❌ Keystore generation failed!"
    echo "Please check the error messages above and try again."
fi