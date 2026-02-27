# <img src="https://avatars.githubusercontent.com/u/206313018?s=200&v=4" width="44" alt="Kinover Logo" /> Kinover 프론트엔드

**Kinover**는 가족만을 위한 비공개 SNS 서비스입니다.  
이 저장소는 Kinover 앱의 **프론트엔드 코드베이스**이며, **React Native** 기반으로 개발되었습니다.

<br/>

## 주요 기술 스택

- **React Native 0.78.0**
- **React 19**
- **Redux Toolkit + Thunk + Redux Persist** – 전역 상태 및 로컬 복원 관리
- **React Navigation** – 화면 전환, 탭/스택 네비게이션 구성
- **WebSocket (native)** – 실시간 채팅, 접속 상태 동기화
- **Axios** – 백엔드 REST API 통신
- **Kakao Login / Apple Login** – 소셜 로그인 연동
- **AsyncStorage / Keychain** – 앱 상태 및 인증 정보 저장
- **S3 Presigned URL** – 이미지 업로드 처리
- **Reanimated / Bottom Sheet / Lottie** – 인터랙션 및 모션 UI
- **Custom Components** – Modal / Toast / Loader 등 공통 UI 컴포넌트 모듈화

<br/>

## 주요 기능

- 실시간 채팅 기능 구현 (WebSocket 기반)
- 게시글 업로드 및 이미지 첨부 처리
- AI 챗봇 대화 UI 및 흐름 처리
- 가족 일정 공유 화면 및 기능 구현
- 사용자 접속 상태 실시간 표시
- 로그인 상태 유지 및 사용자 인증 연동
- 반응형 UI 및 플랫폼별(iOS/Android) 대응

<br/>

## 실행 환경

- **React Native CLI** 기반 프로젝트
- **Android Studio**, **Xcode** 시뮬레이터 지원
- **iOS / Android 실기기 테스트 진행**
- Node.js `>=18` 권장

<br/>

## 실행 방법

```bash
git clone https://github.com/Kinover/kinover_frontend.git
cd kinover_frontend
npm install

# iOS
npx pod-install
npm run ios

# Android
npm run android
