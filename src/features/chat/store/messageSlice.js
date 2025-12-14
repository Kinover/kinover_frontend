// store/messageSlice.js
import {createSlice} from '@reduxjs/toolkit';

const toId = v => (v == null ? null : String(v));
const toStr = v => (v == null ? null : String(v));

const ensureRoom = (state, chatRoomId) => {
  const rid = toId(chatRoomId);
  if (!rid) return null;

  if (!state.rooms[rid]) {
    state.rooms[rid] = {
      messageList: [], // ✅ DESC(최신 -> 과거)
      isLoading: false,
      error: null,
      isFetched: false,
      hasMore: true,
      cursor: null, // ✅ "가장 과거" createdAt (DESC에서는 마지막 아이템)
    };
  }
  return state.rooms[rid];
};

const initialState = {
  rooms: {},
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

const arrayEqual = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (String(a[i]) !== String(b[i])) return false;
  return true;
};

const looksLikeSameMyMessage = (optimistic, incoming) => {
  if (!optimistic || !incoming) return false;

  // optimistic 후보는 localStatus sending인 것만
  if (optimistic.localStatus !== 'sending') return false;

  const oSender = toStr(optimistic.senderId);
  const iSender = toStr(incoming.senderId);
  if (!oSender || !iSender || oSender !== iSender) return false;

  const oType = toStr(optimistic.messageType ?? optimistic.type ?? 'text');
  const iType = toStr(incoming.messageType ?? incoming.type ?? 'text');
  if (oType !== iType) return false;

  // 시간 근접(서버 echo는 보통 0~몇 초)
  const ot = new Date(optimistic.createdAt ?? 0).getTime();
  const it = new Date(incoming.createdAt ?? 0).getTime();
  if (Number.isFinite(ot) && Number.isFinite(it)) {
    const diff = Math.abs(it - ot);
    if (diff > 10000) {
      // 10초 넘게 차이나면 다른 메시지로 보자
      // (서버 createdAt이 완전 다른 기준이면 이 조건이 걸릴 수 있는데,
      // 그 경우에는 아래 content/image 비교로도 잡혀서 통과할 수 있음)
    }
  }

  if (oType === 'text') {
    const oc = toStr(optimistic.content ?? '');
    const ic = toStr(incoming.content ?? '');
    if (!oc || !ic) return false;
    return oc === ic;
  }

  if (oType === 'image') {
    const oa = optimistic.imageUrls ?? optimistic.mediaUrls ?? optimistic.images ?? [];
    const ia = incoming.imageUrls ?? incoming.mediaUrls ?? incoming.images ?? [];
    const oArr = Array.isArray(oa) ? oa : oa ? [oa] : [];
    const iArr = Array.isArray(ia) ? ia : ia ? [ia] : [];
    if (oArr.length === 0 || iArr.length === 0) return false;
    return arrayEqual(oArr, iArr);
  }

  return false;
};

/**
 * ✅ 중복 방지/교체 규칙 (DESC: 최신은 앞)
 * 1) clientMessageId로 교체
 * 2) messageId로 교체
 * 3) server가 clientMessageId를 안 줄 때 대비: "내 optimistic(sending)"를 휴리스틱으로 교체
 * 4) 아니면 신규로 앞에 추가
 */
const upsertByIdOrClientId = (list, message) => {
  if (!message) return list;

  const msgId = toStr(message?.messageId);
  const clientId = toStr(message?.clientMessageId);

  // ✅ 1) clientMessageId로 교체 (가장 강력)
  if (clientId) {
    const idx = list.findIndex(m => toStr(m?.clientMessageId) === clientId);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = message;
      return next;
    }

    // ✅ optimistic messageId가 `client-${clientId}`로 들어가므로 이것도 교체 대상으로
    const optimisticKey = `client-${clientId}`;
    const idx2 = list.findIndex(m => toStr(m?.messageId) === optimisticKey);
    if (idx2 !== -1) {
      const next = [...list];
      next[idx2] = message;
      return next;
    }
  }

  // ✅ 2) messageId 중복이면 교체
  if (msgId) {
    const idx = list.findIndex(m => toStr(m?.messageId) === msgId);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = message;
      return next;
    }
  }

  // ✅ 3) 서버 echo가 clientMessageId를 안 줄 때: "가장 가까운 sending optimistic" 교체
  const optimisticIdx = list.findIndex(m => looksLikeSameMyMessage(m, message));
  if (optimisticIdx !== -1) {
    const next = [...list];
    next[optimisticIdx] = message;
    return next;
  }

  // ✅ 4) 신규면 최신이므로 앞에 추가 (DESC)
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
      if (rid && state.rooms[rid]) delete state.rooms[rid];
    },

    setMessageList(state, action) {
      const {chatRoomId, messages} = action.payload || {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;

      const arr = normalizeDesc(messages);

      room.messageList = arr;
      room.isFetched = true;
      room.error = null;

      const oldest = room.messageList?.[room.messageList.length - 1];
      room.cursor = oldest?.createdAt ?? null;

      room.hasMore = arr.length > 0;
    },

    appendMessageList(state, action) {
      const {chatRoomId, messages} = action.payload || {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;

      const incoming = normalizeDesc(messages);

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
      const {chatRoomId, message} = action.payload || {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;

      room.messageList = upsertByIdOrClientId(room.messageList, message);

      if (!room.cursor) {
        const oldest = room.messageList?.[room.messageList.length - 1];
        room.cursor = oldest?.createdAt ?? null;
      }
    },

    setMessageFetched(state, action) {
      const {chatRoomId, isFetched} = action.payload || {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;
      room.isFetched = !!isFetched;
    },

    setMessageLoading(state, action) {
      const {chatRoomId, isLoading} = action.payload || {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;
      room.isLoading = !!isLoading;
    },

    setMessageError(state, action) {
      const {chatRoomId, error} = action.payload || {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;
      room.error = error || null;
    },

    resetRoomMessageList(state, action) {
      const rid = toId(action.payload);
      if (!rid) return;
      const room = ensureRoom(state, rid);
      if (!room) return;

      room.messageList = [];
      room.cursor = null;
      room.hasMore = true;
      room.error = null;
      room.isFetched = false;
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
  state.message.rooms[String(chatRoomId)]?.messageList ?? [];

export const selectRoomMeta = (state, chatRoomId) =>
  state.message.rooms[String(chatRoomId)] ?? {
    messageList: [],
    isLoading: false,
    error: null,
    isFetched: false,
    hasMore: true,
    cursor: null,
  };
