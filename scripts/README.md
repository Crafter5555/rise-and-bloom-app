# Rise and Bloom - Production Scripts

This directory contains scripts to help with production builds and keystore management.

## 📋 Available Scripts

### 1. Generate Production Keystore
```bash
bash scripts/generate-keystore.sh
```
- Creates a production-ready keystore for Android app signing
- Prompts for secure passwords and certificate details
- Generates `rise-and-bloom-release.jks` file

### 2. Build for Production
```bash
bash scripts/build-production.sh
```
- Complete production build pipeline
- Builds web app, syncs with Capacitor, creates Android AAB/APK
- Validates keystore exists before building
- Outputs ready-to-upload files

## 🔐 Keystore Security

### Environment Variables (Recommended)
Set these environment variables for secure builds:
```bash
export KEYSTORE_PASSWORD="your-keystore-password"
export KEY_PASSWORD="your-key-password"
```

### Gradle Properties (Alternative)
Add to `android/gradle.properties` (don't commit to git):
```
KEYSTORE_PASSWORD=your-keystore-password
KEY_PASSWORD=your-key-password
```

## 📁 File Structure After Setup
```
android/app/
├── build.gradle (configured for production)
├── rise-and-bloom-release.jks (your keystore)
└── build/outputs/
    ├── bundle/release/app-release.aab (for Play Store)
    └── apk/release/app-release.apk (for testing)
```

## 🚀 Quick Start

1. **Generate keystore** (one-time setup):
   ```bash
   bash scripts/generate-keystore.sh
   ```

2. **Move keystore to android/app/**:
   ```bash
   mv rise-and-bloom-release.jks android/app/
   ```

3. **Set passwords** (choose one method):
   ```bash
   # Method 1: Environment variables
   export KEYSTORE_PASSWORD="your-password"
   export KEY_PASSWORD="your-password"
   
   # Method 2: Add to android/gradle.properties
   echo "KEYSTORE_PASSWORD=your-password" >> android/gradle.properties
   echo "KEY_PASSWORD=your-password" >> android/gradle.properties
   ```

4. **Build for production**:
   ```bash
   bash scripts/build-production.sh
   ```

## ⚠️ Security Notes

- **Never commit keystore files to version control**
- **Keep passwords secure and backed up**
- **Use the same keystore for all app updates**
- **Store keystore in multiple secure locations**

## 📱 Testing Production Builds

After building, test the APK on real devices:
```bash
# Install on connected device
adb install android/app/build/outputs/apk/release/app-release.apk

# Or upload AAB to Google Play Console internal testing
```

## 🆘 Troubleshooting

### Build Fails - Keystore Not Found
- Ensure keystore is in `android/app/` directory
- Check filename matches `rise-and-bloom-release.jks`

### Build Fails - Password Issues
- Verify environment variables are set
- Check gradle.properties file exists and has correct passwords
- Ensure passwords match what you used during keystore generation

### Capacitor Sync Issues
- Run `npx cap clean android` before building
- Ensure `npm run build` completes successfully first