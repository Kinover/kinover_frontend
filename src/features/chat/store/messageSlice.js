// store/messageSlice.js
import {createSlice} from '@reduxjs/toolkit';

const toId = v => (v == null ? null : String(v));
const toStr = v => (v == null ? null : String(v));

const ensureRoom = (state, chatRoomId) => {
  const rid = toId(chatRoomId);
  if (!rid) return null;

  if (!state?.rooms) state.rooms = {};
  if (!state.rooms[rid]) {
    state.rooms[rid] = {
      messageList: [], // DESC(최신 -> 과거)
      isLoading: false,
      error: null,
      isFetched: false,
      hasMore: true,
      cursor: null, // "가장 과거" createdAt
      clearedAt: null, // UI 리셋 기준 시각 (이 시각 이전 메시지는 무시)
    };
  }
  return state.rooms[rid];
};

const initialState = {
  rooms: {},
};

const normalizeImageKey = v => {
  if (!v) return null;
  const s = String(v);
  const noQuery = s.split('?')[0];
  return noQuery.split('/').pop();
};

const arrayEqualLoose = (a, b) => {
  const A = (Array.isArray(a) ? a : a ? [a] : []).map(normalizeImageKey);
  const B = (Array.isArray(b) ? b : b ? [b] : []).map(normalizeImageKey);

  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
  return true;
};

const normalizeDesc = arr => {
  const list = Array.isArray(arr) ? arr : [];
  if (list.length < 2) return list;

  const first = new Date(list[0]?.createdAt ?? 0).getTime();
  const last = new Date(list[list.length - 1]?.createdAt ?? 0).getTime();

  if (Number.isFinite(first) && Number.isFinite(last) && first < last) {
    return [...list].reverse();
  }
  return list;
};

// clearedAt 이후 메시지만 남기기
const filterByClearedAt = (list, clearedAt) => {
  if (!clearedAt) return list;
  const t0 = new Date(clearedAt).getTime();
  if (!Number.isFinite(t0)) return list;

  return (Array.isArray(list) ? list : []).filter(m => {
    const t = new Date(m?.createdAt ?? 0).getTime();
    return Number.isFinite(t) ? t >= t0 : true;
  });
};
const looksLikeSameMyMessage = (optimistic, incoming) => {
  if (!optimistic || !incoming) return false;
  if (optimistic.localStatus !== 'sending') return false;

  const oSender = toStr(optimistic.senderId);
  const iSender = toStr(incoming.senderId);
  if (!oSender || !iSender || oSender !== iSender) return false;

  const oType = toStr(optimistic.messageType ?? optimistic.type ?? 'text')
    ?.toLowerCase()
    ?.trim();
  const iType = toStr(incoming.messageType ?? incoming.type ?? 'text')
    ?.toLowerCase()
    ?.trim();
  if (oType !== iType) return false;

  if (oType === 'text') {
    const oc = toStr(optimistic.content ?? '');
    const ic = toStr(incoming.content ?? '');
    if (!oc || !ic) return false;
    return oc === ic;
  }

 // image + video 공통 처리
  if (oType === 'image' || oType === 'video') {
    const oa =
      optimistic.imageUrls ??
      optimistic.mediaUrls ??
      optimistic.images ??
      optimistic.videoUrls ??
      [];
    const ia =
      incoming.imageUrls ??
      incoming.mediaUrls ??
      incoming.images ??
      incoming.videoUrls ??
      [];
    const oArr = Array.isArray(oa) ? oa : oa ? [oa] : [];
    const iArr = Array.isArray(ia) ? ia : ia ? [ia] : [];
    if (oArr.length === 0 || iArr.length === 0) return false;
    return arrayEqualLoose(oArr, iArr);
  }

  return false;
};

const upsertByIdOrClientId = (list, message) => {
  if (!message) return list;

  const type = toStr(message?.messageType ?? message?.type ?? 'text')
    ?.toLowerCase()
    ?.trim();

  const content = toStr(message?.content ?? '').trim();

  const media =
    message?.mediaUrls ??
    message?.imageUrls ??
    message?.videoUrls ??
    message?.images ??
    message?.imageUrl ??
    message?.videoUrl ??
    [];

  const mediaArr = Array.isArray(media) ? media : media ? [media] : [];
  const hasMedia = mediaArr.length > 0;

  if (type === 'text' && !content) return list;
  if ((type === 'image' || type === 'video') && !hasMedia) return list;
  const msgId = toStr(message?.messageId);
  const clientId = toStr(message?.clientMessageId);

  if (clientId) {
    const idx = list.findIndex(m => toStr(m?.clientMessageId) === clientId);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = message;
      return next;
    }

    const optimisticKey = `client-${clientId}`;
    const idx2 = list.findIndex(m => toStr(m?.messageId) === optimisticKey);
    if (idx2 !== -1) {
      const next = [...list];
      next[idx2] = message;
      return next;
    }

    const idx3 = list.findIndex(m => toStr(m?.messageId) === clientId);
    if (idx3 !== -1) {
      const next = [...list];
      next[idx3] = message;
      return next;
    }
  }

  if (msgId) {
    const idx = list.findIndex(m => toStr(m?.messageId) === msgId);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = message;
      return next;
    }
  }

  const optimisticIdx = list.findIndex(m => looksLikeSameMyMessage(m, message));
  if (optimisticIdx !== -1) {
    const next = [...list];
    next[optimisticIdx] = message;
    return next;
  }

  return [message, ...list];
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
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

    setMessageList(state, action) {
      const {chatRoomId, messages} = action.payload ?? {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;

      const arr0 = normalizeDesc(Array.isArray(messages) ? messages : []);
      const arr = filterByClearedAt(arr0, room.clearedAt); // 핵심

      room.messageList = arr;
      room.isFetched = true;
      room.error = null;

      const oldest = room.messageList?.[room.messageList.length - 1];
      room.cursor = oldest?.createdAt ?? null;

      room.hasMore = arr.length > 0;
    },

    appendMessageList(state, action) {
      const {chatRoomId, messages} = action.payload ?? {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;

      const incoming0 = normalizeDesc(Array.isArray(messages) ? messages : []);
      const incoming = filterByClearedAt(incoming0, room.clearedAt); // 핵심

      const existingIds = new Set(
        room.messageList
          .map(m => (m?.messageId != null ? String(m.messageId) : null))
          .filter(Boolean),
      );

      const newMessages = incoming.filter(
        m => m?.messageId != null && !existingIds.has(String(m.messageId)),
      );

      room.messageList = [...room.messageList, ...newMessages];

      const oldest = room.messageList?.[room.messageList.length - 1];
      room.cursor = oldest?.createdAt ?? room.cursor;

      room.hasMore = incoming.length > 0;
    },

    addMessage(state, action) {
      const {chatRoomId, message} = action.payload ?? {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;

 // clearedAt 이전 메시지는 소켓으로 와도 무시
      if (room.clearedAt) {
        const t0 = new Date(room.clearedAt).getTime();
        const t = new Date(message?.createdAt ?? 0).getTime();
        if (Number.isFinite(t0) && Number.isFinite(t) && t < t0) {
          return;
        }
      }

      room.messageList = upsertByIdOrClientId(room.messageList, message);

      if (!room.cursor) {
        const oldest = room.messageList?.[room.messageList.length - 1];
        room.cursor = oldest?.createdAt ?? null;
      }
    },

    setMessageFetched(state, action) {
      const {chatRoomId, isFetched} = action.payload ?? {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;
      room.isFetched = !!isFetched;
    },

    setMessageLoading(state, action) {
      const {chatRoomId, isLoading} = action.payload ?? {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;
      room.isLoading = !!isLoading;
    },

    setMessageError(state, action) {
      const {chatRoomId, error} = action.payload ?? {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;
      room.error = error || null;
    },

    resetRoomMessageList(state, action) {
      const rid = toId(action.payload);
      if (!rid) return;
      const room = ensureRoom(state, rid);
      if (!room) return;

      const nowIso = new Date().toISOString();

      room.messageList = [];
      room.cursor = null;
      room.hasMore = true;
      room.error = null;
      room.isFetched = false;

      room.clearedAt = nowIso; // 핵심: 이 시각 이전 메시지 다시 안 보이게
    },
  },
});

export const {
  initRoom,
  clearRoomMessages,
  setMessageList,
  appendMessageList,
  addMessage,
  setMessageFetched,
  setMessageLoading,
  setMessageError,
  resetRoomMessageList,
} = messageSlice.actions;

export default messageSlice.reducer;

export const selectRoomMessages = (state, chatRoomId) =>
  state?.message?.rooms?.[String(chatRoomId)]?.messageList ?? [];

export const selectRoomMeta = (state, chatRoomId) =>
  state?.message?.rooms?.[String(chatRoomId)] ?? {
    messageList: [],
    isLoading: false,
    error: null,
    isFetched: false,
    hasMore: true,
    cursor: null,
    clearedAt: null,
  };
