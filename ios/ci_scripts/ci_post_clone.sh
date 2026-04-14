#!/bin/sh

set -e

# Disable Homebrew auto-update to speed up install
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

# Install Node.js if not already available
if ! command -v node > /dev/null 2>&1; then
    brew install node
fi

# Install CocoaPods if not already available
if ! command -v pod > /dev/null 2>&1; then
    brew install cocoapods
fi

# Move to project root
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install Node dependencies
npm install

# Patch xcodeproj to support Xcode 26+ (object version 70)
# xcodeproj 1.27.0 does not include a mapping for object version 70 (Xcode 26.x)
XCODEPROJ_CONSTANTS=$(find /usr/local/Cellar/cocoapods -name "constants.rb" -path "*/xcodeproj*/lib/xcodeproj/constants.rb" 2>/dev/null | head -1)
if [ -n "$XCODEPROJ_CONSTANTS" ]; then
    ruby -e "
      file = '$XCODEPROJ_CONSTANTS'
      content = File.read(file)
      unless content.include?('70 =>')
        content.sub!(\"77 => 'Xcode 16.0',\", \"77 => 'Xcode 16.0',\n      70 => 'Xcode 26.4',\")
        File.write(file, content)
        puts 'Patched xcodeproj constants for object version 70 (Xcode 26.x)'
      end
    "
fi

# Install CocoaPods dependencies
cd ios
pod install

# Patch fmt header to disable consteval for Xcode 26+ (Clang 17) compatibility
# fmt 11.x uses consteval which causes "not a constant expression" errors on Xcode 26
FMT_CORE="$CI_PRIMARY_REPOSITORY_PATH/ios/Pods/fmt/include/fmt/core.h"
if [ -f "$FMT_CORE" ] && ! grep -q "FMT_USE_CONSTEVAL 0" "$FMT_CORE"; then
    printf '#undef FMT_USE_CONSTEVAL\n#define FMT_USE_CONSTEVAL 0\n' | cat - "$FMT_CORE" > /tmp/fmt_core_patched.h
    mv /tmp/fmt_core_patched.h "$FMT_CORE"
    echo "Patched fmt/core.h: disabled FMT_USE_CONSTEVAL for Xcode 26"
fi
