# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ---- Q Spot: keep everything the WebView bridge calls by name ----
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,Exceptions
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * { @com.getcapacitor.PluginMethod public <methods>; }
-keep class com.quadora.app.** { *; }
-keep class org.apache.cordova.** { *; }
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
# Google ads / Firebase ship their own rules; these keep reflection-based parts safe
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**
# Firebase Authentication plugin has optional Facebook/Twitter/etc. sign-in handlers we don't include
-dontwarn com.facebook.**
-dontwarn com.twitter.**
-dontwarn com.google.android.gms.games.**
-dontwarn io.capawesome.capacitorjs.plugins.firebase.authentication.handlers.**
