#!/bin/sh
# Xcode Cloud: 클론 직후 — node_modules + ios/Pods 생성
# https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build

set -eux

REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-${WORKSPACE:-$(pwd)}}"
cd "$REPO_ROOT"

echo "[ci_post_clone] pwd=$(pwd)"
echo "[ci_post_clone] CI_PRIMARY_REPOSITORY_PATH=${CI_PRIMARY_REPOSITORY_PATH:-}"

if [ ! -f package.json ]; then
  echo "[ci_post_clone] ERROR: package.json not found at repo root" >&2
  exit 1
fi

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

export NODE_BINARY="${NODE_BINARY:-$(command -v node)}"
echo "[ci_post_clone] NODE_BINARY=${NODE_BINARY}"

if [ ! -d ios ]; then
  echo "[ci_post_clone] ERROR: ios/ missing" >&2
  exit 1
fi

cd ios
# CocoaPods (Xcode Cloud 이미지에 기본 포함, 없으면 로그로 확인)
command -v pod || { echo "[ci_post_clone] ERROR: pod not in PATH" >&2; exit 1; }
pod install

XCCONFIG="Pods/Target Support Files/Pods-kinover_frontend/Pods-kinover_frontend.release.xcconfig"
if [ ! -f "$XCCONFIG" ]; then
  echo "[ci_post_clone] ERROR: pod install did not produce $XCCONFIG" >&2
  ls -la Pods/Target\ Support\ Files/ 2>/dev/null || true
  exit 1
fi

echo "[ci_post_clone] OK — $XCCONFIG exists"
