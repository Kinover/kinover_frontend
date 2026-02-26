// src/features/chat/store/chatRoomSelector.js
const toId = v => (v == null ? null : String(v));

export const selectReadPointers = (state, chatRoomId) => {
  const rid = toId(chatRoomId);
  if (!rid) return {};
  return state.chatRoom?.readPointersByRoom?.[rid] || {};
};

export const selectMarkReadStatus = (state, chatRoomId) => {
  const rid = toId(chatRoomId);
  if (!rid) return 'idle';
  return state.chatRoom?.markReadStatusByRoom?.[rid] || 'idle';
};

// chatRoomList에서 chatRoomId로 단건 찾기
export const selectChatRoomById = (state, chatRoomId) => {
  const rid = toId(chatRoomId);
  if (!rid) return null;

  const list = Array.isArray(state?.chatRoom?.chatRoomList)
    ? state.chatRoom.chatRoomList
    : [];

  return list.find(r => toId(r?.chatRoomId) === rid) || null;
};

// 채팅 unread 총합 selector (앱 뱃지용)
export const selectChatUnreadTotal = state => {
  const list = Array.isArray(state?.chatRoom?.chatRoomList)
    ? state.chatRoom.chatRoomList
    : [];
  return list.reduce((sum, r) => sum + (Number(r?.unreadCount) || 0), 0);
};

// 채팅방 미디어 상태 selector
export const selectChatRoomMediaState = (state, chatRoomId) => {
  const rid = toId(chatRoomId);
  const empty = {
    items: [],
    nextBefore: null,
    loading: false,
    error: null,
    type: 'ALL',
    hasMore: true,
  };

  if (!rid) return empty;

  return state?.chatRoom?.mediaByRoom?.[rid] || empty;
};
