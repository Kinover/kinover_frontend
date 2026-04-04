# 📱 Project Overview: Kinover (키노버)
Kinover는 가족만을 위한 비공개 SNS입니다. 
오늘 하루 어땠는지 길게 설명하지 않아도 이모지 하나와 사진 한 장으로 마음과 시간을 나눌 수 있는 가족 전용 공간을 목표로 합니다.
- 프로젝트 기간: 2025.03 ~ 진행중

# 🛠️ Tech Stack
- **Frontend Core:** React Native 0.78.0, React 19
- **State Management:** Redux Toolkit, RTK Query, Redux Persist (전역 상태, 서버 상태 캐싱/무효화, 로컬 복원 관리)
- **Navigation:** React Navigation (화면 전환, 탭/스택 네비게이션 구성)
- **Network & Realtime:** Axios (백엔드 REST API 통신), WebSocket (native, 실시간 채팅 및 접속 상태 동기화)
- **Auth & Security:** Kakao Login / Apple Login (소셜 로그인 연동)
- **Storage & Performance:** MMKV, Keychain (persist 성능 최적화, 앱 설정/인증 정보 저장)
- **UI/UX & Media:** Reanimated, Bottom Sheet, Lottie, Custom Components (Modal, Toast, Loader 등 공통 UI 모듈화), S3 Presigned URL (이미지 업로드 처리)

# ✨ Key Features
1. **실시간 소통 & 상태 동기화:** 실시간 채팅 기능 구현 (WebSocket 기반), 사용자 접속 상태 실시간 표시
2. **서버 상태 관리:** RTK Query 기반 서버 상태 관리 및 캐시 동기화
3. **콘텐츠 & 일정 공유:** 게시글 업로드 및 이미지 첨부 처리, 가족 일정 공유 화면 및 기능 구현
4. **AI 인터랙션:** AI 챗봇 대화 UI 및 흐름 처리
5. **사용자 경험 & 인증:** 로그인 상태 유지 및 사용자 인증 연동, 반응형 UI 및 플랫폼별(iOS/Android) 대응

# ⚠️ Coding Conventions & Rules (Claude 지시사항)
- **로깅 금지:** 프로덕션 코드에 절대 `console.log`를 남기지 마세요.
- **상태 관리:** 상태 관리는 반드시 일관되게 Redux Toolkit + RTK Query + redux-persist 구조를 따르세요.
- **UI/UX 기준:** 모바일 환경을 고려하여 바텀시트 하단 safe-area, Android 실기기 터치/레이아웃 이슈에 항상 대응하여 코드를 작성하세요.
- **브랜치 이름 설정:** Git 브랜치를 생성할 때는 항상 변경 사항의 목적을 명확히 나타내는 설명적인 브랜치 이름(descriptive branch names)을 사용하세요. 브랜치 이름은 반드시 feat/, fix/, refactor/, chore/ 중 하나의 접두사로 시작해야 하며, 영문 소문자와 하이픈(-)만 사용하세요.
- **방어적 프로그래밍 및 예외 처리 강제:** 정상 작동 시나리오만 고려하지 말고, 반드시 null 체크, 네트워크 단절 예외 처리, 가드(guard) 조건 명시 등 방어적 프로그래밍 기법을 꼼꼼하게 적용하세요.
- **Git 자동화 차단:** 내 명시적인 지시나 검토 없이 임의로 브랜치를 변경하거나 commit, push 작업을 알아서 실행하지 마세요.

# 🔒 Security Rules (필수)
- **API 키 및 시크릿 키 절대 하드코딩 금지:** 모든 환경 변수는 `.env`를 무조건 사용하세요.