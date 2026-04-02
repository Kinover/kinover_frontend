// store/messageSlice.js
// RTK Query 마이그레이션 후:
//   - messageList, isLoading, error, isFetched, hasMore, cursor → chatApi.getMessages 캐시로 이전
//   - 남은 역할: 방별 clearedAt 관리 (방 나가기 시 메시지 리셋 기준)
//
// 메시지 조회:   useGetMessagesQuery({chatRoomId}) in chatApi
// WS 수신:       receiveMessageThunk → chatApi.util.updateQueryData
// 방 나가기:     dispatch(resetRoomMessageList(chatRoomId)) + chatApi tag invalidation

import {createSlice} from '@reduxjs/toolkit';
import {toId} from './chatStoreUtils';

const ensureRoom = (state, chatRoomId) => {
  const rid = toId(chatRoomId);
  if (!rid) return null;
  if (!state?.rooms) state.rooms = {};
  if (!state.rooms[rid]) {
    state.rooms[rid] = {
      clearedAt: null, // 이 시각 이전 메시지는 RTK Query 캐시에서도 필터링
    };
  }
  return state.rooms[rid];
};

const messageSlice = createSlice({
  name: 'message',
  initialState: {rooms: {}},
  reducers: {
    initRoom(state, action) {
      ensureRoom(state, action.payload);
    },

    clearRoomMessages(state, action) {
      const rid = toId(action.payload);
      if (!rid) return;
      if (!state?.rooms) state.rooms = {};
      if (state.rooms[rid]) delete state.rooms[rid];
    },

    /**
     * 방 나가기·리셋 시 clearedAt 기록
     * → chatApi.util.invalidateTags([{type:'Messages', id}]) 와 함께 호출해야 캐시도 리셋
     */
    resetRoomMessageList(state, action) {
      const rid = toId(action.payload);
      if (!rid) return;
      const room = ensureRoom(state, rid);
      if (!room) return;
      room.clearedAt = new Date().toISOString();
    },
  },
});

export const {initRoom, clearRoomMessages, resetRoomMessageList} = messageSlice.actions;

export default messageSlice.reducer;

/** clearedAt 조회 (chatApi transformResponse·updateQueryData에서 필터용) */
export const selectRoomClearedAt = (state, chatRoomId) =>
  state?.message?.rooms?.[String(chatRoomId)]?.clearedAt ?? null;

/** 하위 호환: 일부 컴포넌트가 아직 selectRoomMeta를 import할 수 있으므로 최소 형태 유지 */
export const selectRoomMeta = (state, chatRoomId) =>
  state?.message?.rooms?.[String(chatRoomId)] ?? {clearedAt: null};
