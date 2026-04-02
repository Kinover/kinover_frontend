# RTK Query 경계 및 마이그레이션 체크리스트

## 목적

- 서버 데이터의 단일 진실 공급원(Source of Truth)을 `RTK Query`로 통일한다.
- `slice`는 UI/로컬 상태만 담당하도록 경계를 명확히 한다.
- 기능 추가 시 `query/slice` 혼재를 방지한다.

## 상태 경계 원칙

### 1) RTK Query로 관리할 상태 (Server State)

- API로 조회/갱신되는 엔티티 데이터
  - 예: 채팅방/메시지/읽음포인터, 가족 정보, 일정 목록, 게시글/댓글, 알림 목록
- 여러 화면에서 공유되는 서버 캐시 데이터
- `invalidatesTags`로 재검증 가능한 데이터

### 2) Slice로 관리할 상태 (Client/UI State)

- 화면 UI 제어 상태
  - 예: 모달 열림 여부, 선택 탭, 로컬 필터 값, 로딩 오버레이 표시 상태
- 일회성 상호작용 상태
  - 예: 토스트 노출, 드래프트 입력값, 리스트 스크롤 보조 상태
- 서버 응답 원본이 아닌 파생 UI 상태

### 3) MMKV로 관리할 상태 (Persistent Local Flags)

- 앱 재실행 후에도 유지할 경량 로컬 플래그
  - 예: `needsSignup`, `isGuestMode`, 가이드/스플래시 노출 플래그

## 금지 규칙

- 동일 서버 엔티티를 `RTK Query 캐시 + slice`에 중복 저장하지 않는다.
- thunk에서 서버 fetch 후 `setXxx(data)`로 원본 데이터를 복사하지 않는다.
- query 결과를 별도 전역 state로 미러링할 때는 예외 사유를 문서화한다.

## 현재 상태 진단 (2026-04 기준)

### 비교적 정리된 영역

- Chat 메시지 조회/페이지네이션
  - `src/features/chat/services/chatApi.js`
  - `src/features/chat/hooks/useChatRoomScreen.js`
- `messageSlice`는 `clearedAt` 등 보조 상태 위주
  - `src/features/chat/store/messageSlice.js`

### 혼재가 남아있는 영역 (우선 정리 대상)

- Home
  - `src/features/home/store/userThunk.js`
  - `src/features/home/store/familyThunk.js`
- Schedule
  - `src/features/schedule/store/scheduleThunk.js`
  - `src/features/schedule/store/scheduleSlice.js`
- Memory
  - `src/features/memory/store/memoryThunk.js`
  - `src/features/memory/store/memorySlice.js`
- Notification
  - `src/features/notification/store/notificationSlice.js`

## 우선순위 마이그레이션 순서

1. Home
2. Notification
3. Schedule
4. Memory

---

## 단계별 실행 체크리스트

## Phase 1: Home (user/family)

- [ ] 화면에서 `user/family` 서버 데이터는 `homeApi` query hook으로 직접 구독
- [ ] `fetchUserThunk`, `fetchFamilyThunk`의 서버 원본 `setUser/setFamily` 동기화 제거
- [ ] `userSlice/familySlice`는 UI 보조 상태만 남기거나 축소
- [ ] 기존 selector 의존 코드가 query 기반으로 동작하는지 점검
- [ ] 태그 무효화 정책 문서화 (`User`, `Family`, `FamilyUser`, `FamilyStatus`)

완료 기준:

- 서버 원본 데이터가 slice에 복사되지 않는다.

## Phase 2: Notification

- [ ] 알림 리스트/카운트/hasUnread를 query 캐시로 일원화
- [ ] `notificationSlice.notifications` 원본 저장 제거
- [ ] 화면에서 `useGetNotificationsQuery`, `useGetUnreadCountQuery` 직접 사용
- [ ] 읽음 처리 후 `invalidatesTags`로 리스트/카운트 자동 동기화

완료 기준:

- 알림 서버 데이터가 query 캐시에만 존재한다.

## Phase 3: Schedule

- [ ] `scheduleList`, `scheduleCountPerDay`의 서버 원본 저장을 query로 이동
- [ ] `scheduleThunk`의 `setScheduleList(data)` 패턴 제거
- [ ] `getSchedules/getScheduleCountPerDay` query를 화면/훅에서 직접 사용
- [ ] 게스트/목업 분기 시에도 서버 원본과 UI 임시 상태를 분리

완료 기준:

- 일정 목록/카운트는 query 데이터만 사용한다.

## Phase 4: Memory

- [ ] 게시글 목록/상세/댓글을 query 기반으로 통합
- [ ] `memorySlice.memoryList/postsById` 서버 원본 복사 제거
- [ ] 상세 캐시는 `getPostById` query로 대체
- [ ] 삭제/수정 후 `invalidatesTags` 및 `updateQueryData`로 일관성 유지

완료 기준:

- 메모리 도메인의 서버 엔티티는 slice 미러링 없이 query에서 직접 소비한다.

---

## PR 체크리스트 (반드시 포함)

- [ ] 이 변경의 Source of Truth는 무엇인가? (`query` / `slice` / `mmkv`)
- [ ] 서버 데이터가 slice에 중복 저장되지 않는가?
- [ ] 태그 무효화/재조회 경로가 명확한가?
- [ ] 기존 화면 selector 의존이 query 구독으로 대체되었는가?

## 운영 규칙

- 신규 서버 데이터는 반드시 RTK Query endpoint부터 만든다.
- `slice` 추가 시 "왜 query가 아닌지"를 PR 본문에 한 줄로 남긴다.
- 예외는 2주 내 정리할 목표와 함께 기술 부채로 기록한다.
