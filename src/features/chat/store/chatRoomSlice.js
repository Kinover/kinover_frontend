// src/features/chat/store/chatRoomSlice.js
import {createSlice, createSelector} from '@reduxjs/toolkit';
import {toId, toIso, sortByLatest, previewText, findRoomIndex, finalizeList} from './chatStoreUtils';
import {addChatRoomExtraReducers} from './chatRoomExtraReducers';

// markReadThunk / fetchReadPointersThunk는 chatReadThunk.js에서 정의
// (chatRoomThunk.js가 이 slice의 action creator를 import하여 순환 의존 방지)
export {markReadThunk, fetchReadPointersThunk} from './chatReadThunk';

/* =========================
 * Initial State
 * ========================= */
const initialChatRoomState = {
  chatRoomList: [],
  chatRoomUsers: [],
  loading: false,
  error: null,

  activeChatRoomId: null,
  listRevision: 0,
  pendingTopRoomId: null,

  mediaByRoom: {},

  /**
   * 읽음 포인터 저장
   * readPointersByRoom[rid][userId] = lastReadAt (ISO string)
   */
  readPointersByRoom: {},

  /**
   * 내 read 요청 상태(선택)
   * markReadStatusByRoom[rid] = 'idle'|'pending'|'fulfilled'|'rejected'
   */
  markReadStatusByRoom: {},
};

/* =========================
 * Slice
 * ========================= */
const chatRoomSlice = createSlice({
  name: 'chatRoom',
  initialState: initialChatRoomState,
  reducers: {
    bumpListRevision(state) {
      state.listRevision += 1;
    },

    bumpChatRoomToTop(state, action) {
      const rid = toId(action.payload);
      if (!rid) return;

      state.pendingTopRoomId = rid;
      if (!Array.isArray(state.chatRoomList)) state.chatRoomList = [];

      const idx = findRoomIndex(state, rid);
      if (idx === -1) {
        state.listRevision += 1;
        return;
      }

      const nowIso = new Date().toISOString();
      const target = state.chatRoomList[idx];

      const bumped = {
        ...target,
        latestMessageTime: nowIso,
      };

      state.chatRoomList.splice(idx, 1);
      state.chatRoomList.unshift(bumped);

      finalizeList(state);
    },

    clearPendingTopRoom(state) {
      state.pendingTopRoomId = null;
      state.listRevision += 1;
    },

    setChatRoomList(state, action) {
      const src = Array.isArray(action?.payload) ? action.payload : [];

      const mapped = src.map(r => {
        const raw = r ?? {};
        const rid = toId(raw.chatRoomId);

        const latestRaw =
          raw.latestMessageTime ??
          raw.updatedAt ??
          raw.createdAt ??
          new Date().toISOString();

        return {
          ...raw,
          chatRoomId: rid,
          roomName: raw.roomName ?? `채팅방 ${rid ?? ''}`,
          latestMessageContent: raw.latestMessageContent ?? '',
          latestMessageTime: toIso(latestRaw),
          unreadCount: Number.isFinite(raw.unreadCount) ? raw.unreadCount : 0,
          notificationOn:
            typeof raw.notificationOn === 'boolean' ? raw.notificationOn : true,
          userChatRooms: Array.isArray(raw.userChatRooms) ? raw.userChatRooms : [],
        };
      });

      if (state.pendingTopRoomId) {
        const rid = state.pendingTopRoomId;
        const idx = mapped.findIndex(x => toId(x.chatRoomId) === rid);
        if (idx !== -1) {
          mapped[idx] = {
            ...mapped[idx],
            latestMessageTime: new Date().toISOString(),
          };
        }
      }

      state.chatRoomList = sortByLatest(mapped);
      state.listRevision += 1;
    },

    setChatRoomUsers(state, action) {
      state.chatRoomUsers = Array.isArray(action.payload)
        ? [...action.payload]
        : [];
    },

    setChatRoomLoading(state, action) {
      state.loading = !!action.payload;
    },

    setChatRoomError(state, action) {
      state.error = action.payload || null;
    },

    setActiveChatRoom(state, action) {
      state.activeChatRoomId = action.payload ? toId(action.payload) : null;
    },

    setChatRoomNotificationState(state, action) {
      const {chatRoomId, isOn} = action.payload || {};
      const rid = toId(chatRoomId);
      const idx = findRoomIndex(state, rid);

      if (idx !== -1) {
        state.chatRoomList[idx] = {
          ...state.chatRoomList[idx],
          notificationOn: isOn,
        };
        state.listRevision += 1;
      }
    },

    resetChatRoomMedia(state, action) {
      const {chatRoomId, type} = action.payload || {};
      const rid = toId(chatRoomId);
      if (!rid) return;

      state.mediaByRoom[rid] = {
        items: [],
        nextBefore: null,
        loading: false,
        error: null,
        type: String(type || 'ALL').toUpperCase(),
        hasMore: true,
      };

      state.listRevision += 1;
    },

    clearChatRoomMedia(state, action) {
      const rid = toId(action.payload);
      if (!rid) return;

      if (state.mediaByRoom?.[rid]) delete state.mediaByRoom[rid];
      state.listRevision += 1;
    },

    applyMessagePreview(state, action) {
      const {chatRoomId, message, isSelf} = action.payload || {};
      const rid = toId(chatRoomId);
      if (!rid) return;

      const lastText = previewText(message);
      const lastTime = toIso(message?.createdAt);

      const idx = findRoomIndex(state, rid);

      if (idx === -1) {
        state.chatRoomList.unshift({
          chatRoomId: rid,
          roomName: message?.chatRoom?.roomName ?? `채팅방 ${rid}`,
          latestMessageContent: lastText,
          latestMessageTime: lastTime,
          unreadCount: isSelf ? 0 : 1,
          memberImages: message?.chatRoom?.memberImages || [],
          kino: message?.chatRoom?.kino || false,
          notificationOn: true,
          userChatRooms: Array.isArray(message?.chatRoom?.userChatRooms)
            ? message.chatRoom.userChatRooms
            : [],
        });
      } else {
        const prev = state.chatRoomList[idx];
        let unread = prev.unreadCount || 0;

        if (!isSelf) {
          unread = state.activeChatRoomId === rid ? 0 : unread + 1;
        }

        state.chatRoomList[idx] = {
          ...prev,
          latestMessageContent: lastText,
          latestMessageTime: lastTime,
          unreadCount: unread,
        };
      }

      finalizeList(state);
    },

    markRoomRead(state, action) {
      const rid = toId(action.payload);
      const idx = findRoomIndex(state, rid);

      if (idx !== -1) {
        state.chatRoomList[idx] = {
          ...state.chatRoomList[idx],
          unreadCount: 0,
        };
        state.listRevision += 1;
      }
    },

    updateChatRoomNameInList(state, action) {
      const {chatRoomId, newRoomName} = action.payload || {};
      const rid = toId(chatRoomId);
      const idx = findRoomIndex(state, rid);

      if (idx !== -1) {
        state.chatRoomList[idx] = {
          ...state.chatRoomList[idx],
          roomName: newRoomName ?? state.chatRoomList[idx].roomName,
        };
        state.listRevision += 1;
      }
    },

    removeChatRoomFromList(state, action) {
      const rid = toId(action.payload);

      state.chatRoomList = state.chatRoomList.filter(
        room => toId(room.chatRoomId) !== rid,
      );

      if (state.activeChatRoomId === rid) state.activeChatRoomId = null;
      if (state.pendingTopRoomId === rid) state.pendingTopRoomId = null;

      if (state.readPointersByRoom?.[rid]) delete state.readPointersByRoom[rid];
      if (state.markReadStatusByRoom?.[rid])
        delete state.markReadStatusByRoom[rid];

      state.listRevision += 1;
    },

    /* =========================
     * 읽음 포인터 reducers
     * ========================= */
    setReadPointers(state, action) {
      const {chatRoomId, pointers} = action.payload || {};
      const rid = toId(chatRoomId);
      if (!rid) return;

      const next = {...(state.readPointersByRoom[rid] || {})};

      const list = Array.isArray(pointers) ? pointers : [];
      list.forEach(p => {
        const uid = p?.userId;
        const at = p?.lastReadAt;
        if (uid == null || !at) return;
        next[String(uid)] = toIso(at);
      });

      state.readPointersByRoom[rid] = next;
      state.listRevision += 1;
    },

    applyReadPointer(state, action) {
      const {chatRoomId, userId, lastReadAt} = action.payload || {};
      const rid = toId(chatRoomId);
      if (!rid || userId == null || !lastReadAt) return;

      if (!state.readPointersByRoom[rid]) state.readPointersByRoom[rid] = {};
      state.readPointersByRoom[rid][String(userId)] = toIso(lastReadAt);

      state.listRevision += 1;
    },
  },

  extraReducers: addChatRoomExtraReducers,
});

/* =========================
 * Selectors (memoized)
 * ========================= */
const selectChatRoomState = state => state?.chatRoom;

export const selectChatRoomList = createSelector(
  [selectChatRoomState],
  chatRoom => chatRoom?.chatRoomList ?? [],
);

// 방별 readPointers map
export const selectReadPointers = createSelector(
  [selectChatRoomState, (_, chatRoomId) => chatRoomId],
  (chatRoom, chatRoomId) => {
    const rid = toId(chatRoomId);
    if (!rid) return {};
    return chatRoom?.readPointersByRoom?.[rid] || {};
  },
);

// 채팅 unread 총합 (앱 뱃지 합산용)
export const selectChatUnreadTotal = createSelector(
  [selectChatRoomList],
  list =>
    list.reduce((sum, r) => {
      const n = Number(r?.unreadCount);
      return sum + (Number.isFinite(n) ? Math.max(0, n) : 0);
    }, 0),
);

export const {
  bumpListRevision,
  bumpChatRoomToTop,
  clearPendingTopRoom,
  setChatRoomList,
  setChatRoomUsers,
  setChatRoomLoading,
  setChatRoomError,
  setActiveChatRoom,
  applyMessagePreview,
  markRoomRead,
  updateChatRoomNameInList,
  removeChatRoomFromList,
  setChatRoomNotificationState,
  setReadPointers,
  applyReadPointer,
  resetChatRoomMedia,
  clearChatRoomMedia,
} = chatRoomSlice.actions;

export default chatRoomSlice.reducer;
