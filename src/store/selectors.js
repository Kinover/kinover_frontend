/**
 * @fileoverview 전역 스토어 셀렉터
 * 여러 feature에서 공통으로 쓰는 state 선택자
 * createSelector로 메모이제이션하여 불필요한 리렌더링 방지
 */
import {createSelector} from '@reduxjs/toolkit';

/* =========================
 * Family
 * ========================= */
export const selectFamilyId = state => state.family?.familyId ?? null;

export const selectFamilyMembers = createSelector(
  [state => state.family],
  family => family?.members ?? [],
);

/* =========================
 * User
 * ========================= */
export const selectCurrentUserId = state => state.user?.userId ?? null;

/* =========================
 * Chat Room
 * ========================= */
const selectChatRoomState = state => state.chatRoom;

export const selectChatRoomList = createSelector(
  [selectChatRoomState],
  chatRoom => chatRoom?.chatRoomList ?? [],
);

/** 앱 뱃지 합산용: 전체 미읽음 수 */
export const selectChatUnreadTotal = createSelector(
  [selectChatRoomList],
  list =>
    list.reduce((sum, r) => {
      const n = Number(r?.unreadCount);
      return sum + (Number.isFinite(n) ? Math.max(0, n) : 0);
    }, 0),
);

/** chatRoomId로 특정 방 조회 */
export const selectChatRoomById = createSelector(
  [selectChatRoomList, (_, chatRoomId) => chatRoomId],
  (list, chatRoomId) =>
    list.find(r => String(r?.chatRoomId) === String(chatRoomId)) ?? null,
);

/** 특정 방의 읽음 포인터 맵 */
export const selectReadPointersByRoom = createSelector(
  [selectChatRoomState, (_, chatRoomId) => chatRoomId],
  (chatRoom, chatRoomId) =>
    chatRoom?.readPointersByRoom?.[String(chatRoomId)] ?? {},
);
