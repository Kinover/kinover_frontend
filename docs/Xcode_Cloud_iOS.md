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

저장소 루트 **`ci_scripts/`** 에 스크립트를 둔다.

| 스크립트 | 시점 |
|----------|------|
| **`ci_post_clone.sh`** | 클론 직후 — `npm ci` → `pod install`, 생성된 `Pods-kinover_frontend.release.xcconfig` 존재 여부 검사 |
| **`ci_pre_xcodebuild.sh`** | **xcodebuild 직전** — `node_modules`/Pods 없으면 다시 설치 (post_clone이 스킵·실패해도 방어) |

[Xcode Cloud custom scripts](https://developer.apple.com/documentation/xcode/running-custom-scripts-during-a-build)

실행 권한 (커밋 시 유지):

```bash
chmod +x ci_scripts/ci_post_clone.sh ci_scripts/ci_pre_xcodebuild.sh
git add --chmod=+x ci_scripts/ci_post_clone.sh ci_scripts/ci_pre_xcodebuild.sh
```

## 빌드 로그에서 확인할 것

Xcode Cloud 아티팩트 로그에 **`[ci_post_clone]`** / **`[ci_pre_xcodebuild]`** 가 찍히는지 본다.

- **한 줄도 없으면** → 워크플로가 이 저장소/브랜치를 쓰는지, `ci_scripts`가 그 커밋에 포함됐는지 확인.
- **ERROR 줄이 있으면** → 그 메시지 기준으로 `npm ci` / `pod` / 네트워크 등을 본다.

## App Store Connect

1. **Xcode Cloud** → 워크플로 → **Edit Workflow**
2. 빌드하는 **브랜치**가 위 스크립트가 머지된 브랜치인지 확인
3. **Environment**에서 Node 버전이 필요하면 지정

## 로컬에서 동일 재현

```bash
rm -rf ios/Pods ios/build
npm ci
cd ios && pod install
```
