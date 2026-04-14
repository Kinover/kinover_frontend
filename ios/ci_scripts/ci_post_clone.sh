#!/bin/sh

set -e

# Install Homebrew dependencies
brew install node
brew install cocoapods

# Move to project root
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install Node dependencies
npm install

# Install CocoaPods dependencies
cd ios
pod install
