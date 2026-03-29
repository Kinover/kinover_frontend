# 📱 Project Overview: Kinover (키노버)
Kinover는 가족만을 위한 비공개 SNS입니다. 
오늘 하루 어땠는지 길게 설명하지 않아도 이모지 하나와 사진 한 장으로 마음과 시간을 나눌 수 있는 가족 전용 공간을 목표로 합니다.
- 프로젝트 기간: 2025.03 ~ 진행중

# 🛠️ Tech Stack
- **Frontend:** React Native, Redux Toolkit, Redux Persist, React Navigation
- **Network/Realtime:** Axios, Native WebSocket, Redis Pub/Sub (backend)
- **Backend:** Java 17, Spring Boot 3, Spring Data JPA, MariaDB
- **Security/Auth:** Spring Security, JWT, OAuth2 (Kakao, Apple Login)
- **Infra & CI/CD:** AWS (EC2, RDS, S3), Nginx, GitHub Actions

# ✨ Key Features
1. 실시간 소통: 가족 채팅, 읽음 상태 반영, 접속 상태 확인 (WebSocket + Redis)
2. 감정 공유: 이모지 기반 오늘의 기분 공유
3. 공유 캘린더 & 추억 저장소: 가족 일정 관리 및 사진/영상 아카이빙
4. AI 인터랙션: OpenAI API 기반 대화 및 생각 정리 보조

# ⚠️ Coding Conventions & Rules (Claude 지시사항)
- **로깅 금지:** 프로덕션 코드에 절대 `console.log`를 남기지 마세요.
- **상태 관리:** 상태 관리는 반드시 일관되게 Redux Toolkit + redux-persist 구조를 따르세요.
- **UI/UX 기준:** 모바일 환경을 고려하여 바텀시트 하단 safe-area, Android 실기기 터치/레이아웃 이슈에 항상 대응하여 코드를 작성하세요.

# 🔒 Security Rules (필수)
- **API 키 및 시크릿 키 절대 하드코딩 금지:** 모든 환경 변수는 `.env`를 무조건 사용하세요.
