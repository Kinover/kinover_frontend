// src/features/chat/store/chatRoomSlice.js
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import {getToken} from '../../../utils/storage';

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
 * ✅ API (백엔드 컨트롤러 기준)
 * ========================= */
const API_BASE = 'https://kinover.shop/api/chatRoom';

/**
 * ✅ markReadThunk
 * - 서버에 lastReadAt 저장 (POST /{chatRoomId}/read)
 * - 성공 시 포인터 저장 + 목록 unreadCount 0 처리(옵션)
 */
export const markReadThunk = createAsyncThunk(
  'chatRoom/markRead',
  async ({chatRoomId, lastReadAt}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

      const body = {lastReadAt: toIso(lastReadAt)};

      await axios.post(`${API_BASE}/${rid}/read`, body, {
        headers: {Authorization: `Bearer ${token}`},
      });

      return {chatRoomId: rid, lastReadAt: body.lastReadAt};
    } catch (err) {
      const msg = err.response?.data || err.message || '알 수 없는 오류';
      return rejectWithValue(msg);
    }
  },
);

/**
 * ✅ fetchReadPointersThunk
 * - 채팅방 참여자별 포인터 조회 (GET /{chatRoomId}/readPointers)
 * - response는 ReadPointersResponseDTO 형태로 올 확률 큼:
 *   { pointers: [{userId, lastReadAt}, ...] } 또는 { readPointers: [...] } 등
 * - 그래서 안전하게 파싱함
 */
export const fetchReadPointersThunk = createAsyncThunk(
  'chatRoom/fetchReadPointers',
  async ({chatRoomId}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

      const res = await axios.get(`${API_BASE}/${rid}/readPointers`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const data = res.data || {};
      const pointers =
        data.pointers ||
        data.readPointers ||
        data.items ||
        (Array.isArray(data) ? data : []);

      return {chatRoomId: rid, pointers: Array.isArray(pointers) ? pointers : []};
    } catch (err) {
      const msg = err.response?.data || err.message || '알 수 없는 오류';
      return rejectWithValue(msg);
    }
  },
);

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

  /**
   * ✅ 읽음 포인터 저장
   * readPointersByRoom[rid][userId] = lastReadAt (ISO string)
   */
  readPointersByRoom: {},

  /**
   * ✅ 내 read 요청 상태(선택)
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
          r.latestMessageTime ?? r.updatedAt ?? r.createdAt ?? new Date().toISOString();

        return {
          ...r,
          chatRoomId: rid,
          roomName: r.roomName ?? `채팅방 ${rid ?? ''}`,
          latestMessageContent: r.latestMessageContent ?? '',
          latestMessageTime: toIso(latestRaw),

          // ✅ 서버가 unreadCount를 내려주는 전제 (컨트롤러 주석에 그 얘기 있음)
          unreadCount: Number.isFinite(r.unreadCount) ? r.unreadCount : 0,

          notificationOn: typeof r.notificationOn === 'boolean' ? r.notificationOn : true,
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
      state.chatRoomUsers = Array.isArray(action.payload) ? [...action.payload] : [];
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

    /**
     * ✅ 새 메시지 프리뷰 반영
     * - “목록 뱃지”는 서버 unreadCount가 베이스가 가장 정확
     * - 그래도 실시간 소켓에서 뱃지 증가를 하려면 여기서 +1은 유효함
     * - 단, activeChatRoom이면 0 유지
     */
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

    /**
     * ✅ UI 레벨 "읽음" 처리(뱃지만 0)
     * - 서버 업데이트는 markReadThunk가 담당
     */
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

      state.chatRoomList = state.chatRoomList.filter(room => toId(room.chatRoomId) !== rid);

      if (state.activeChatRoomId === rid) state.activeChatRoomId = null;
      if (state.pendingTopRoomId === rid) state.pendingTopRoomId = null;

      if (state.readPointersByRoom?.[rid]) delete state.readPointersByRoom[rid];
      if (state.markReadStatusByRoom?.[rid]) delete state.markReadStatusByRoom[rid];

      state.listRevision += 1;
    },

    /* =========================
     * ✅ 읽음 포인터 reducers
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

  extraReducers: builder => {
    builder
      .addCase(markReadThunk.pending, (state, action) => {
        const rid = toId(action.meta.arg?.chatRoomId);
        if (!rid) return;
        state.markReadStatusByRoom[rid] = 'pending';
      })
      .addCase(markReadThunk.fulfilled, (state, action) => {
        const {chatRoomId, lastReadAt} = action.payload || {};
        const rid = toId(chatRoomId);
        if (!rid) return;

        state.markReadStatusByRoom[rid] = 'fulfilled';

        // ✅ “내가 읽었다” 포인터 저장은 여기서 확실히
        // (내 userId는 thunk arg로 안 받았으니, 호출부에서 applyReadPointer를 같이 쓰는 방식도 가능)
        // 여기서는 포인터 '자기 것' 저장을 slice가 못 하니(내 userId 모름),
        // 대신 readPointers는 fetchReadPointersThunk로 맞춰오는 것을 권장.
        // 하지만 최소한 목록 뱃지는 0으로 내려줌:
        const idx = findRoomIndex(state, rid);
        if (idx !== -1) {
          state.chatRoomList[idx] = {
            ...state.chatRoomList[idx],
            unreadCount: 0,
          };
          state.listRevision += 1;
        }
      })
      .addCase(markReadThunk.rejected, (state, action) => {
        const rid = toId(action.meta.arg?.chatRoomId);
        if (!rid) return;
        state.markReadStatusByRoom[rid] = 'rejected';
      })
      .addCase(fetchReadPointersThunk.fulfilled, (state, action) => {
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
  setReadPointers,
  applyReadPointer,
} = chatRoomSlice.actions;

export default chatRoomSlice.reducer;

/* =========================
 * Selectors
 * ========================= */
export const selectReadPointers = (state, chatRoomId) =>
  state.chatRoom.readPointersByRoom?.[String(chatRoomId)] || {};

export const selectMarkReadStatus = (state, chatRoomId) =>
  state.chatRoom.markReadStatusByRoom?.[String(chatRoomId)] || 'idle';
