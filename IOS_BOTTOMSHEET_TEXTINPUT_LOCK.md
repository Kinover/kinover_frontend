# iOS BottomSheet TextInput 설정 고정

이 문서는 **iOS 바텀시트 내 텍스트 인풋 동작을 현재 정책으로 고정**하기 위한 기준입니다.

## 고정 정책

- 바텀시트 내부 입력은 `CustomInput`에서 `bottomSheet` prop 사용 시 `BottomSheetTextInput`을 사용한다.
- iOS 바텀시트는 처음부터 과도하게 높이지 않는다(기본 스냅 유지).
- iOS에서 입력 포커스 시에는 바텀시트 전체가 키보드에 맞춰 올라가야 한다.
- 이를 위해 iOS 바텀시트는 `keyboardBehavior: 'interactive'`, `keyboardBlurBehavior: 'restore'`를 사용한다.
- iOS에서는 중복 이동 방지를 위해 `enableKeyboardPolicy: false`를 유지한다.
- Android는 기존 정책(`keyboardBehavior: 'none'`, `enableKeyboardPolicy: true`)을 유지한다.

## 현재 적용 대상

- `src/components/CustomInput.jsx`
- `src/features/home/components/UserBottomSheet.jsx`
- `src/features/chat/components/modals/CreateChatRoomBottomSheet.jsx`
- `src/features/schedule/components/ScheduleEditorBottomSheet.jsx`

## 변경 금지 범위

- 아래 동작은 별도 합의 없이는 변경하지 않는다.
  - iOS 바텀시트 입력 포커스 시 시트 전체 상승 방식
  - iOS `interactive + restore` 조합
  - iOS에서 `enableKeyboardPolicy` 비활성화
  - Android 기존 키보드 정책

## 변경 필요 시 절차

1. 영향 화면(유저/채팅방 생성/일정 추가) 모두에서 iOS 실기기 테스트를 먼저 수행한다.
2. 키보드 가림, 포커스 이동, blur 복귀 동작을 확인한다.
3. 변경 이유와 테스트 결과를 문서(`ANDROID_FIXES.md` 또는 별도 md)에 함께 기록한다.
