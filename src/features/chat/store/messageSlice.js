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

const normalizeImageKey = v => {
  if (!v) return null;
  const s = String(v);

  // 쿼리 제거
  const noQuery = s.split('?')[0];

  // cloudfront / s3 url이면 마지막 path만
  return noQuery.split('/').pop();
};

const arrayEqualLoose = (a, b) => {
  const A = (Array.isArray(a) ? a : a ? [a] : []).map(normalizeImageKey);
  const B = (Array.isArray(b) ? b : b ? [b] : []).map(normalizeImageKey);

  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) {
    if (A[i] !== B[i]) return false;
  }
  return true;
};

/**
 * ✅ 서버가 ASC/DESC 아무거나 줘도 state는 DESC(최신->과거)로 통일
 */
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
  for (let i = 0; i < a.length; i++) {
    if (String(a[i]) !== String(b[i])) return false;
  }
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
      // 10초 넘게 차이나면 다른 메시지일 가능성 높음
      // (서버 createdAt이 다른 기준이면 아래 content/image 비교가 추가로 잡아줌)
    }
  }

  if (oType === 'text') {
    const oc = toStr(optimistic.content ?? '');
    const ic = toStr(incoming.content ?? '');
    if (!oc || !ic) return false;
    return oc === ic;
  }

  if (oType === 'image') {
    const oa =
      optimistic.imageUrls ?? optimistic.mediaUrls ?? optimistic.images ?? [];
    const ia =
      incoming.imageUrls ?? incoming.mediaUrls ?? incoming.images ?? [];
    const oArr = Array.isArray(oa) ? oa : oa ? [oa] : [];
    const iArr = Array.isArray(ia) ? ia : ia ? [ia] : [];
    if (oArr.length === 0 || iArr.length === 0) return false;
    return arrayEqualLoose(oArr, iArr);
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

  const type = toStr(message?.messageType ?? message?.type ?? 'text')
    ?.toLowerCase()
    ?.trim();

  const content = toStr(message?.content ?? '').trim();

  const media =
    message?.imageUrls ??
    message?.mediaUrls ??
    message?.images ??
    message?.imageUrl ?? // 이것도 같이 커버
    [];

  const mediaArr = Array.isArray(media) ? media : media ? [media] : [];
  const hasMedia = mediaArr.length > 0;

  // ✅ 1) 빈 text는 무시
  if (type === 'text' && !content) return list;

  // ✅ 2) 빈 image는 무시 (이게 스샷 원인 잡는 핵심)
  if (type === 'image' && !hasMedia) return list;

  // ---- 아래는 기존 로직 그대로 ----
  const msgId = toStr(message?.messageId);
  const clientId = toStr(message?.clientMessageId);

  // ✅ 1) clientMessageId로 교체 (가장 강력)
  if (clientId) {
    // (A) clientMessageId 동일한 optimistic 찾기
    const idx = list.findIndex(m => toStr(m?.clientMessageId) === clientId);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = message;
      return next;
    }

    // (B) 너가 optimistic messageId를 "client-xxx"로 줄 수도 있으니 그것도 교체
    const optimisticKey = `client-${clientId}`;
    const idx2 = list.findIndex(m => toStr(m?.messageId) === optimisticKey);
    if (idx2 !== -1) {
      const next = [...list];
      next[idx2] = message;
      return next;
    }

    // (C) 과거에 messageId=clientId로 넣어둔 경우도 커버
    const idx3 = list.findIndex(m => toStr(m?.messageId) === clientId);
    if (idx3 !== -1) {
      const next = [...list];
      next[idx3] = message;
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

  // ✅ 3) 서버 echo가 clientMessageId를 안 줄 때: sending optimistic 교체
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

    /**
     * ✅ 초기 메시지 세팅 (state: DESC)
     */
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

    /**
     * ✅ 더 과거 메시지 append (DESC에서 뒤로 붙임)
     */
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

    /**
     * ✅ optimistic/실시간/서버응답 모두 여기로
     */
    addMessage(state, action) {
      const {chatRoomId, message} = action.payload || {};
      const room = ensureRoom(state, chatRoomId);
      if (!room) return;

      room.messageList = upsertByIdOrClientId(room.messageList, message);

      // cursor는 "과거 기준"이라 보통 최신 추가로는 변하지 않음
      // 비어있던 상태에서만 보정
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
