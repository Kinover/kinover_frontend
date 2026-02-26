# 안드로이드 뒤로가기 종료 실수 방지하기

홈 화면에서 한 번 누르면 토스트만 띄우고, 두 번 눌렀을 때만 종료되게 만들었다.

## 구현 로직

- **훅**: `src/hooks/useDoubleBackToExit.js`
- **사용 위치**: 메인 홈 화면(`features/home/screens/index.jsx`의 `HomeScreen`)

1. **첫 번째 뒤로가기**: 토스트 "한 번 더 누르면 종료됩니다." 표시
2. **2초 이내 두 번째 뒤로가기**: `BackHandler.exitApp()` 호출로 앱 종료
3. **2초 경과 후 뒤로가기**: 다시 1번부터

2초라는 시간은 사용자가 인지하기 가장 적당한 시간이라 판단해서 넣었다. 너무 짧으면 의도치 않게 두 번 눌리기 쉽고, 너무 길면 기다리기 답답하다.

훅은 **Android에서만** 동작하고, iOS에서는 아무 처리도 하지 않는다.

## 모달·바텀시트 열림 시 뒤로가기

- **CustomModal** (`components/modal/CustomModal.jsx`): `Modal`의 `onRequestClose`에 `requestClose`를 넘겨 두어서, Android 뒤로가기를 누르면 모달만 닫히고 `onClose`/`onRequestClose`가 호출된다.
- **@gorhom/bottom-sheet** (`BottomSheetModal`): 라이브러리가 열린 상태에서 Android BackHandler를 자동 등록해서, 뒤로가기를 누르면 시트만 닫힌다.

그래서 모달/바텀시트가 열려 있을 때는 뒤로가기가 해당 레이어만 닫고, **메인 홈에서 시트/모달이 모두 닫힌 상태일 때만** "한 번 더 누르면 종료" 동작이 적용된다.

## 다른 화면에서 쓸 때

`useDoubleBackToExit(enabled)`는 **루트에 가까운 한 곳**(예: 홈 탭의 첫 화면)에서만 `enabled: true`로 쓰는 걸 권장한다. 그 외 스택 화면에서는 React Navigation 기본 뒤로가기 동작을 쓰는 게 좋다.
