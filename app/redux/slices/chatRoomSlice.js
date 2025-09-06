// chatRoomSlice.js
import { createSlice } from '@reduxjs/toolkit';

/* =========================
 * Utilities / Helpers
 * ========================= */

/** 안전한 문자열 ID 변환 */
const toId = (v) => (v == null ? null : String(v));

/** 안전한 ISO 시각 문자열 반환 (잘못된 값이면 now) */
const toIso = (d) => {
  try {
    const t = d ? new Date(d) : new Date();
    if (Number.isNaN(t.getTime())) return new Date().toISOString();
    return t.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

/** 최근 메시지 시각 기준 정렬 (내림차순) */
const sortByLatest = (list) =>
  [...list].sort(
    (a, b) =>
      new Date(b.latestMessageTime || 0).getTime() -
      new Date(a.latestMessageTime || 0).getTime()
  );

/** 미리보기 텍스트 매핑 */
const MESSAGE_TYPE_LABELS = {
  image: '[사진]',
  video: '[동영상]',
  file: '[파일]',
};
const previewText = (msg) => {
  if (!msg) return '';
  const type = msg.messageType?.toLowerCase?.();
  if (MESSAGE_TYPE_LABELS[type]) return MESSAGE_TYPE_LABELS[type];
  return msg.content ?? '';
};

/** 리스트에서 채팅방 인덱스 찾기 */
const findRoomIndex = (state, rid) =>
  state.chatRoomList.findIndex((r) => toId(r.chatRoomId) === rid);

/** 공통: “리스트 항목 업데이트 + 정렬 + 리비전 증가” */
const finalizeList = (state) => {
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
  listRevision: 0, // 강제 리렌더 트리거 용 카운터
};

/* =========================
 * Slice
 * ========================= */

const chatRoomSlice = createSlice({
  name: 'chatRoom',
  initialState: initialChatRoomState,
  reducers: {
    /** 필요할 때 강제로 리렌더 트리거 */
    bumpListRevision(state) {
      state.listRevision += 1;
    },

    /** 서버에서 내려온 채팅방 리스트 설정 */
    setChatRoomList(state, action) {
      const src = Array.isArray(action.payload) ? action.payload : [];

      state.chatRoomList = sortByLatest(
        src.map((r) => {
          const rid = toId(r.chatRoomId);
          // latestMessageTime이 없으면 updatedAt이나 null
          const latest =
            r.latestMessageTime ?? r.updatedAt ?? null;

          return {
            ...r,
            chatRoomId: rid,
            roomName: r.roomName ?? `채팅방 ${rid ?? ''}`,
            latestMessageContent: r.latestMessageContent ?? '',
            latestMessageTime: latest ? toIso(latest) : null,
            unreadCount: Number.isFinite(r.unreadCount) ? r.unreadCount : 0,
          };
        })
      );

      state.listRevision += 1;
    },

    /** 특정 채팅방의 사용자 목록(프로필 등) */
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

    /** 현재 열려있는(활성) 채팅방 지정 */
    setActiveChatRoom(state, action) {
      state.activeChatRoomId = action.payload ? toId(action.payload) : null;
    },

    /**
     * 새 메시지 수신/발신 시 리스트에 미리보기 반영
     * - 방이 없으면 새로 추가
     * - 방이 있으면 최신 내용/시각/안읽음 갱신
     */
    applyMessagePreview(state, action) {
      const { chatRoomId, message, isSelf } = action.payload || {};
      const rid = toId(chatRoomId);
      const lastText = previewText(message);
      const lastTime = toIso(message?.createdAt);

      const idx = findRoomIndex(state, rid);

      if (idx === -1) {
        // 리스트에 없는 방이면 헤더 정보 최소로 넣어준다
        state.chatRoomList.unshift({
          chatRoomId: rid,
          roomName: `채팅방 ${rid}`,
          latestMessageContent: lastText,
          latestMessageTime: lastTime,
          unreadCount: isSelf ? 0 : 1, // 내가 보낸 메시지는 안읽음 증가 X
          memberImages: message?.chatRoom?.memberImages || [],
          kino: message?.chatRoom?.kino || false,
        });
      } else {
        const prev = state.chatRoomList[idx];

        // 안읽음 규칙:
        // - 내가 보낸 메시지(isSelf)면 그대로 유지
        // - 내가 보낸 게 아니고, 현재 활성 방이 아니면 +1
        // - 현재 활성 방이면 0으로 리셋
        let unread = prev.unreadCount || 0;

        if (!isSelf) {
          unread =
            state.activeChatRoomId && state.activeChatRoomId === rid
              ? 0
              : unread + 1;
        } else {
          // isSelf인 경우는 현재 활성 여부와 상관없이 unread 유지
          // (요구사항에 따라 0으로 만들고 싶다면 여기서 처리)
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
     * 방을 읽음 처리 (리스트에서 해당 방의 unreadCount = 0)
     * - activeChatRoomId도 동기화
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

      state.activeChatRoomId = rid;
    },

    /** 리스트에서 해당 방의 이름만 변경 */
    updateChatRoomNameInList(state, action) {
      const { chatRoomId, newRoomName } = action.payload || {};
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
  },
});

/* =========================
 * Exports
 * ========================= */

export const {
  bumpListRevision,
  setChatRoomList,
  setChatRoomUsers,
  setChatRoomLoading,
  setChatRoomError,
  setActiveChatRoom,
  applyMessagePreview,
  markRoomRead,
  updateChatRoomNameInList,
} = chatRoomSlice.actions;

export default chatRoomSlice.reducer;
