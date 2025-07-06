# Rise and Bloom - Mobile Deployment Guide

## Overview
This document outlines the deployment process for the Rise and Bloom mobile wellness app.

## App Configuration

### App Identity
- **App ID**: `com.lovable.riseandbloom`
- **App Name**: Rise and Bloom
- **Version**: 1.0.0
- **Target Platforms**: Android (API 24+), iOS (13.0+)

## Build Process

### Prerequisites
1. **Development Environment**
   - Node.js 18+
   - Android Studio (for Android builds)
   - Xcode (for iOS builds, macOS only)
   - Capacitor CLI installed globally

2. **Accounts Required**
   - Google Play Console Developer Account
   - Apple Developer Account (for iOS)
   - Sentry Account (for crash reporting)

### Build Commands

#### Development Build
```bash
# Install dependencies
npm install

# Build for development
npm run build:dev

# Sync with native platforms
npx cap sync

# Run on Android
npm run android:dev

# Run on iOS
npm run ios:dev
```

#### Production Build
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Sync with native platforms
npx cap sync

# Open in native IDEs for signing and publishing
npx cap open android
npx cap open ios
```

## Android Deployment

### Build Configuration
- **Target SDK**: 34 (Android 14)
- **Minimum SDK**: 24 (Android 7.0)
- **Build Type**: AAB (Android App Bundle)
- **Signing**: Production keystore required

### Permissions Required
- `INTERNET` - Network access
- `ACTIVITY_RECOGNITION` - Step counting
- `BODY_SENSORS` - Health sensors access
- `ACCESS_FINE_LOCATION` - Location-based fitness
- `WAKE_LOCK` - Background processing

### Build Steps
1. Open Android Studio via `npx cap open android`
2. Select "Build" → "Generate Signed Bundle/APK"
3. Choose "Android App Bundle"
4. Configure signing with production keystore
5. Build release AAB
6. Upload to Google Play Console

### Play Store Requirements
- Content rating completed
- Privacy policy URL provided
- App screenshots (Phone, Tablet, TV if applicable)
- Feature graphic (1024x500)
- High-res icon (512x512)

## iOS Deployment

### Build Configuration
- **Target iOS**: 13.0+
- **Bundle ID**: `com.lovable.riseandbloom`
- **Signing**: Apple Developer certificates required

### Info.plist Additions Needed
```xml
<key>NSHealthShareUsageDescription</key>
<string>This app reads health data to provide wellness insights and track your daily activities.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>This app writes health data to record your wellness activities and progress.</string>
<key>NSMotionUsageDescription</key>
<string>This app uses motion data to count your daily steps and track physical activity.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses location to provide location-based wellness features and activity tracking.</string>
```

### Build Steps
1. Open Xcode via `npx cap open ios`
2. Configure signing and provisioning profiles
3. Archive the project (Product → Archive)
4. Validate and upload to App Store Connect
5. Submit for review

## Crash Reporting Setup

### Sentry Configuration
1. Create Sentry project at sentry.io
2. Get your DSN from project settings
3. Replace `YOUR_SENTRY_DSN_HERE` in `src/utils/sentry.ts`
4. Configure upload of source maps for React Native

### Sentry DSN Setup
```typescript
// In src/utils/sentry.ts
dsn: 'https://your-actual-dsn@sentry.io/project-id',
```

## Health Data Integration

### Current Implementation
- Mock health data for development/web
- Prepared for native health API integration
- Proper permission handling for iOS/Android

### Production Requirements
- Implement actual health data plugins
- Test on physical devices with health sensors
- Validate permission flows
- Ensure privacy compliance

## Testing Strategy

### Internal Testing
1. **Alpha Testing** (Internal team)
   - Core functionality verification
   - Performance testing on various devices
   - Offline functionality testing

2. **Beta Testing** (Closed group)
   - Google Play Console internal testing track
   - TestFlight for iOS
   - Feedback collection and bug fixes

### Quality Gates
- [ ] All core features functional offline
- [ ] Health permissions properly requested
- [ ] Crash reporting working in production
- [ ] Performance benchmarks met
- [ ] Battery usage optimized
- [ ] Data sync reliability verified

## Release Checklist

### Pre-Release
- [ ] All tests passing
- [ ] Crash reporting configured
- [ ] Health permissions implemented
- [ ] Performance optimized
- [ ] Icons and splash screens created
- [ ] Store descriptions written
- [ ] Privacy policy updated
- [ ] Terms of service reviewed

### Store Submission
- [ ] Android AAB uploaded to Play Console
- [ ] iOS build uploaded to App Store Connect
- [ ] Store listings completed
- [ ] Screenshots uploaded
- [ ] Content ratings completed
- [ ] Pricing and availability set

### Post-Release
- [ ] Monitor crash reports
- [ ] Track user adoption metrics
- [ ] Collect user feedback
- [ ] Plan first update based on analytics

## Monitoring and Analytics

### Key Metrics to Track
1. **Technical Health**
   - Crash rate (< 1%)
   - ANR rate (< 0.5%)
   - Load times
   - Battery usage

2. **User Engagement**
   - Daily active users
   - Session duration
   - Feature adoption rates
   - Health data sync success rates

### Tools Used
- Sentry for crash reporting
- Google Analytics (if integrated)
- Play Console/App Store Connect analytics
- Custom app analytics for wellness metrics

## Support and Maintenance

### Update Strategy
- Monthly minor updates for bug fixes
- Quarterly feature updates
- Critical security updates as needed

### User Support
- In-app feedback mechanism
- Email support channel
- FAQ documentation
- Community support forums

## Security Considerations

### Data Protection
- Health data encrypted at rest and in transit
- Minimal data collection policy
- GDPR/CCPA compliance
- Regular security audits

### Privacy
- Clear privacy policy
- Opt-in for health data sharing
- Local-first approach where possible
- User data export/deletion capabilities

---

**Note**: This deployment guide should be updated as the app evolves and new requirements emerge. Always test thoroughly on physical devices before production deployment.