// src/features/chat/store/messageThunk.js
import axios from 'axios';
import {getToken} from '../../../utils/storage';
import {sendChat, sendRead, isChatSocketOpen} from '../hooks/ChatSocket';
import {
  setMessageList,
  appendMessageList,
  setMessageLoading,
  setMessageError,
  setMessageFetched,
  addMessage,
} from './messageSlice';

import {
  applyMessagePreview,
  bumpListRevision,
  markRoomRead,
  applyReadPointer,
  setReadPointers,
} from './chatRoomSlice';

/* =========================
 * Utils
 * ========================= */
const toIso = d => {
  try {
    const t = d ? new Date(d) : new Date();
    if (Number.isNaN(t.getTime())) return new Date().toISOString();
    return t.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

const normalizePreviewMessage = (msg, fallbackBody = null) => {
  const merged = {...(msg || {})};

  merged.createdAt =
    merged.createdAt ||
    merged.sentAt ||
    merged.updatedAt ||
    fallbackBody?.createdAt ||
    new Date().toISOString();

  merged.content =
    merged.content ??
    fallbackBody?.content ??
    merged.latestMessageContent ??
    '';

  merged.messageType =
    merged.messageType ??
    fallbackBody?.messageType ??
    merged.type ??
    'text';

  if (merged.imageUrls == null && fallbackBody?.imageUrls != null) {
    merged.imageUrls = fallbackBody.imageUrls;
  }
  if (merged.mediaUrls == null && fallbackBody?.mediaUrls != null) {
    merged.mediaUrls = fallbackBody.mediaUrls;
  }

  return merged;
};

const genClientId = () => {
  // 가볍게 유니크만 보장하면 OK
  return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

/* =========================
 * 1) 메시지 fetch (REST)
 * ========================= */
export const fetchMessageThunk = (chatRoomId, before = null, limit = 20) => {
  return async dispatch => {
    dispatch(setMessageLoading({chatRoomId, isLoading: true}));
    dispatch(setMessageFetched({chatRoomId, isFetched: false}));

    try {
      const token = await getToken();

      let apiUrl = `https://kinover.shop/api/chatRoom/${chatRoomId}/messages/fetch?limit=${limit}`;
      if (before) apiUrl += `&before=${encodeURIComponent(before)}`;

      const response = await axios.get(apiUrl, {
        headers: {Authorization: `Bearer ${token}`},
      });

      dispatch(setMessageList({chatRoomId, messages: response.data}));
      dispatch(bumpListRevision());
    } catch (error) {
      dispatch(setMessageError({chatRoomId, error: error.message}));
    } finally {
      dispatch(setMessageFetched({chatRoomId, isFetched: true}));
      dispatch(setMessageLoading({chatRoomId, isLoading: false}));
    }
  };
};

export const fetchMoreMessagesThunk = (chatRoomId, beforeTime) => {
  return async dispatch => {
    try {
      const token = await getToken();
      const limit = 20;

      const apiUrl = `https://kinover.shop/api/chatRoom/${chatRoomId}/messages/fetch?limit=${limit}&before=${encodeURIComponent(
        beforeTime,
      )}`;

      const response = await axios.get(apiUrl, {
        headers: {Authorization: `Bearer ${token}`},
      });

      dispatch(appendMessageList({chatRoomId, messages: response.data}));

      return {payload: response.data};
    } catch (error) {
      dispatch(setMessageError({chatRoomId, error: error.message}));
      return {payload: []};
    }
  };
};

/* =========================
 * 2) 메시지 send (WS) - 백엔드 스펙에 맞춤
 * ========================= */
/**
 * messageBody 최소 권장:
 * {
 *   chatRoomId,
 *   senderId,
 *   content,
 *   messageType: 'text' | 'image' | 'video',
 *   imageUrls?: [],
 *   mediaUrls?: [],
 * }
 */
export const sendMessageWsThunk = (messageBody, chatRoomId, userId) => {
  return async dispatch => {
    dispatch(setMessageLoading({chatRoomId, isLoading: true}));

    const clientMessageId = genClientId();
    const nowIso = new Date().toISOString();

    // ✅ optimistic (messageSlice의 upsert 로직과 맞춤)
    const optimistic = {
      ...messageBody,
      chatRoomId: String(chatRoomId),
      senderId: userId,
      messageId: `client-${clientMessageId}`,
      clientMessageId,
      createdAt: nowIso,
      localStatus: 'sending',
    };

    // 1) 화면에 먼저 꽂기
    dispatch(addMessage({chatRoomId: String(chatRoomId), message: optimistic}));

    // 2) preview도 먼저 갱신
    const previewPayload = normalizePreviewMessage(optimistic, messageBody);
    dispatch(
      applyMessagePreview({
        chatRoomId: String(chatRoomId),
        message: previewPayload,
        isSelf: true,
      }),
    );
    dispatch(bumpListRevision());

    // 3) WS 전송 (백엔드 WebSocketMessageHandler는 MessageDTO로 파싱)
    try {
      const payloadToSend = {
        ...messageBody,
        chatRoomId,
        senderId: userId,
        clientMessageId, // ✅ 서버가 그대로 저장/브로드캐스트하면 매칭이 깔끔해짐
        createdAt: nowIso,
        // type은 안 넣어도 서버 default가 message:new라 OK
      };

      const ok = sendChat(payloadToSend);

      if (!ok) {
        throw new Error('WebSocket not connected');
      }

      return {ok: true, clientMessageId};
    } catch (e) {
      dispatch(setMessageError({chatRoomId, error: e.message}));

      // 실패 표시가 필요하면 localStatus 바꿔치기 하고 싶겠지만
      // 지금 messageSlice에 update reducer가 없으니, 최소는 에러만 저장
      return {ok: false, clientMessageId};
    } finally {
      dispatch(setMessageLoading({chatRoomId, isLoading: false}));
    }
  };
};

/* =========================
 * 3) WS 수신 처리
 * ========================= */
export const receiveMessageThunk = (incomingMessage, userId) => {
  return async dispatch => {
    const chatRoomId =
      incomingMessage?.chatRoomId ??
      incomingMessage?.chatRoom?.chatRoomId ??
      incomingMessage?.roomId;

    if (chatRoomId == null) return;

    const rid = String(chatRoomId);

    dispatch(addMessage({chatRoomId: rid, message: incomingMessage}));

    const previewPayload = normalizePreviewMessage(incomingMessage, null);

    const authorId =
      incomingMessage?.authorId ??
      incomingMessage?.userId ??
      incomingMessage?.senderId ??
      incomingMessage?.author?.id;

    const isSelf = userId != null ? String(authorId) === String(userId) : false;

    dispatch(
      applyMessagePreview({
        chatRoomId: rid,
        message: previewPayload,
        isSelf,
      }),
    );

    dispatch(bumpListRevision());
  };
};

/**
 * ✅ WS에서 오는 room:read 브로드캐스트 처리
 * payload: { type:'room:read', chatRoomId, userId, lastReadAt }
 */
export const receiveReadPointerThunk = payload => {
  return async (dispatch, getState) => {
    const rid = String(payload?.chatRoomId ?? '');
    const readerId = payload?.userId;
    const lastReadAt = payload?.lastReadAt;

    if (!rid || readerId == null || !lastReadAt) return;

    // 1) 포인터 저장
    dispatch(
      applyReadPointer({
        chatRoomId: rid,
        userId: readerId,
        lastReadAt,
      }),
    );

    // 2) "내가 읽었다" 이벤트면 unreadCount 0으로
    const state = getState?.();
    const myId = state?.user?.userId ?? state?.auth?.userId ?? null;

    if (myId != null && String(myId) === String(readerId)) {
      dispatch(markRoomRead(rid));
    }
  };
};

/* =========================
 * 4) 읽음 처리 (REST + WS)
 * ========================= */
/**
 * ✅ REST 저장 (백엔드: POST /api/chatRoom/{chatRoomId}/read)
 * body: { lastReadAt: LocalDateTime }
 * - 프론트에서는 ISO 문자열로 보내도 Jackson이 받게 설정돼 있으면 통과
 * - 혹시 문제나면 "2025-12-28T12:34:56" 형태로 맞춰서 보내면 됨
 */
export const markReadRestThunk = (chatRoomId, lastReadAt) => {
  return async dispatch => {
    try {
      const token = await getToken();
      const apiUrl = `https://kinover.shop/api/chatRoom/${chatRoomId}/read`;

      await axios.post(
        apiUrl,
        {lastReadAt},
        {headers: {Authorization: `Bearer ${token}`}},
      );

      dispatch(markRoomRead(String(chatRoomId)));
      dispatch(
        applyReadPointer({
          chatRoomId: String(chatRoomId),
          userId: null, // REST만으로는 내 userId를 여기서 모를 수 있으니 null 허용
          lastReadAt,
        }),
      );
    } catch (e) {
      // 실패해도 UI는 WS로 커버될 수 있어서 조용히 둠(원하면 로그)
      dispatch(setMessageError({chatRoomId, error: e.message}));
    }
  };
};

/**
 * ✅ WS 읽음 전송: type=room:read
 * - 서버가 markRead 처리 + room 멤버들에게 브로드캐스트
 */
export const markReadWsThunk = (chatRoomId, lastReadAt) => {
  return async (dispatch, getState) => {
    const ok = isChatSocketOpen();
    if (!ok) return {ok: false};

    const sent = sendRead(chatRoomId, lastReadAt);
    if (!sent) return {ok: false};

    // 내가 보낸 read는 UI에서도 즉시 반영
    const state = getState?.();
    const myId = state?.user?.userId ?? state?.auth?.userId ?? null;

    if (myId != null) {
      dispatch(
        applyReadPointer({
          chatRoomId: String(chatRoomId),
          userId: myId,
          lastReadAt,
        }),
      );
      dispatch(markRoomRead(String(chatRoomId)));
    }

    return {ok: true};
  };
};

/**
 * ✅ 포인터 조회 (REST)
 * GET /api/chatRoom/{chatRoomId}/readPointers
 * 읽음표시(누가 어디까지 읽었는지) 초기 세팅용
 */
export const fetchReadPointersThunk = chatRoomId => {
  return async dispatch => {
    try {
      const token = await getToken();
      const apiUrl = `https://kinover.shop/api/chatRoom/${chatRoomId}/readPointers`;

      const res = await axios.get(apiUrl, {
        headers: {Authorization: `Bearer ${token}`},
      });

      // res.data: { chatRoomId, pointers: [{userId,lastReadAt}, ...] }
      dispatch(
        setReadPointers({
          chatRoomId: String(chatRoomId),
          pointers: res.data?.pointers ?? [],
        }),
      );
    } catch (e) {
      dispatch(setMessageError({chatRoomId, error: e.message}));
    }
  };
};
