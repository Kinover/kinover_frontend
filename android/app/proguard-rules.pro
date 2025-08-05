# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:


# Kakao SDK 보호 설정
-keep class com.kakao.** { *; }
-keep interface com.kakao.** { *; }

# 기타 설정이 필요한 경우 대비
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keep class sun.misc.Unsafe { *; }