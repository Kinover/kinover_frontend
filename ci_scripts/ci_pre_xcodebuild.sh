#!/bin/sh
# Xcode Cloud: xcodebuild 직전 — Pods 누락 시 Archive가 xcfilelist 오류로 실패하므로 여기서 한 번 더 보장
# (post_clone이 스킵/실패해도 마지막 방어선)

set -eux

REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-${WORKSPACE:-$(pwd)}}"
cd "$REPO_ROOT"

echo "[ci_pre_xcodebuild] pwd=$(pwd)"

# post_clone에서 이미 설치됐을 수 있음 — node_modules 없으면 최소 설치
if [ ! -d node_modules ] || [ ! -d node_modules/react-native ]; then
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
fi

export NODE_BINARY="${NODE_BINARY:-$(command -v node)}"

cd ios
command -v pod || { echo "[ci_pre_xcodebuild] ERROR: pod not in PATH" >&2; exit 1; }
pod install

XCCONFIG="Pods/Target Support Files/Pods-kinover_frontend/Pods-kinover_frontend.release.xcconfig"
if [ ! -f "$XCCONFIG" ]; then
  echo "[ci_pre_xcodebuild] ERROR: missing $XCCONFIG after pod install" >&2
  exit 1
fi

echo "[ci_pre_xcodebuild] OK"
