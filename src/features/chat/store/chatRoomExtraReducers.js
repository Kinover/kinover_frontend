// src/features/chat/store/chatRoomExtraReducers.js
// chatRoomSlice의 extraReducers를 분리하여 slice 파일 크기 축소
import {fetchChatRoomMediaThunk} from './chatRoomThunk';
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

  /* ── fetchChatRoomMedia ────────────────────────────────── */
  builder
    .addCase(fetchChatRoomMediaThunk.pending, (state, action) => {
      const rid = toId(action.meta.arg?.chatRoomId);
      const type = String(action.meta.arg?.type || 'ALL').toUpperCase();
      if (!rid) return;

      if (!state.mediaByRoom[rid]) {
        state.mediaByRoom[rid] = {
          items: [],
          nextBefore: null,
          loading: true,
          error: null,
          type,
          hasMore: true,
        };
      } else {
        state.mediaByRoom[rid].loading = true;
        state.mediaByRoom[rid].error = null;
        state.mediaByRoom[rid].type = type;
      }
    })
    .addCase(fetchChatRoomMediaThunk.fulfilled, (state, action) => {
      const {chatRoomId, type, items, nextBefore} = action.payload || {};
      const rid = toId(chatRoomId);
      if (!rid) return;

      const arg = action.meta.arg || {};
      const append = arg.append !== false; // default true

      if (!state.mediaByRoom[rid]) {
        state.mediaByRoom[rid] = {
          items: [],
          nextBefore: null,
          loading: false,
          error: null,
          type: String(type || 'ALL').toUpperCase(),
          hasMore: true,
        };
      }

      const prev = state.mediaByRoom[rid];
      const nextType = String(type || 'ALL').toUpperCase();
      const typeChanged = prev.type && prev.type !== nextType;
      const nextItems = Array.isArray(items) ? items : [];

      // messageId + url + orderInMessage 로 유니크키 만들어 중복 제거
      const keyOf = x =>
        `${x?.messageId || ''}|${x?.url || ''}|${x?.orderInMessage ?? ''}`;
      const dedupMerge = (a, b) => {
        const map = new Map();
        [...a, ...b].forEach(x => {
          const k = keyOf(x);
          if (!k) return;
          if (!map.has(k)) map.set(k, x);
        });
        return Array.from(map.values());
      };

      const merged =
        !append || typeChanged ? nextItems : dedupMerge(prev.items || [], nextItems);

      state.mediaByRoom[rid] = {
        ...prev,
        type: nextType,
        items: merged,
        nextBefore: nextBefore ?? null,
        loading: false,
        error: null,
        hasMore: !!nextBefore && nextItems.length > 0,
      };

      state.listRevision += 1;
    })
    .addCase(fetchChatRoomMediaThunk.rejected, (state, action) => {
      const rid = toId(action.meta.arg?.chatRoomId);
      if (!rid) return;

      if (!state.mediaByRoom[rid]) {
        state.mediaByRoom[rid] = {
          items: [],
          nextBefore: null,
          loading: false,
          error: action.payload || action.error?.message || '미디어 조회 실패',
          type: String(action.meta.arg?.type || 'ALL').toUpperCase(),
          hasMore: true,
        };
      } else {
        state.mediaByRoom[rid].loading = false;
        state.mediaByRoom[rid].error =
          action.payload || action.error?.message || '미디어 조회 실패';
      }

      state.listRevision += 1;
    });
};
