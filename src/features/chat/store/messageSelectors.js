// redux/selectors/messageSelectors.js
// 메시지 리스트 정렬을 createSelector로 메모이제이션
import {createSelector} from '@reduxjs/toolkit';

const messageState = state => state?.message;

export const selectMessages = createSelector(
  [messageState],
  message => message?.messages ?? [],
);

const getRoomMessageList = (state, chatRoomId) =>
  state?.message?.rooms?.[String(chatRoomId)]?.messageList ?? [];

export const selectRoomMessagesSorted = createSelector(
  [getRoomMessageList],
  list => {
    if (!Array.isArray(list) || list.length <= 1) return list ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(b?.createdAt ?? 0).getTime() -
        new Date(a?.createdAt ?? 0).getTime(),
    );
  },
);