import {createSlice} from '@reduxjs/toolkit';

/* =========================
 * Utilities / Helpers
 * ========================= */
const toId = v => (v == null ? null : String(v));

const toIso = d => {
  try {
    const t = d ? new Date(d) : new Date();
    if (Number.isNaN(t.getTime())) return new Date().toISOString();
    return t.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

const sortByLatest = list =>
  [...list].sort(
    (a, b) =>
      new Date(b.latestMessageTime || 0).getTime() -
      new Date(a.latestMessageTime || 0).getTime(),
  );

const previewText = msg => {
  if (!msg) return '';

  const type = msg.messageType?.toLowerCase?.();

  const n = Array.isArray(msg.imageUrls)
    ? msg.imageUrls.length
    : Array.isArray(msg.mediaUrls)
    ? msg.mediaUrls.length
    : 1;

  if (type === 'image') return `사진을 ${n}장 보냈습니다.`;
  if (type === 'video') return `동영상을 ${n}개 보냈습니다.`;
  if (type === 'file') return '[파일]';

  return msg.content ?? '';
};

const findRoomIndex = (state, rid) =>
  state.chatRoomList.findIndex(r => toId(r.chatRoomId) === rid);

const finalizeList = state => {
  state.chatRoomList = sortByLatest(state.chatRoomList);
  state.listRevision += 1;
};

/* =========================
 * Initial State
 * ========================= */
const initialChatRoomState = {
  chatRoomList: [],
  chatRoomUsers: [],
  loading: false,
  error: null,

  // ✅ “현재 보고 있는 방”만 추적
  activeChatRoomId: null,

  listRevision: 0,
  pendingTopRoomId: null,
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
      const src = Array.isArray(action.payload) ? action.payload : [];

      const mapped = src.map(r => {
        const rid = toId(r.chatRoomId);

        const latestRaw =
          r.latestMessageTime ??
          r.updatedAt ??
          r.createdAt ??
          new Date().toISOString();

        return {
          ...r,
          chatRoomId: rid,
          roomName: r.roomName ?? `채팅방 ${rid ?? ''}`,
          latestMessageContent: r.latestMessageContent ?? '',
          latestMessageTime: toIso(latestRaw),
          unreadCount: Number.isFinite(r.unreadCount) ? r.unreadCount : 0,
          notificationOn:
            typeof r.notificationOn === 'boolean' ? r.notificationOn : true,
          userChatRooms: Array.isArray(r.userChatRooms) ? r.userChatRooms : [],
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

    // ✅ 들어갈 때 rid, 나갈 때 null 로 관리
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
          // ✅ “지금 보고있는 방”일 때만 0, 아니면 +1
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

    // ✅ unreadCount만 0으로. activeChatRoomId는 여기서 건드리지 말자.
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

      if (state.activeChatRoomId === rid) {
        state.activeChatRoomId = null;
      }

      if (state.pendingTopRoomId === rid) {
        state.pendingTopRoomId = null;
      }

      state.listRevision += 1;
    },
  },
});

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
} = chatRoomSlice.actions;

export default chatRoomSlice.reducer;
