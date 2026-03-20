# Xcode Cloud – iOS Archive (Pods 누락 오류)

## 증상

Archive 단계에서 아래와 비슷한 오류가 나는 경우:

- `Unable to load contents of file list: ... Pods-kinover_frontend-*-Release-*.xcfilelist`
- `Unable to open base configuration reference file .../ios/Pods/Target Support Files/Pods-kinover_frontend/Pods-kinover_frontend.release.xcconfig`

## 원인

- `ios/Pods/` 는 `.gitignore`에 포함되어 **Git에 올라가지 않는다.**
- Xcode Cloud는 저장소를 클론한 뒤 바로 빌드하므로, **`pod install`을 하지 않으면 `Pods` 폴더가 없어** 위 파일들이 생성되지 않는다.
- React Native의 `Podfile`은 **`node`로 `react-native` 경로를 찾기 때문에**, `pod install` 전에 **`npm ci`로 `node_modules`가 있어야** 한다.

## 대응 (이 저장소)

저장소 루트에 **`ci_scripts/ci_post_clone.sh`** 를 두었다.

- 클론 직후: `npm ci` → `cd ios && pod install`
- Xcode Cloud는 이 스크립트를 자동으로 실행한다. ([Custom script timing](https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build))

스크립트에 **실행 권한**이 있어야 한다:

```bash
chmod +x ci_scripts/ci_post_clone.sh
git update-index --chmod=+x ci_scripts/ci_post_clone.sh
```

## App Store Connect에서 확인할 것

1. **Xcode Cloud** → 해당 워크플로 → **Edit Workflow**
2. **Environment**에서 Node/npm이 필요하면 버전 지정(이미지에 따라 다름)
3. 변경 후 다시 빌드

## 로컬에서 동일 재현

```bash
rm -rf ios/Pods ios/build
npm ci
cd ios && pod install
```

이후 Xcode에서 Archive가 되면, CI에서도 동일하게 `ci_post_clone`만 정상 실행되면 통과한다.
