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

const MESSAGE_TYPE_LABELS = {
  image: '[사진]',
  video: '[동영상]',
  file: '[파일]',
};
const previewText = msg => {
  if (!msg) return '';

  const type = msg.messageType?.toLowerCase?.();

  const n = Array.isArray(msg.imageUrls)
    ? msg.imageUrls.length
    : Array.isArray(msg.mediaUrls)
    ? msg.mediaUrls.length
    : 1;
    
  // ✅ 이미지: n장
  if (type === 'image') {
    return `사진을 ${n}장 보냈습니다.`;
  }

  // ✅ 비디오: n개
  if (type === 'video') {
    return `동영상을 ${n}개 보냈습니다.`;
  }

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
  activeChatRoomId: null,
  listRevision: 0,

  // ✅ “서버가 리스트를 다시 덮어써도” 특정 방은 맨 위 유지용
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

    /** ✅ 특정 채팅방을 “최신”으로 올리기 + 유지 플래그 저장 */
    bumpChatRoomToTop(state, action) {
      const rid = toId(action.payload);
      if (!rid) return;

      state.pendingTopRoomId = rid; // ✅ 유지용

      const idx = findRoomIndex(state, rid);
      if (idx === -1) {
        // 방이 아직 리스트에 없으면 일단 pending만 걸어둠
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

    /** (선택) 이제 유지가 필요 없을 때 끄기 */
    clearPendingTopRoom(state) {
      state.pendingTopRoomId = null;
      state.listRevision += 1;
    },

    /** 서버에서 내려온 채팅방 리스트 설정 */
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

      // ✅ 서버가 덮어써도 “방 맨 위 유지”
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

    applyMessagePreview(state, action) {
      const {chatRoomId, message, isSelf} = action.payload || {};
      const rid = toId(chatRoomId);
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
          unread =
            state.activeChatRoomId && state.activeChatRoomId === rid
              ? 0
              : unread + 1;
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

      state.activeChatRoomId = rid;
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

      // 삭제된 방이 pending이면 해제
      if (state.pendingTopRoomId === rid) {
        state.pendingTopRoomId = null;
      }

      state.listRevision += 1;
    },
  },
});

/* =========================
 * Exports
 * ========================= */

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
