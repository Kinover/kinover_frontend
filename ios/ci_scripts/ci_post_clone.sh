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

# Install CocoaPods dependencies
cd ios
pod install
