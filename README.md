# <img src="https://avatars.githubusercontent.com/u/206313018?s=200&v=4" width="50"/> Kinover 프론트엔드

**Kinover**는 가족만을 위한 비공개 SNS 서비스입니다.  
이 저장소는 Kinover 앱의 **프론트엔드 코드**이며, **React Native 기반**으로 구축되었습니다.

## 주요 기술 스택

- **React Native 0.78.0**
- **React 19**
- **Redux Toolkit + Thunk** – 전역 상태 관리
- **React Navigation** – 화면 전환 및 네비게이션 스택 구성
- **WebSocket** – 실시간 채팅, 접속 상태 반영
- **Kakao 로그인 API** – 소셜 로그인 연동
- **Axios** – 백엔드 REST API 통신
- **S3 Presigned URL** – 이미지 업로드 처리
- **Figma** – 다양한 해상도 대응을 고려한 pixel-perfect 반응형 UI 구현
- **Custom Components** – Modal / Toast / Loader 등 UI 요소 모듈화

## 주요 기능
- 실시간 채팅 기능 구현 (WebSocket 기반)
- 게시글 업로드 및 이미지 첨부 처리
- AI 챗봇과의 대화 UI 및 흐름 처리
- 가족 일정 공유 화면 및 기능 구현
- 사용자 접속 상태 실시간 표시 (초록 점)
- 로그인 상태 유지 및 사용자 인증 연동
- 반응형 UI 및 플랫폼별(iOS/Android) 대응

## 실행 환경

- **React Native CLI** 기반 프로젝트
- **Android Studio**, **Xcode** 시뮬레이터 지원
- **iOS/Android 디바이스 테스트** 완료
- Node.js `>=18` 권장

## 실행 방법

```bash
git clone https://github.com/your-id/kinover-frontend.git
cd kinover-frontend
npm install

# iOS
npx pod-install
npm run ios

# Android
npm run android
