# <img src="https://avatars.githubusercontent.com/u/206313018?s=200&v=4" width="44" alt="Kinover Logo" /> Kinover 프론트엔드

**Kinover**는 가족만을 위한 비공개 SNS 서비스입니다.  
이 저장소는 Kinover 앱의 **프론트엔드 코드베이스**이며, **React Native** 기반으로 개발되었습니다.

<br/>

## 주요 기술 스택

- **React Native 0.78.0**
- **React 19**
- **Redux Toolkit + RTK Query + Redux Persist** – 전역 상태, 서버 상태 캐싱·무효화, 로컬 복원
- **React Navigation** – 탭·스택 네비게이션
- **Axios** – REST API
- **WebSocket (native)** – 실시간 채팅, 접속 상태 동기화
- **Kakao Login / Apple Login / JWT** – 소셜 로그인 및 세션
- **Firebase Phone Auth (SMS OTP)** – 전화번호 본인 인증, **서버로 Firebase ID Token 전달·검증**
- **MMKV / Keychain** – persist 및 민감 설정 저장
- **@react-native-firebase/messaging + Notifee** – FCM 푸시 알림
- **NetInfo** – 네트워크 상태·재연결 처리
- **S3 Presigned URL** – 이미지 업로드
- **Reanimated / Bottom Sheet / Lottie** – 인터랙션·모션 UI
- **Custom Components** – Modal, Toast, Loader 등 공통 UI

<br/>

## 주요 기능

- 실시간 채팅(WebSocket) 및 접속 상태 표시
- RTK Query 기반 서버 상태·캐시 관리
- 온보딩·약관·프로필·**전화번호 인증**·가족 설정 등 가입 플로우
- 게시글·이미지 업로드, 가족 일정·캘린더
- 추억(Memory) 피드·댓글 등 콘텐츠 UI
- AI 챗봇 대화 UI 및 흐름
- 푸시 알림 수신·표시(포그라운드/백그라운드)
- 로그인 상태 유지, 생체 잠금 등 보조 UX
- 반응형·iOS/Android 대응, 온보딩 UX

<br/>

## 실행 환경

- **React Native CLI** 기반
- **Android Studio**, **Xcode**(시뮬레이터·실기기)
- Node.js **>= 18** (`package.json` engines 기준)
- API·키 값은 **`.env`**에서 로드 (저장소에 시크릿 커밋 금지)

<br/>

## 실행 방법

```bash
git clone https://github.com/Kinover/kinover_frontend.git
cd kinover_frontend
npm install

# iOS (CocoaPods)
npx pod-install
# 또는: cd ios && pod install && cd ..

# Metro (별도 터미널)
npm start

# 앱 실행
npm run ios
# npm run android
```

<br/>

## 문서

- [내 프로젝트 기반 CS 지식 100가지](docs/내_프로젝트_기반_CS_지식_100가지.md)
