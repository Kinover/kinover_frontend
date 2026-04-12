# Kinover Frontend — Project Hierarchy

> 이 파일은 Claude가 프로젝트 지도로 사용하기 위한 구조 요약본입니다.
> 마지막 업데이트: 2026-04-11

---

## 아키텍처 요약

| 항목 | 내용 |
|------|------|
| 프레임워크 | React Native 0.78, React 19 |
| 상태관리 | Redux Toolkit + RTK Query + redux-persist |
| 실시간 | WebSocket (채팅, 가족 상태) |
| 네비게이션 | React Navigation (탭 + 스택) |
| 저장소 | MMKV (앱 설정/캐시), Keychain (토큰) |
| 이미지 업로드 | Presigned URL → S3 직접 PUT |
| 반응형 | Figma 기준 스케일링 (utils/responsive.js) |
| 인증 | Kakao OAuth, Apple Login, 생체인증 |

---

## 디렉토리 트리

```
src/
├── app/
│   ├── App.jsx                          # 앱 진입점 — Redux/Nav 초기화, 푸시/생체인증 설정
│   ├── AppStateResourceBridge.jsx       # 포그라운드 복귀 시 사용자/가족/채팅 데이터 재동기화
│   ├── disableFontScaling.jsx           # 시스템 폰트 스케일 무시
│   └── navigation/
│       ├── rootScreen.jsx               # 인증 여부 → Auth/Main 네비게이터 분기
│       ├── rootNavigator.jsx            # 탭 + 전역화면(설정·알림) 스택
│       ├── tabNavigator.jsx             # 홈/소통/일정/추억 하단 탭
│       ├── authNavigator.jsx            # 온보딩→약관→정보입력→가족설정 인증 플로우
│       ├── animatedTabBar.jsx           # 커스텀 애니메이션 탭바 (safe area 대응)
│       ├── navigationRef.js             # 전역 네비게이션 ref
│       ├── navigationService.jsx        # 네비게이션 액션 큐/리셋 상태 관리
│       ├── stacks/
│       │   ├── homeStack.jsx
│       │   ├── communicationStack.jsx
│       │   ├── scheduleStack.jsx
│       │   └── memoryStack.jsx
│       └── helpers/
│           └── tabHeaderHelpers.jsx     # 헤더 스타일 / 백버튼 렌더
│
├── features/
│   │
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── OnboardingScreen.jsx     # 슬라이드 온보딩 + 로그인 진입
│   │   │   ├── TermsAgreementScreen.jsx # 약관 동의
│   │   │   ├── UserSetupScreen.jsx      # 이름/생일 입력
│   │   │   ├── FamilySetupScreen.jsx    # 가족 생성 or 참여
│   │   │   └── SetupFinishScreen.jsx    # 설정 완료
│   │   ├── hooks/
│   │   │   ├── useKakaoLogin.js         # 카카오 OAuth 로그인
│   │   │   ├── useAppleLogin.js         # Apple 로그인
│   │   │   ├── useAutoLogin.js          # 저장 토큰으로 자동 로그인
│   │   │   ├── useLogout.js             # 로그아웃 처리
│   │   │   ├── useCreateFamily.js       # 가족 생성
│   │   │   └── useDeleteUser.js         # 회원 탈퇴
│   │   ├── services/
│   │   │   └── authApi.js               # RTK Query 인증 엔드포인트
│   │   └── store/
│   │       ├── loginSlice.js            # 로그인 상태/토큰/에러
│   │       └── loginThunk.js            # 비동기 로그인 thunk
│   │
│   ├── home/
│   │   ├── screens/
│   │   │   ├── index.jsx                # 가족 멤버 그리드/상태 홈 화면
│   │   │   └── stateScreen.jsx          # 감정 상태 변경 화면
│   │   ├── components/
│   │   │   ├── HeaderSection.jsx        # 가족명 + 전체 온라인 상태 아이콘
│   │   │   ├── MemberGridSection.jsx    # 멤버 카드 + 감정 애니메이션
│   │   │   ├── UserBottomSheet.jsx      # 프로필 편집 바텀시트
│   │   │   ├── FamilyCodeModal.jsx      # 가족 코드 공유
│   │   │   ├── LogoutModal.jsx          # 로그아웃 확인
│   │   │   ├── HomeGuideModal.jsx       # 튜토리얼 모달
│   │   │   └── HomeGuideVisual.jsx      # 튜토리얼 시각 요소
│   │   ├── services/
│   │   │   └── homeApi.js               # RTK Query 사용자/가족 API
│   │   ├── store/
│   │   │   ├── userSlice.js             # 로그인 사용자 정보
│   │   │   ├── userThunk.js
│   │   │   ├── familySlice.js           # 가족 정보
│   │   │   ├── familyThunk.js
│   │   │   ├── familyUserThunk.js       # 가족 멤버 목록
│   │   │   ├── userFamilySlice.js
│   │   │   └── statusSlice.js           # 가족 온라인 상태
│   │   └── utils/
│   │       ├── emotionUtils.js          # 감정 아이콘/색상 매핑
│   │       ├── dateUtils.js             # 상대 시간 포맷 (N시간 전)
│   │       └── storeMockData.js         # 개발용 목업 데이터
│   │
│   ├── chat/
│   │   ├── screens/
│   │   │   ├── index.jsx                # 채팅방 목록 화면 (FAB: 채팅방 생성)
│   │   │   ├── chatRoomScreen.jsx       # 일반 채팅방
│   │   │   ├── kinoChatRoomScreen.jsx   # AI 키노 채팅방
│   │   │   ├── chatRoomScreenTemplate.jsx # 채팅방 공통 템플릿 (KAV iOS only)
│   │   │   ├── createChatRoomScreen.jsx # 채팅방 생성 화면
│   │   │   ├── addChatMemberScreen.jsx  # 멤버 추가
│   │   │   ├── chatRoomMediaScreen.jsx  # 미디어 갤러리
│   │   │   ├── chatSetting.jsx          # 채팅 설정 (이름변경, 나가기)
│   │   │   └── kinoSelectScreen.jsx     # 키노 캐릭터 선택
│   │   ├── components/
│   │   │   ├── messages/
│   │   │   │   ├── ChatRoomMessageList.jsx  # 메시지 FlatList
│   │   │   │   ├── chatMessageItem.jsx      # 메시지 아이템 (memo 최적화)
│   │   │   │   ├── messageFlatList.jsx      # FlatList 래퍼
│   │   │   │   ├── sendChat.jsx             # 발신 말풍선
│   │   │   │   ├── receiveChat.jsx          # 수신 말풍선
│   │   │   │   ├── sendKinoChat.jsx         # 키노 발신
│   │   │   │   └── receiveKinoChat.jsx      # 키노 수신
│   │   │   ├── bubbles/
│   │   │   │   ├── ChatBubble.jsx           # 일반 말풍선 컨테이너
│   │   │   │   └── KinoBubble.jsx           # 키노 말풍선
│   │   │   ├── input/
│   │   │   │   ├── chatInput.jsx            # 메시지 입력창 (갤러리/멘션/전송)
│   │   │   │   ├── ChatMediaGallery.jsx     # 인라인 미디어 선택
│   │   │   │   └── ChatMentionDropdown.jsx  # @ 멘션 드롭다운
│   │   │   ├── rooms/
│   │   │   │   ├── chatRoomItem.jsx         # 채팅방 목록 아이템
│   │   │   │   ├── SkeletonChatRoomItem.jsx # 스켈레톤 로딩
│   │   │   │   ├── groupAvatar.jsx          # 그룹 아바타 (멤버 이미지 겹치기)
│   │   │   │   └── ChatRoomInputArea.jsx    # chatInput 래퍼
│   │   │   ├── modals/
│   │   │   │   ├── CreateChatRoomBottomSheet.jsx # 채팅방 생성 바텀시트
│   │   │   │   ├── renameChatRoomModal.jsx       # 이름 변경
│   │   │   │   ├── leaveChatRoomModal.jsx         # 나가기 확인
│   │   │   │   ├── changeKinoModal.jsx            # 키노 변경
│   │   │   │   └── kinoConfirmModal.jsx           # 키노 확인
│   │   │   └── guides/
│   │   │       ├── ChatGuideModal.jsx
│   │   │       ├── ChatListGuideModal.jsx
│   │   │       ├── ChatRoomGuideModal.jsx
│   │   │       └── KinoChatRoomGuideModal.jsx
│   │   ├── hooks/
│   │   │   ├── ChatSocket.js            # WebSocket 싱글톤 (연결/메시지/재연결)
│   │   │   ├── useChatWebSocket.js      # WebSocket 생명주기 훅
│   │   │   ├── useChatRoomScreen.js     # 채팅방 화면 상태 로직
│   │   │   ├── useChatRoomTemplate.js   # 채팅방 공통 로직
│   │   │   └── onLeaveChat.js           # 채팅방 나가기 처리
│   │   ├── services/
│   │   │   ├── chatApi.js               # RTK Query 채팅방 API
│   │   │   └── chatReadApi.js           # 읽음 상태 API
│   │   ├── store/
│   │   │   ├── chatRoomSlice.js         # 채팅방 목록/정보 상태
│   │   │   ├── messageSlice.js          # 메시지 상태
│   │   │   ├── messageThunk.js
│   │   │   ├── chatRoomThunk.js
│   │   │   ├── readPointersSlice.js     # 메시지 읽음 포인터
│   │   │   ├── chatRoomSelector.js
│   │   │   ├── messageSelectors.js
│   │   │   ├── userChatRoomSlice.js
│   │   │   ├── chatReadThunk.js
│   │   │   ├── chatStoreUtils.js
│   │   │   └── chatRoomExtraReducers.js
│   │   └── utils/
│   │       ├── messageUtils.js          # 메시지 포맷/처리
│   │       ├── chatMediaUploadUtils.js  # 채팅 미디어 업로드
│   │       ├── chatRoomTitleHelper.js   # 채팅방 제목 결정 로직
│   │       ├── mentionUtils.js          # @ 멘션 감지/처리
│   │       ├── messageActions.js        # 메시지 복사/삭제 액션
│   │       ├── formatTime.js            # 시간 포맷
│   │       ├── gallery.js               # 갤러리 유틸
│   │       └── selection.js             # 텍스트 선택 유틸
│   │
│   ├── schedule/
│   │   ├── screens/
│   │   │   └── index.jsx                # 달력 + 스케줄 리스트 메인 화면
│   │   ├── components/
│   │   │   ├── Calendar.jsx             # 월간/주간 달력 뷰
│   │   │   ├── Schedule.jsx             # 스케줄 리스트 렌더
│   │   │   ├── ScheduleEditorBottomSheet.jsx # 스케줄 생성/수정 바텀시트
│   │   │   ├── SchedulePeopleFilterModal.jsx # 멤버 필터 모달
│   │   │   ├── BirthdayConfettiModal.jsx     # 생일 축하 화면
│   │   │   └── ScreenConfetti.jsx            # 종이 날림 애니메이션
│   │   ├── hooks/
│   │   │   ├── useScheduleCRUD.js       # 생성/수정/삭제 로직
│   │   │   ├── useScheduleDate.js       # 선택 날짜 상태
│   │   │   ├── useScheduleEditor.js     # 편집 모드 관리
│   │   │   ├── useScheduleCounts.js     # 날짜별 스케줄 개수
│   │   │   ├── useScheduleListByDate.js # 날짜별 리스트
│   │   │   ├── useMonthDates.js         # 월간 날짜 배열 계산
│   │   │   ├── useWeekDates.js          # 주간 날짜 계산
│   │   │   ├── useCalendarLayout.js     # 달력 레이아웃
│   │   │   ├── useCalendarMode.js       # 월간/주간 전환
│   │   │   ├── useHolidayMap.js         # 공휴일 정보
│   │   │   └── useScheduleBottomSheetModal.js # 바텀시트 열기/닫기
│   │   ├── services/
│   │   │   └── scheduleApi.js           # RTK Query 스케줄 API
│   │   └── store/
│   │       ├── scheduleSlice.js         # 스케줄 상태
│   │       └── scheduleSelectors.js
│   │
│   ├── memory/
│   │   ├── screens/
│   │   │   ├── index.jsx                # 추억 진입 (피드/앨범 탭 전환, FAB)
│   │   │   ├── MemoryFeedScreen.jsx     # 피드 목록/타일 뷰
│   │   │   ├── PostScreen.jsx           # 게시글 상세 (이미지·댓글·설명)
│   │   │   ├── CreatePostScreen.jsx     # 게시글 작성
│   │   │   ├── ImageSelectScreen.jsx    # 이미지 선택
│   │   │   └── CategorySelectScreen.jsx # 카테고리 선택
│   │   ├── components/
│   │   │   ├── items/
│   │   │   │   ├── MemoryFeedListItem.jsx # 피드 카드 아이템
│   │   │   │   └── AlbumMediaTile.jsx     # 앨범 타일
│   │   │   ├── media/
│   │   │   │   └── ImageCarousel.jsx      # 이미지 캐러셀
│   │   │   ├── filters/
│   │   │   │   ├── PostFilterBar.jsx      # 정렬/카테고리 필터 바
│   │   │   │   └── AlbumTabSelector.jsx   # 앨범/피드 탭
│   │   │   ├── sections/
│   │   │   │   ├── CommentSection.jsx     # 댓글 섹션
│   │   │   │   └── MagazineBanner.jsx     # 매거진 배너
│   │   │   ├── bottomSheets/
│   │   │   │   ├── CategoryBottomSheet.jsx     # 카테고리 선택 바텀시트
│   │   │   │   └── MemoryDetailBottomSheet.jsx # 게시글 상세/댓글 바텀시트
│   │   │   ├── modals/
│   │   │   │   ├── PeriodFilterModal.jsx  # 기간 필터 모달
│   │   │   │   └── DeleteOptionModal.jsx  # 삭제 확인
│   │   │   └── skeletons/
│   │   │       ├── SkeletonMemoryItem.jsx
│   │   │       └── SkeletonPhotoGridItem.jsx
│   │   ├── hooks/
│   │   │   ├── useMemoryScreen.js       # 피드 화면 UI 로직
│   │   │   ├── usePostPageViewModel.js  # 게시글 상세 뷰모델
│   │   │   ├── usePostDescSheet.js      # 설명 바텀시트 (snapPoints ['20%','30%'])
│   │   │   └── usePostCommentSheet.js   # 댓글 바텀시트
│   │   ├── services/
│   │   │   └── memoryApi.js             # RTK Query 게시글/댓글 API
│   │   └── store/
│   │       ├── memorySlice.js           # 게시글 상태
│   │       ├── categorySlice.js         # 카테고리 상태
│   │       └── commentSlice.js          # 댓글 상태
│   │
│   ├── notification/
│   │   ├── screens/
│   │   │   └── NotificationScreen.jsx   # 알림 목록 화면
│   │   ├── hooks/
│   │   │   ├── useNotification.js       # 푸시 알림 수신/처리
│   │   │   ├── useNotificationList.js   # 알림 목록 조회
│   │   │   └── useNotificationPress.js  # 알림 클릭 → 화면 이동
│   │   ├── services/
│   │   │   └── notificationApi.js       # RTK Query 알림 API
│   │   └── utils/
│   │       ├── requestNotificationPermission.js
│   │       └── syncAppBadge.js          # 앱 아이콘 배지 동기화
│   │
│   └── setting/
│       ├── screens/
│       │   ├── SettingScreen.jsx        # 설정 메인 화면
│       │   └── NotificationSettingScreen.jsx
│       └── components/
│           ├── FontModeSlider.jsx       # 글씨 크기 슬라이더
│           └── DeleteAccountModal.jsx   # 회원 탈퇴 확인
│
├── components/                          # 전역 공통 컴포넌트
│   ├── AppText.jsx                      # 반응형 폰트 텍스트 (fontMode 구독)
│   ├── CustomInput.jsx                  # 공통 입력창 (포커스 스타일 포함)
│   ├── BottomActionButton.jsx           # 하단 고정 액션 버튼
│   ├── yellowSpinner.jsx                # 로딩 스피너
│   ├── customSwitch.jsx                 # 커스텀 토글 스위치
│   ├── bottomSheet/
│   │   ├── BottomSheetLayout.jsx        # 바텀시트 공통 레이아웃 래퍼
│   │   │                                # (키보드 정책, snap, safe area 통합)
│   │   ├── BottomSheetFooterButtons.jsx # 바텀시트 하단 버튼 (safe area 대응)
│   │   ├── BottomSheetButtons.jsx       # 취소/저장 버튼 쌍
│   │   └── bottomSheetEditorSharedStyles.js # 에디터 바텀시트 공유 스타일
│   └── modal/
│       ├── AppAlertModal.jsx            # 전역 알림 모달 (커스텀 confirm)
│       ├── AppAlertHost.jsx             # 알림 모달 호스트 (루트에 마운트)
│       ├── ToastModal.jsx               # 토스트 메시지
│       ├── CustomModal.jsx              # 범용 확인/취소 모달
│       ├── GuideModal.jsx               # 기능 가이드 모달
│       └── GuideOverlay.jsx             # 화면 위 가이드 오버레이
│
├── services/
│   └── baseApi.js                       # RTK Query createApi 기본 설정 (태그, baseUrl)
│
├── api/                                 # RTK Query 외 레거시 API (axios 직접 호출)
│   ├── imageUrlApi.js                   # Presigned URL 획득 + S3 직접 PUT
│   ├── uploadPostApi.js                 # 게시글 업로드
│   ├── updatePostApi.js                 # 게시글 수정
│   ├── categoryCreateApi.js             # 카테고리 생성
│   ├── getCategoryApi.js                # 카테고리 조회
│   ├── userProfileApi.js                # 유저 프로필 API
│   └── getUserIdFromToken.js            # JWT 토큰 파싱 → userId 추출
│
├── store/
│   ├── index.js                         # Redux 스토어 생성 (redux-persist, MMKV)
│   ├── rootReducer.js                   # 모든 슬라이스 + RTK Query API 결합
│   ├── uiSlice.js                       # 폰트 크기 모드, 생체인증 설정 상태
│   └── selectors.js                     # 전역 선택자
│
├── hooks/
│   ├── useScaledStyleSheet.js           # fontMode 기반 반응형 StyleSheet
│   ├── useReduxFontMode.js              # Redux 폰트 크기 모드 구독
│   ├── useAppStateBackground.js         # 포그라운드/백그라운드 이벤트
│   ├── useDoubleBackToExit.js           # Android 뒤로가기 두 번 → 앱 종료
│   ├── useHideTabBar.js                 # 탭바 숨기기 (게시글·채팅방 진입 시)
│   ├── useNavigateToWhere.js            # 로그인/온보딩 여부에 따른 자동 이동
│   ├── useFamilyStatusSocket.js         # 가족 온라인 상태 WebSocket 구독
│   ├── useAppAlert.js                   # 전역 알림 팝업 트리거
│   ├── useNetworkStatus.js              # 네트워크 연결 상태 감지
│   ├── useWebSocketStatus.js            # WebSocket 연결 상태
│   └── useBottomSheetKeyboardShift.js   # 바텀시트 내 키보드 shift 보정
│
├── utils/
│   ├── apiClient.js                     # Axios 인스턴스 (Authorization 주입, 401 처리)
│   ├── responsive.js                    # Figma 기준 getResponsiveWidth/Height/FontSize/IconSize
│   ├── layoutMetrics.js                 # 바텀시트 snap 계산, Android 내비바 inset 추정
│   ├── storage.js                       # MMKV 래퍼 (토큰, 설정, 플래그)
│   ├── mmkvStorage.js                   # MMKV 인스턴스 (redux-persist storage)
│   ├── biometrics.js                    # Touch/Face ID 인증
│   ├── haptic.js                        # 햅틱 피드백 (light/selection/error)
│   ├── validation.js                    # 입력 검증 (필수, 길이, 포맷)
│   ├── uploadImageWithPresignedUrl.js   # Presigned URL 이미지 업로드 플로우
│   ├── photoUriConverter.js             # iOS ph:// / Android content:// → file:// 변환
│   ├── normalizeImageForSave.js         # 이미지 경로 정규화 (저장 전)
│   ├── videoThumbnail.js                # 비디오 썸네일 생성
│   ├── mediaUrl.js                      # CloudFront URL 조합
│   ├── mentions.js                      # 멘션 텍스트 파싱
│   ├── appBadge.js                      # 앱 아이콘 배지 관리
│   ├── requestMediaPermission.js        # 미디어 접근 권한 요청
│   ├── formatDuration.js                # 영상 길이 포맷 (00:00)
│   ├── authFlagsEvent.js                # 인증 상태 이벤트 버스
│   └── polyfills.js                     # Polyfill 설정
│
├── config/
│   ├── constants.js                     # API URL, WebSocket URL, 타이밍 상수
│   ├── apiEndpoints.js                  # API 경로 상수
│   └── appEvents.js                     # 앱 내부 이벤트 이름 정의
│
├── styles/
│   ├── style.js                         # 전역 색상/버튼/텍스트 스타일 상수
│   └── kinoTheme.js                     # Kino 캐릭터별 색상 테마
│
├── contexts/
│   └── GuideOverlayContext.jsx          # 가이드 오버레이 표시/숨기기 컨텍스트
│
├── constants/
│   ├── index.js
│   ├── modal.js                         # 모달 관련 상수
│   └── toast.js                         # 토스트 관련 상수
│
└── assets/
    ├── icons/tabs/, header/, state*/    # 탭/헤더/감정 아이콘 PNG
    ├── images/                          # 일반 이미지 자산
    ├── kinos/                           # Kino 캐릭터 이미지
    ├── animations/                      # Lottie JSON 파일
    └── fonts/                           # Pretendard, SpaceMono 폰트
```

---

## 핵심 파일 역할 요약

### 상태관리 흐름
| 파일 | 역할 |
|------|------|
| `store/index.js` | Redux 스토어 생성 (MMKV persist, 미들웨어 설정) |
| `store/rootReducer.js` | 모든 슬라이스 + RTK Query API combineReducers |
| `store/uiSlice.js` | 폰트 크기 모드 (`normal/large/extraLarge`), 생체인증 |
| `services/baseApi.js` | RTK Query `createApi` 기반 설정, 공통 태그 정의 |
| `utils/apiClient.js` | Axios 인스턴스 — Bearer 토큰 주입, 401 자동 갱신 |

### 레이아웃 & 반응형
| 파일 | 역할 |
|------|------|
| `utils/responsive.js` | Figma 375px 기준 스케일링 함수 4종 |
| `utils/layoutMetrics.js` | Android 내비바 높이 추정, 바텀시트 snap/footer inset 계산 |
| `hooks/useScaledStyleSheet.js` | fontMode 구독 → 반응형 StyleSheet 생성 |
| `components/bottomSheet/BottomSheetLayout.jsx` | 모든 바텀시트의 공통 래퍼 (키보드/safe area/snap 통합) |
| `components/bottomSheet/BottomSheetFooterButtons.jsx` | Android inset 대응 푸터 버튼 (`getAndroidBottomSheetFooterInsetPx`) |

### 실시간 통신
| 파일 | 역할 |
|------|------|
| `features/chat/hooks/ChatSocket.js` | WebSocket 싱글톤 (연결/메시지 수신/재연결) |
| `features/chat/hooks/useChatWebSocket.js` | 컴포넌트 생명주기에 WebSocket 바인딩 |
| `hooks/useFamilyStatusSocket.js` | 가족 온라인 상태 WebSocket 구독 |

### Android 플랫폼 대응 (주요 이슈 해결 이력)
| 파일 | 내용 |
|------|------|
| `android/app/src/main/res/xml/network_security_config.xml` | localhost/127.0.0.1 cleartext 허용 (Metro 개발용) |
| `app/navigation/animatedTabBar.jsx` | `Math.max(insets.bottom, getAndroidNavBottomInsetEstimate())` 로 탭바 높이 동적 계산 |
| `utils/layoutMetrics.js` | `getAndroidBottomSheetFooterInsetPx` — NAV_BAR_MIN(48dp) + buffer(24dp) 보장 |
| `features/chat/screens/chatRoomScreenTemplate.jsx` | iOS만 KAV 적용, Android는 AndroidManifest adjustResize 의존 |
| `features/chat/components/input/chatInput.jsx` | 키보드 열릴 때 `rootPaddingBottom=0`, 닫힐 때 내비바 inset 적용 |

---

## RTK Query API 목록

| API 파일 | 주요 엔드포인트 |
|----------|----------------|
| `auth/services/authApi.js` | 로그인, 토큰 갱신, 회원가입 |
| `home/services/homeApi.js` | 사용자 정보, 가족 정보, 가족 멤버 목록 |
| `chat/services/chatApi.js` | 채팅방 CRUD, 메시지 목록 |
| `chat/services/chatReadApi.js` | 메시지 읽음 처리 |
| `schedule/services/scheduleApi.js` | 스케줄 CRUD |
| `memory/services/memoryApi.js` | 게시글/댓글 CRUD, 카테고리 |
| `notification/services/notificationApi.js` | 알림 목록, 읽음 처리 |

---

## 네비게이션 구조

```
RootNavigator (Stack)
├── MainTabs (Tab)
│   ├── 홈Stack → HomeScreen, StateScreen
│   ├── 소통Stack → CommunicationScreen(채팅방 목록)
│   │              → ChatRoomScreen, KinoChatRoomScreen
│   │              → CreateChatRoomScreen, AddChatMemberScreen
│   ├── 일정Stack → ScheduleScreen
│   └── 추억Stack → MemoryScreen(피드/앨범)
│                  → PostScreen, CreatePostScreen
│                  → ImageSelectScreen, CategorySelectScreen
├── SettingScreen (전역 화면)
└── NotificationScreen (전역 화면)

AuthNavigator (Stack)
└── OnboardingScreen → TermsAgreementScreen → UserSetupScreen
    → FamilySetupScreen → SetupFinishScreen
```
