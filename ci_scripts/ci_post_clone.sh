#!/bin/sh
# Xcode Cloud: 저장소 클론 직후 실행
# - node_modules 없음 → Podfile의 `node` 호출 실패
# - ios/Pods 없음 → Pods-kinover_frontend *.xcfilelist / *.xcconfig 누락 오류
#
# 참고: https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build

set -eu

REPO_ROOT="${CI_PRIMARY_REPOSITORY_PATH:-${WORKSPACE:-.}}"
cd "$REPO_ROOT"

echo "[ci_post_clone] REPO_ROOT=${REPO_ROOT}"

# Podfile이 react-native 경로를 node로 찾으므로 먼저 JS 의존성 설치
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# Xcode 빌드 페이즈에서 사용할 Node 경로 (ios/.xcode.env와 동일 개념)
export NODE_BINARY="${NODE_BINARY:-$(command -v node)}"
echo "[ci_post_clone] NODE_BINARY=${NODE_BINARY}"

cd ios
pod install

echo "[ci_post_clone] done"
