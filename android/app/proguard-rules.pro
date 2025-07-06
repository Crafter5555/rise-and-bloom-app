# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep all classes used by Capacitor
-keep class com.getcapacitor.** { *; }
-keep class com.lovable.riseandbloom.** { *; }

# Keep Sentry classes
-keep class io.sentry.** { *; }

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable

# Keep React Native and JavaScript bridge
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep health and fitness related classes
-keep class com.google.android.gms.fitness.** { *; }
-keep class androidx.health.** { *; }

# Don't obfuscate stack traces for Sentry
-keepattributes LineNumberTable,SourceFile
