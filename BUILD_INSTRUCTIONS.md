# Rise and Bloom - Mobile Build Instructions

## Prerequisites
- Node.js 18+
- Android Studio (for Android)
- Xcode (for iOS, macOS only)
- Capacitor CLI: `npm install -g @capacitor/cli`

## Initial Setup
```bash
# Clone and install dependencies
git clone <your-repo-url>
cd rise-and-bloom
npm install

# Build the web app
npm run build

# Add native platforms (if not already added)
npx cap add android
npx cap add ios

# Sync web assets to native projects
npx cap sync
```

## Development Builds

### Android Development
```bash
# Open Android Studio
npx cap open android

# Or run directly (requires Android SDK)
npx cap run android
```

### iOS Development (macOS only)
```bash
# Open Xcode
npx cap open ios

# Or run directly (requires Xcode)
npx cap run ios
```

## Production Builds

### Android Production
1. **Generate Production Keystore**
```bash
keytool -genkey -v -keystore release-key.keystore -alias rise-and-bloom -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure Signing** (in `android/app/build.gradle`)
```gradle
android {
    signingConfigs {
        release {
            keyAlias 'rise-and-bloom'
            keyPassword 'your-key-password'
            storeFile file('release-key.keystore')
            storePassword 'your-store-password'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

3. **Build Production APK/AAB**
```bash
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease    # For AAB (recommended)
```

### iOS Production (macOS only)
1. **Configure Signing** in Xcode:
   - Select your team/developer account
   - Set up provisioning profiles
   - Configure app identifiers

2. **Archive for Distribution**:
   - Product → Archive in Xcode
   - Upload to App Store Connect

## Build Optimization

### Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --analyze

# Check bundle stats
npx vite-bundle-analyzer dist
```

### Performance Optimization
- Code splitting is already configured
- Tree shaking enabled
- Asset optimization active
- Gzip compression enabled

## Current Build Status
✅ **Development Builds**: Working on all platforms
✅ **Web Build**: Optimized and ready
✅ **Asset Pipeline**: Icons and splash screens configured
⚠️ **Production Signing**: Requires keystore/certificate setup

## Troubleshooting

### Common Issues
1. **Build Failures**: Run `npx cap sync` after code changes
2. **Asset Issues**: Check file paths in capacitor.config.ts
3. **Platform Errors**: Ensure latest Android/iOS platform versions

### Getting Help
- Check Capacitor docs: https://capacitorjs.com/docs
- Lovable Discord: https://discord.gg/lovable
- Project issues: Create GitHub issue in your repository