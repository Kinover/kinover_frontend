// src/features/chat/store/chatRoomExtraReducers.js
// chatRoomSlice의 extraReducers를 분리하여 slice 파일 크기 축소
// fetchChatRoomMediaThunk → RTK Query getChatRoomMedia로 이전 (제거)
import {markReadThunk, fetchReadPointersThunk} from './chatReadThunk';
import {toId, toIso, findRoomIndex} from './chatStoreUtils';

/**
 * chatRoomSlice.extraReducers에 주입할 빌더 함수
 * @param {import('@reduxjs/toolkit').ActionReducerMapBuilder} builder
 */
export const addChatRoomExtraReducers = builder => {
  /* ── markRead ──────────────────────────────────────────── */
  builder
    .addCase(markReadThunk.pending, (state, action) => {
      const rid = toId(action.meta.arg?.chatRoomId);
      if (!rid) return;
      state.markReadStatusByRoom[rid] = 'pending';
    })
    .addCase(markReadThunk.fulfilled, (state, action) => {
      const {chatRoomId, userId, lastReadAt} = action.payload || {};
      const rid = toId(chatRoomId);
      if (!rid) return;

      state.markReadStatusByRoom[rid] = 'fulfilled';

      // 내 포인터 즉시 반영 (userId 없으면 스킵)
      if (userId != null && lastReadAt) {
        if (!state.readPointersByRoom[rid]) state.readPointersByRoom[rid] = {};
        state.readPointersByRoom[rid][String(userId)] = toIso(lastReadAt);
      }

      // 목록 unreadCount 0
      const idx = findRoomIndex(state, rid);
      if (idx !== -1) {
        state.chatRoomList[idx] = {
          ...state.chatRoomList[idx],
          unreadCount: 0,
        };
      }

      state.listRevision += 1;
    })
    .addCase(markReadThunk.rejected, (state, action) => {
      const rid = toId(action.meta.arg?.chatRoomId);
      if (!rid) return;
      state.markReadStatusByRoom[rid] = 'rejected';
    });

  /* ── fetchReadPointers ─────────────────────────────────── */
  builder.addCase(fetchReadPointersThunk.fulfilled, (state, action) => {
    const {chatRoomId, pointers} = action.payload || {};
    const rid = toId(chatRoomId);
    if (!rid) return;

    const next = {...(state.readPointersByRoom[rid] || {})};
    (pointers || []).forEach(p => {
      const uid = p?.userId;
      const at = p?.lastReadAt;
      if (uid == null || !at) return;
      next[String(uid)] = toIso(at);
    });

    state.readPointersByRoom[rid] = next;
    state.listRevision += 1;
  });

  // fetchChatRoomMediaThunk extraReducers 제거됨
  // → RTK Query useGetChatRoomMediaQuery 사용 (chatApi.js)
};
