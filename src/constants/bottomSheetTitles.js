const BOTTOM_SHEET_TITLES = Object.freeze({
  USER_PROFILE_EDIT: '프로필 편집',
  CHAT_ROOM_CREATE: '채팅방 만들기',
  CATEGORY_SELECT: '카테고리를 선택해요',
  SCHEDULE_PEOPLE_FILTER: '누구의 일정을 볼까요?',
  MEMORY_COMMENT: '댓글',
  SCHEDULE_EDITOR_ADD: '일정 추가',
  SCHEDULE_EDITOR_EDIT: '일정 수정',
});

export const BOTTOM_SHEET_BUTTON_LABELS = Object.freeze({
  CANCEL: '취소',
  CANCEL_CHANGES: '변경 취소',
  APPLY: '적용',
  APPLY_ACTION: '적용하기',
  SAVE: '저장',
  SAVE_ACTION: '저장하기',
  SAVE_LOADING: '저장 중...',
  DELETE: '삭제하기',
});

export const getScheduleEditorTitle = isEditing =>
  isEditing
    ? BOTTOM_SHEET_TITLES.SCHEDULE_EDITOR_EDIT
    : BOTTOM_SHEET_TITLES.SCHEDULE_EDITOR_ADD;

export default BOTTOM_SHEET_TITLES;
