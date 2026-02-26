// src/features/chat/store/chatRoomSlice.js
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import { apiClient } from 'utils/apiClient';
import {getToken} from 'utils/storage';
import { fetchChatRoomMediaThunk } from './chatRoomThunk';

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
  (state?.chatRoomList ?? []).findIndex(r => toId(r?.chatRoomId) === rid);

const finalizeList = state => {
  const list = state?.chatRoomList ?? [];
  state.chatRoomList = Array.isArray(list) ? sortByLatest(list) : [];
  state.listRevision = (state.listRevision ?? 0) + 1;
};

/* =========================
 * API
 * ========================= */
const API_BASE = 'https://kinover.shop/api/chatRoom';

/**
 * markReadThunk
 * - 서버에 lastReadAt 저장 (POST /{chatRoomId}/read)
 * - 성공 시: (1) 내 포인터 저장 (2) 목록 unreadCount 0
 *
 * userId가 화면에서 undefined로 올 수 있어서:
 * - userId가 없으면 slice에서 포인터 저장은 스킵(에러 X)
 * - 그래도 unreadCount 0 / 서버 저장은 정상
 */
export const markReadThunk = createAsyncThunk(
  'chatRoom/markRead',
  async ({chatRoomId, lastReadAt, userId}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

 // lastReadAt이 Date/ISO 등으로 들어오면, 최종적으로 "Z 없는 LocalDateTime"으로 맞춰서 보냄
      const normalized =
        typeof lastReadAt === 'string'
          ? lastReadAt
          : (() => {
              const d = lastReadAt instanceof Date ? lastReadAt : new Date(lastReadAt);
              if (Number.isNaN(d.getTime())) return null;
              const pad2 = n => String(n).padStart(2, '0');
              const pad3 = n => String(n).padStart(3, '0');
              return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
                d.getHours(),
              )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}.${pad3(d.getMilliseconds())}`;
            })();

      if (!normalized) return rejectWithValue('lastReadAt이 올바르지 않습니다.');

      const body = {lastReadAt: normalized};

      await apiClient.post(`${API_BASE}/${rid}/read`, body, {
        headers: {Authorization: `Bearer ${token}`},
      });

      return {
        chatRoomId: rid,
        userId: userId == null ? null : String(userId),
        lastReadAt: body.lastReadAt,
      };
    } catch (err) {
      const msg = err?.response?.data || err?.message || '알 수 없는 오류';
      return rejectWithValue(msg);
    }
  },
);

/**
 * fetchReadPointersThunk
 * - 채팅방 참여자별 포인터 조회 (GET /{chatRoomId}/readPointers)
 */
export const fetchReadPointersThunk = createAsyncThunk(
  'chatRoom/fetchReadPointers',
  async ({chatRoomId}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

      const res = await apiClient.get(`${API_BASE}/${rid}/readPointers`, {
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
      const msg = err?.response?.data || err?.message || '알 수 없는 오류';
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

  extraReducers: builder => {
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
      })
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

 // 타입이 바뀌었으면 강제 리셋 (혼합 방지)
        const nextType = String(type || 'ALL').toUpperCase();
        const typeChanged = prev.type && prev.type !== nextType;

        const nextItems = Array.isArray(items) ? items : [];

 // messageId + url + orderInMessage 로 대충 유니크키 만들어 중복 제거
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

        let merged;
        if (!append || typeChanged) {
          merged = nextItems;
        } else {
          merged = dedupMerge(prev.items || [], nextItems);
        }

        state.mediaByRoom[rid] = {
          ...prev,
          type: nextType,
          items: merged,
          nextBefore: nextBefore ?? null,
          loading: false,
          error: null,
          hasMore: !!nextBefore && nextItems.length > 0, // 커서 있으면 더 있음으로 간주
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
  },
});

/* =========================
 * Selectors (여기가 에러 주범 1순위)
 * ========================= */

// 방별 readPointers map
export const selectReadPointers = (state, chatRoomId) => {
  const rid = toId(chatRoomId);
  if (!rid) return {};
  return state?.chatRoom?.readPointersByRoom?.[rid] || {};
};

// 채팅 unread 총합 (앱 뱃지 합산용)
export const selectChatUnreadTotal = state => {
  const list = state?.chatRoom?.chatRoomList || [];
  return list.reduce((sum, r) => {
    const n = Number(r?.unreadCount);
    return sum + (Number.isFinite(n) ? Math.max(0, n) : 0);
  }, 0);
};

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
