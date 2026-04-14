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

# Remove .xcode.env.local — it contains a hardcoded local nvm path (/Users/zzizi/...)
# that does not exist in Xcode Cloud. Removing it lets .xcode.env take over,
# which uses $(command -v node) to find node dynamically.
rm -f "$CI_PRIMARY_REPOSITORY_PATH/ios/.xcode.env.local"
echo "Removed .xcode.env.local: NODE_BINARY will be resolved by .xcode.env"

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

# Patch fmt to disable consteval for Xcode 26+ (Clang 17) compatibility
# FMT_USE_CONSTEVAL is defined in base.h (fmt 11.x) or core.h (older fmt).
# Prepending to format-inl.h doesn't work — base.h redefines it later.
# Fix: sed-replace the definition at its source.
FMT_INCLUDE="$CI_PRIMARY_REPOSITORY_PATH/ios/Pods/fmt/include/fmt"
for FMT_HEADER in "$FMT_INCLUDE/base.h" "$FMT_INCLUDE/core.h"; do
    if [ -f "$FMT_HEADER" ]; then
        sed -i '' 's/define FMT_USE_CONSTEVAL 1/define FMT_USE_CONSTEVAL 0/g' "$FMT_HEADER"
        echo "Patched $(basename $FMT_HEADER): FMT_USE_CONSTEVAL forced to 0"
    fi
done
