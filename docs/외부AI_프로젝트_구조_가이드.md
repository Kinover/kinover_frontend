# Kinover Frontend 구조 가이드 (외부 AI 전달용)

이 문서는 `kinover_frontend` 프로젝트를 처음 접하는 AI/개발자가 **코드를 몰라도 구조를 이해**할 수 있도록 정리한 설명서입니다.

---

## 1) 프로젝트 전체 폴더/파일 구조 (트리)

아래 트리는 실제 코드 분석 기준으로, 운영에 중요한 파일 위주로 요약한 구조입니다.

```text
kinover_frontend/
├── index.js                         # 앱 엔트리 (AppRegistry, 폴리필, FCM BG 핸들러)
├── package.json                     # 의존성/스크립트/런타임 버전
├── README.md                        # 프로젝트 소개/실행 방법
├── app.json                         # RN 앱 메타 정보
├── babel.config.js                  # 경로 alias 설정
├── metro.config.js                  # 번들러 설정 (svg transformer 등)
├── jest.config.js                   # 테스트 설정
├── android/                         # Android 네이티브 프로젝트
├── ios/                             # iOS 네이티브 프로젝트
├── docs/                            # 프로젝트 문서
├── scripts/                         # 로컬/마이그레이션 보조 스크립트
├── ci_scripts/                      # CI 보조 스크립트
├── __tests__/                       # 테스트
└── src/
    ├── app/
    │   ├── App.jsx                  # 앱 루트 셸 (Provider, PersistGate, NavigationContainer)
    │   ├── AppStateResourceBridge.jsx
    │   ├── disableFontScaling.jsx
    │   └── navigation/
    │       ├── rootScreen.jsx       # 인증/앱 플로우 분기
    │       ├── rootNavigator.jsx    # Tabs + 전역 화면(설정/알림)
    │       ├── authNavigator.jsx    # 로그인/온보딩/가입 흐름
    │       ├── tabNavigator.jsx     # 하단 탭(홈/소통/일정/추억)
    │       ├── animatedTabBar.jsx
    │       ├── navigationRef.js
    │       ├── navigationService.jsx
    │       ├── helpers/tabHeaderHelpers.jsx
    │       └── stacks/
    │           ├── homeStack.jsx
    │           ├── communicationStack.jsx
    │           ├── scheduleStack.jsx
    │           └── memoryStack.jsx
    │
    ├── store/
    │   ├── index.js                 # configureStore + redux-persist
    │   ├── rootReducer.js           # feature slice 결합
    │   ├── uiSlice.js               # UI 전역 상태
    │   └── selectors.js
    │
    ├── features/
    │   ├── auth/
    │   │   ├── hooks/               # 자동로그인/카카오/애플/로그아웃 등
    │   │   ├── screens/             # 약관/가족설정/유저설정/완료
    │   │   └── store/               # loginSlice/loginThunk
    │   ├── home/
    │   │   ├── components/
    │   │   ├── screens/
    │   │   ├── store/
    │   │   └── utils/
    │   ├── chat/
    │   │   ├── components/          # 채팅방/메시지/입력/모달/가이드
    │   │   ├── hooks/               # ChatSocket, screen 훅
    │   │   ├── screens/
    │   │   ├── store/               # chatRoom/message/readPointer 상태 + thunk
    │   │   └── utils/
    │   ├── memory/
    │   │   ├── components/          # 피드/상세/필터/바텀시트/모달
    │   │   ├── hooks/
    │   │   ├── screens/
    │   │   ├── store/               # 게시글/카테고리/댓글
    │   │   └── utils/
    │   ├── schedule/
    │   │   ├── components/          # 캘린더/일정 리스트/편집 UI
    │   │   ├── hooks/
    │   │   ├── screens/
    │   │   ├── store/               # scheduleSlice/scheduleThunk
    │   │   ├── constants/
    │   │   └── utils/
    │   ├── notification/
    │   │   ├── hooks/
    │   │   ├── screens/
    │   │   ├── store/
    │   │   └── utils/               # 푸시 권한/리스너/열기 라우팅
    │   ├── setting/
    │   │   ├── components/
    │   │   └── screens/
    │   └── onboarding/
    │       ├── components/
    │       ├── hooks/
    │       └── screens/
    │
    ├── components/                  # 공통 컴포넌트 (modal, bottomSheet, AppText 등)
    ├── hooks/                       # 전역 훅 (네트워크/소켓상태/테마/가이드 등)
    ├── utils/                       # 공통 유틸 (apiClient, storage, biometrics 등)
    ├── config/                      # 상수/엔드포인트/앱 이벤트
    ├── api/                         # 일부 도메인 REST 래퍼
    ├── contexts/                    # GuideOverlayContext
    ├── assets/                      # 이미지/아이콘/애니메이션
    ├── styles/
    └── data/
```

---

## 2) 각 폴더/파일의 역할 설명

### 루트 레벨
- `index.js`: 앱 시작점. RN 핵심 모듈 로딩, 폴리필 적용, 푸시 백그라운드 핸들러 등록, `App` 컴포넌트 등록.
- `package.json`: 언어/프레임워크/라이브러리와 스크립트(`android`, `ios`, `start`, `lint`, `test`) 정의.
- `android/`, `ios/`: 플랫폼 빌드, 권한, 네이티브 라이프사이클 설정.
- `docs/`: 배포/예외 처리/운영 관련 내부 문서.

### `src/app`
- 앱 전체를 감싸는 셸 계층.
- `App.jsx`에서 Redux/Navigation/BottomSheet/SafeArea/GuideOverlay/앱 잠금 등을 묶어 실행.
- `navigation/`은 인증 플로우와 메인 탭 플로우를 정의하며, 전역 이동(`navigationRef`)도 관리.

### `src/store`
- 전역 상태 저장소.
- `rootReducer.js`에서 기능별 상태(slice)를 하나로 결합.
- `index.js`에서 persist 전략(어떤 상태를 유지할지)을 정의.

### `src/features/*`
- 기능 단위 모듈.
- 공통 패턴:
  - `screens/`: 화면 단위 컴포넌트
  - `components/`: 해당 기능에 특화된 UI 조각
  - `hooks/`: 화면/기능 로직 분리
  - `store/`: slice, thunk(API 호출/비동기 로직)
  - `utils/`: 기능 전용 유틸

### `src/components`, `src/hooks`, `src/utils`
- 앱 전체에서 재사용하는 공통 계층.
- 화면 직접 구현보다 “기능 연결용 기본 부품”에 가깝다.

### `src/config`, `src/api`, `src/contexts`
- `config`: API/WS 주소, 경로 상수, 전역 이벤트 키.
- `api`: 일부 REST 호출을 분리한 API 모듈.
- `contexts`: React Context 기반 전역 기능(현재 Guide Overlay).

---

## 3) 핵심 기술 스택

### 언어/플랫폼
- JavaScript (React Native 앱 코드)
- Kotlin/Gradle (Android), Swift/Xcode 설정(iOS)

### 프레임워크/런타임
- React `19`
- React Native `0.78`

### 상태/데이터
- Redux Toolkit (`@reduxjs/toolkit`)
- React Redux (`react-redux`)
- Redux Persist (`redux-persist`)
- Redux Thunk (`redux-thunk`)
- Axios (`axios`)

### 네비게이션
- `@react-navigation/native`
- `@react-navigation/stack`
- `@react-navigation/bottom-tabs`

### 실시간/알림
- WebSocket (native)
- Firebase Messaging (`@react-native-firebase/messaging`)
- Notifee (`@notifee/react-native`)

### 인증/스토리지
- Kakao Login (`@react-native-seoul/kakao-login`)
- Apple Login (`@invertase/react-native-apple-authentication`)
- AsyncStorage (`@react-native-async-storage/async-storage`)
- Keychain (`react-native-keychain`)
- Biometrics (`react-native-biometrics`)

### UI/인터랙션
- Reanimated (`react-native-reanimated`)
- Bottom Sheet (`@gorhom/bottom-sheet`)
- Lottie (`lottie-react-native`)
- Gesture Handler / Safe Area / SVG / 각종 미디어 라이브러리

---

## 4) 데이터 흐름 (어디서 시작해서 어디로 가는가)

아래는 가장 중요한 실행 흐름이다.

1. **앱 시작**
   - `index.js` -> `AppRegistry.registerComponent(..., App)`
   - 폴리필 로드 + FCM 백그라운드 핸들러 등록

2. **앱 셸 초기화**
   - `src/app/App.jsx`에서 Provider 체인 구성:
     - `Provider(store)` + `PersistGate`
     - `NavigationContainer`
     - `BottomSheetModalProvider`, `SafeAreaProvider`, `MenuProvider`

3. **로그인/메인 플로우 분기**
   - `src/app/navigation/rootScreen.jsx`
   - rehydrate 완료 여부, 자동로그인 상태, 가족 소속 여부를 보고
     - `AuthNavigator` 또는 `RootNavigator(Tabs)`로 분기

4. **자동 로그인 + 초기 데이터**
   - `features/auth/hooks/useAutoLogin.js`
   - 토큰 확인 -> 유저 조회 -> 가족/가족멤버/채팅방 목록 로드
   - 성공 시 `startChatSocket(dispatch, getState)`로 실시간 채팅 소켓 시작

5. **REST 데이터 흐름**
   - 화면 이벤트 -> thunk 호출 (`dispatch(...)`)
   - thunk 내부 `apiClient`로 서버 호출
   - 성공/실패를 slice reducer에 반영 -> `useSelector`로 화면 재렌더

6. **WebSocket 데이터 흐름 (채팅)**
   - `features/chat/hooks/ChatSocket.js`에서 메시지 수신/재연결/큐 처리
   - 수신 이벤트 -> `receiveMessageThunk`/`applyReadPointer` 디스패치
   - 채팅 목록/방 미리보기/읽음 상태 동기화

7. **알림 데이터 흐름 (푸시)**
   - `features/notification/utils/requestNotificationPermission.js`
   - 포그라운드/백그라운드/앱 종료 상태 각각에서 푸시 수신 처리
   - 필요 시 로컬 노티(Notifee) 표시 + 앱 배지 반영 + 화면 라우팅

요약하면, **입력(사용자/푸시/소켓) -> thunk/hook -> API/WS -> Redux slice -> UI 반영** 구조이다.

---

## 5) 주요 기능별 관여 파일

아래는 기능별로 실제로 많이 열어보게 되는 핵심 파일 목록이다.

### A. 인증(Auth)
- `src/features/auth/store/loginSlice.js`
- `src/features/auth/store/loginThunk.js`
- `src/features/auth/hooks/useAutoLogin.js`
- `src/features/auth/hooks/useKakaoLogin.js`
- `src/features/auth/hooks/useAppleLogin.js`
- `src/features/auth/hooks/useLogout.js`
- `src/features/auth/screens/TermsAgreementScreen.jsx`
- `src/features/auth/screens/UserSetupScreen.jsx`
- `src/features/auth/screens/FamilySetupScreen.jsx`
- `src/app/navigation/authNavigator.jsx`

### B. 홈(Home/가족 상태)
- `src/features/home/screens/index.jsx`
- `src/features/home/screens/stateScreen.jsx`
- `src/features/home/store/userThunk.js`
- `src/features/home/store/familyThunk.js`
- `src/features/home/store/familyUserThunk.js`
- `src/features/home/store/userSlice.js`
- `src/features/home/store/familySlice.js`
- `src/features/home/store/statusSlice.js`
- `src/features/home/components/UserBottomSheet.jsx`

### C. 채팅(Chat)
- `src/features/chat/screens/index.jsx`
- `src/features/chat/screens/chatRoomScreen.jsx`
- `src/features/chat/screens/createChatRoomScreen.jsx`
- `src/features/chat/hooks/ChatSocket.js`
- `src/features/chat/store/chatRoomSlice.js`
- `src/features/chat/store/chatRoomThunk.js`
- `src/features/chat/store/messageSlice.js`
- `src/features/chat/store/messageThunk.js`
- `src/features/chat/components/messages/ChatRoomMessageList.jsx`
- `src/features/chat/components/input/chatInput.jsx`
- `src/features/chat/components/modals/CreateChatRoomBottomSheet.jsx`

### D. 추억(Memory/게시글)
- `src/features/memory/screens/index.jsx`
- `src/features/memory/screens/MemoryFeedScreen.jsx`
- `src/features/memory/screens/PostScreen.jsx`
- `src/features/memory/screens/CreatePostScreen.jsx`
- `src/features/memory/store/memorySlice.js`
- `src/features/memory/store/memoryThunk.js`
- `src/features/memory/store/categorySlice.js`
- `src/features/memory/store/categoryThunk.js`
- `src/features/memory/store/commentSlice.js`
- `src/features/memory/store/commentThunk.js`
- `src/features/memory/hooks/useMemoryScreen.js`
- `src/features/memory/components/bottomSheets/MemoryDetailBottomSheet.jsx`

### E. 일정(Schedule)
- `src/features/schedule/screens/index.jsx`
- `src/features/schedule/components/Calendar.jsx`
- `src/features/schedule/components/Schedule.jsx`
- `src/features/schedule/components/ScheduleEditorBottomSheet.jsx`
- `src/features/schedule/store/scheduleSlice.js`
- `src/features/schedule/store/scheduleThunk.js`
- `src/features/schedule/hooks/useScheduleCRUD.js`
- `src/features/schedule/hooks/useScheduleDate.js`
- `src/features/schedule/hooks/useScheduleCountsFilteredByUsers.js`
- `src/features/schedule/utils/scheduleFilterHelpers.js`

### F. 알림(Notification)
- `src/features/notification/screens/NotificationScreen.jsx`
- `src/features/notification/store/notificationSlice.js`
- `src/features/notification/store/notificationThunk.js`
- `src/features/notification/utils/requestNotificationPermission.js`
- `src/features/notification/utils/openNotification.js`
- `src/features/notification/hooks/useNotificationPress.js`
- `src/features/notification/hooks/useNotificationRows.js`

### G. 설정/온보딩
- `src/features/setting/screens/SettingScreen.jsx`
- `src/features/setting/screens/NotificationSettingScreen.jsx`
- `src/features/setting/components/FontModeSlider.jsx`
- `src/features/onboarding/screens/OnboardingScreen.jsx`
- `src/features/onboarding/hooks/useOnboardingPager.js`

---

## 6) 중요한 함수/클래스 목록과 역할

이 프로젝트는 대부분 함수형 컴포넌트/함수 기반 구조이며, 전통적인 클래스는 거의 사용하지 않는다.

### 앱 부팅/라우팅
- `App` (`src/app/App.jsx`)
  - 앱 전체 Provider를 구성하고 실제 앱 실행 루트를 만든다.
- `RootScreen` (`src/app/navigation/rootScreen.jsx`)
  - 인증 여부/가족 여부/자동로그인 결과로 AuthFlow vs AppFlow를 결정한다.
- `RootNavigator`, `TabNavigator` (`src/app/navigation/*.jsx`)
  - 메인 라우트/탭 라우트 구조를 선언한다.
- `safeReset`, `navigationRef` (`src/app/navigation/navigationService.jsx`, `navigationRef.js`)
  - 인증 만료 등 전역 라우팅 제어에 사용된다.

### 인증/세션
- `useAutoLogin` (`src/features/auth/hooks/useAutoLogin.js`)
  - 앱 시작 시 토큰으로 자동 로그인, 초기 데이터 로딩, 채팅 소켓 시작까지 담당.
- `setLoginSuccess`, `setLogout`, `setAuthChecked` (`loginSlice.js`)
  - 로그인 상태 머신의 핵심 액션.
- `loginThunk`, `appleLoginThunk` (`loginThunk.js`)
  - 소셜 로그인 서버 연동.

### 전역 상태 관리
- `store`, `persistor` (`src/store/index.js`)
  - Redux store와 persist 저장소 생성.
- `rootReducer` (`src/store/rootReducer.js`)
  - 도메인 slice 결합.
- `setFontMode`, `setBioLockEnabled` (`src/store/uiSlice.js`)
  - UI/접근성/잠금 관련 전역 설정.

### API/네트워크
- `apiClient` (`src/utils/apiClient.js`)
  - 모든 REST 요청의 공통 진입점.
  - 요청 인터셉터: 토큰 자동 주입(일부 엔드포인트 제외)
  - 응답 인터셉터: 401 처리(로그아웃/화면 리셋) + 공통 에러 처리
- `API_BASE_URL`, `WS_CHAT_BASE_URL` (`src/config/constants.js`)
  - 환경 변수 기반 서버 주소 관리.

### 채팅(WebSocket + REST)
- `startChatSocket`, `stopChatSocket`, `reconnectIfNeeded` (`ChatSocket.js`)
  - 글로벌 채팅 소켓 연결/해제/재연결.
- `sendChat`, `sendRead` (`ChatSocket.js`)
  - 메시지/읽음 이벤트를 소켓으로 전송.
- `fetchChatRoomListThunk`, `createChatRoomThunk`, `leaveChatRoomThunk` (`chatRoomThunk.js`)
  - 채팅방 조회/생성/나가기 등 방 단위 API.
- `fetchMessageThunk`, `sendMessageWsThunk`, `receiveMessageThunk` (`messageThunk.js`)
  - 메시지 조회/전송/수신 반영의 핵심 로직.
- `markReadWsThunk`, `fetchReadPointersThunk` (`messageThunk.js`)
  - 읽음 상태 동기화.

### 메모리(게시글)
- `fetchMemoryThunk`, `fetchPostByIdThunk` (`memoryThunk.js`)
  - 게시글 목록/상세 조회.
- `deletePostThunk`, `deletePostImageThunk` (`memoryThunk.js`)
  - 삭제 계열 작업 후 목록 재동기화.
- `togglePostNotificationThunk` (`memoryThunk.js`)
  - 게시글 알림 설정 변경.
- `fetchCategoryThunk`, `createCategoryThunk` (`categoryThunk.js`)
  - 카테고리 조회/생성.
- `fetchCommentsThunk`, `createCommentThunk`, `deleteCommentThunk` (`commentThunk.js`)
  - 댓글 도메인 작업.

### 일정
- `fetchSchedulesForFamilyAndDateThunk` (`scheduleThunk.js`)
  - 특정 날짜의 일정 목록 조회.
- `addScheduleThunk`, `updateScheduleThunk`, `deleteScheduleThunk` (`scheduleThunk.js`)
  - 일정 CRUD.
- `getScheduleCountPerDayThunk` (`scheduleThunk.js`)
  - 달력 일자별 일정 개수 조회.
- `fetchSchedulesForFamilyAndDateApi` (`scheduleThunk.js`)
  - Redux 없이 일정 배열만 직접 받아오는 API 함수.

### 알림/푸시
- `requestNotificationPermission` (`requestNotificationPermission.js`)
  - 플랫폼별 알림 권한 요청.
- `handleNotificationListeners` (`requestNotificationPermission.js`)
  - FCM/Notifee 리스너 등록 및 클릭 라우팅 처리.
- `registerBackgroundMessageHandler` (`requestNotificationPermission.js`)
  - 앱 백그라운드 푸시 처리 시작점.
- `fetchUnreadCountThunk`, `markNotificationsReadThunk`, `syncAppBadgeThunk` (`notificationThunk.js`)
  - 읽지 않은 알림 수/뱃지 동기화.

---

## 빠른 이해용 한 줄 요약

- 이 프로젝트는 **React Native + Redux Toolkit** 기반의 모바일 앱.
- 구조는 **기능별 모듈(features)** 중심이고, 공통 계층(app/store/utils/components)이 이를 뒷받침한다.
- 데이터는 주로 **화면 이벤트 -> thunk -> API/WS -> slice -> 화면**으로 흐른다.
- 실시간성은 채팅 소켓(`ChatSocket.js`)과 푸시 처리(`requestNotificationPermission.js`)가 책임진다.
