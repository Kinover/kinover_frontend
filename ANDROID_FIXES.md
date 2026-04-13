# Android Platform Fix Log
---

## 핵심 원인 배경

Android edge-to-edge 모드에서는 `useSafeAreaInsets().bottom`이 0을 반환한다.
대신 `getAndroidNavBottomInsetEstimate()` (`src/utils/layoutMetrics.js`)를 사용해 네비게이션 바 높이를 추정한다.

```
실제 inset 계산 = Math.max(insets.bottom, getAndroidNavBottomInsetEstimate(), fallback)
```

gorhom BottomSheet의 `BottomSheetFooterButtons`에서 버튼 하단 여백은
`includeBottomSafePadding={true}` + `getAndroidBottomSheetFooterInsetPx()` 조합으로 처리한다.

---

## 수정 완료 목록

### 1. 탭 바 (animatedTabBar.jsx)
**파일:** `src/app/navigation/animatedTabBar.jsx`

- iOS는 이전 상태(navInset=0, H=90, paddingBottom=15) 유지
- Android만 `getAndroidNavBottomInsetEstimate()` 적용

```jsx
const navInset = Platform.OS === 'android'
  ? Math.max(rawInsetBottom, getAndroidNavBottomInsetEstimate())
  : 0;
```

---

### 2. 바텀시트 스냅 포인트 (layoutMetrics.js)
**파일:** `src/utils/layoutMetrics.js`

Android에서 바텀시트 버튼이 콘텐츠를 가리는 문제 → 스냅포인트 자체를 올림.

```js
export const getUserBottomSheetSnapPoints = (fontMode) => {
  const isAndroid = Platform.OS === 'android';
  const [first] = getSheetSnapPointsByTier({
    fontMode,
    normal: isAndroid ? ['75%', '88%'] : ['62%', '88%'],
    large:  isAndroid ? ['78%', '89%'] : ['66%', '89%'],
    xl:     isAndroid ? ['80%', '90%'] : ['70%', '90%'],
  });
  return [first];
};

export const getCreateRoomBottomSheetSnapPoints = (fontMode, externalSnapPoints) => {
  if (externalSnapPoints) return externalSnapPoints;
  const isAndroid = Platform.OS === 'android';
  const [first] = getSheetSnapPointsByTier({
    fontMode,
    normal: isAndroid ? ['70%', '92%'] : ['56.5%', '92%'],
    large:  isAndroid ? ['76%', '93%'] : ['68%', '93%'],
    xl:     isAndroid ? ['80%', '94%'] : ['72%', '94%'],
  });
  return [first];
};
```

---

### 3. 유저 바텀시트 버튼 (UserBottomSheet.jsx)
**파일:** `src/features/home/components/UserBottomSheet.jsx`

- `includeBottomSafePadding={true}` (Android도 포함)
- `keyboardBehavior`: Android → `'extend'`, iOS → `'interactive'`
- Android별 별도 `androidFooterBottomPad` 제거

```jsx
keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'extend'}

<BottomSheetFooterButtons
  bottomSafe={bottomSafe}
  includeBottomSafePadding={true}
  ...
/>
```

---

### 4. 채팅방 생성 바텀시트 버튼 (CreateChatRoomBottomSheet.jsx)
**파일:** `src/features/chat/components/modals/CreateChatRoomBottomSheet.jsx`

- 동일하게 `includeBottomSafePadding={true}`, `keyboardBehavior='extend'` 적용

```jsx
keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'extend'}

<BottomSheetFooterButtons
  includeBottomSafePadding={true}
  ...
/>
```

---

### 5. FAB 플로팅 버튼 위치 (3개 화면)
**파일:**
- `src/features/chat/screens/index.jsx`
- `src/features/schedule/screens/index.jsx`
- `src/features/memory/screens/index.jsx`

Android 3-button nav에서 FAB가 네비바에 가려지는 문제 → 동적 bottom 계산.

```jsx
const insets = useSafeAreaInsets();
const fabNavInset = Platform.OS === 'android'
  ? Math.max(Number(insets?.bottom ?? 0), getAndroidNavBottomInsetEstimate(), getResponsiveHeight(48))
  : 0;
const fabBottom = getResponsiveHeight(110) + fabNavInset;

// JSX
<View style={[styles.fabContainer, {bottom: fabBottom}]} pointerEvents="box-none">
```

---

### 6. 채팅 입력창 키보드 (chatInput.jsx + chatRoomScreenTemplate.jsx)
**파일:**
- `src/features/chat/components/input/chatInput.jsx`
- `src/features/chat/screens/chatRoomScreenTemplate.jsx`

**문제:** Android에서 KAV(`behavior="height"`) + `adjustResize` 동시 적용 시 자동완성 바가 입력창을 가림.

**해결:**
- `chatRoomScreenTemplate.jsx`: iOS만 `KeyboardAvoidingView` 적용. Android는 `adjustResize` 단독 의존.
- `chatInput.jsx`: 키보드 열려있을 때 `rootPaddingBottom=0` (adjustResize가 처리), 닫혀있을 때만 inset 적용.

```jsx
// chatRoomScreenTemplate.jsx
if (Platform.OS === 'ios') {
  return (
    <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={headerHeight}>
      {content}
    </KeyboardAvoidingView>
  );
}
return <View style={styles.container}>{content}</View>;

// chatInput.jsx - rootPaddingBottom
const rootPaddingBottom = useMemo(() => {
  if (Platform.OS === 'ios') {
    return isKeyboardVisible ? 0 : Math.max(insets.bottom, getResponsiveHeight(2));
  }
  if (isKeyboardVisible) return 0; // adjustResize가 처리
  return Math.max(
    Number(insets.bottom ?? 0),
    getAndroidNavBottomInsetEstimate(),
    getResponsiveHeight(2),
  );
}, [insets.bottom, isKeyboardVisible]);
```

---

### 7. PostScreen 바텀시트 위치 (PostScreen.jsx)
**파일:** `src/features/memory/screens/PostScreen.jsx`

gorhom `BottomSheet`의 `bottomInset` prop으로 네비바 위로 시트 띄움.

```jsx
const insets = useSafeAreaInsets();
const descSheetBottomInset = Platform.OS === 'android'
  ? Math.max(Number(insets?.bottom ?? 0), getAndroidNavBottomInsetEstimate(), getResponsiveHeight(48))
  : 0;

<BottomSheet ... bottomInset={descSheetBottomInset}>
```

---

## 미확인 항목 (테스트 필요)

| 항목 | 파일 | 상태 |
|------|------|------|
| 채팅 입력창 자동완성 바 가림 | chatInput.jsx | ⚠️ 기기 테스트 미확인 |
| 바텀시트 키보드 올라오기 전체 | 아래 8번 항목 참조 | ✅ 코드 수정 완료, 기기 테스트 필요 |

---

## 아직 안 고친 것 (잠재적 이슈)

- **renameChatRoomModal.jsx**: CustomModal 기반이라 BottomSheet 아님, 별도 이슈 없음
- **기타 바텀시트**: `includeBottomSafePadding` 값 일괄 감사 필요

---

## 유틸리티 함수 위치

| 함수 | 파일 | 용도 |
|------|------|------|
| `getAndroidNavBottomInsetEstimate()` | `src/utils/layoutMetrics.js` | 네비바 높이 추정 |
| `getAndroidBottomSheetFooterInsetPx()` | `src/utils/layoutMetrics.js` | 바텀시트 푸터 하단 여백 |
| `getUserBottomSheetSnapPoints()` | `src/utils/layoutMetrics.js` | 유저 시트 스냅포인트 |
| `getCreateRoomBottomSheetSnapPoints()` | `src/utils/layoutMetrics.js` | 채팅방 생성 시트 스냅포인트 |

---

## 8. 바텀시트 키보드 전체 올라오기 (2026-04-11)
**문제:** 입력창 포커스 시 시트가 가만히 있고 내부 콘텐츠만 translateY로 위로 이동 (shiftAnim 패턴)
**해결:** shiftAnim/ensureVisible 제거 + `adjustNothing` + gorhom 네이티브 keyboard behavior 사용

| 파일 | 변경 내용 |
|------|-----------|
| `BottomSheetLayout.jsx` | Android 기본값: `keyboardBehavior='none'→'extend'`, `adjustResize→adjustNothing`; keyboard policy를 `keyboardBehavior==='none'`일 때만 수동 snap |
| `UserBottomSheet.jsx` | `shiftAnim`, `ensureVisible`, keyboard 리스너 제거; `adjustResize→adjustNothing` |
| `ScheduleEditorBottomSheet.jsx` | 동일. `keyboardBehavior` Android `'none'→'extend'` |
| `CreateChatRoomBottomSheet.jsx` | `adjustResize→adjustNothing` |
