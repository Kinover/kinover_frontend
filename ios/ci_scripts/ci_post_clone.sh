#!/bin/sh

set -e

# Move to project root (one level up from ios/)
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install Node dependencies
npm install

# Install CocoaPods dependencies
cd ios
pod install
