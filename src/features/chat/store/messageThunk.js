// messageThunk.js
import axios from 'axios';
import {getToken} from '../../../utils/storage';
import {
  setMessageList,
  appendMessageList,
  setMessageLoading,
  setMessageError,
  setMessageFetched,
  addMessage,
} from './messageSlice';
import {applyMessagePreview, bumpListRevision} from './chatRoomSlice';

/** 공통: preview에 들어갈 최소 필드 보정 */
const normalizePreviewMessage = (msg, fallbackBody = null) => {
  const merged = {
    ...(msg || {}),
  };

  // createdAt
  merged.createdAt =
    merged.createdAt ||
    merged.sentAt ||
    merged.updatedAt ||
    fallbackBody?.createdAt ||
    new Date().toISOString();

  // content
  merged.content =
    merged.content ??
    fallbackBody?.content ??
    merged.latestMessageContent ??
    '';

  // messageType
  merged.messageType =
    merged.messageType ??
    fallbackBody?.messageType ??
    merged.type ??
    'text';

  // 미디어 필드(네 previewText가 imageUrls/mediaUrls를 보니까)
  if (merged.imageUrls == null && fallbackBody?.imageUrls != null) {
    merged.imageUrls = fallbackBody.imageUrls;
  }
  if (merged.mediaUrls == null && fallbackBody?.mediaUrls != null) {
    merged.mediaUrls = fallbackBody.mediaUrls;
  }

  return merged;
};

/** ✅ 초기 메시지 fetch (해당 방에만 저장) */
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

      // 목록이 리렌더 안 먹는 경우 대비
      dispatch(bumpListRevision());
    } catch (error) {
      dispatch(setMessageError({chatRoomId, error: error.message}));
    } finally {
      dispatch(setMessageFetched({chatRoomId, isFetched: true}));
      dispatch(setMessageLoading({chatRoomId, isLoading: false}));
    }
  };
};

/** ✅ 이전 메시지 더 불러오기 (해당 방에만 append) */
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

/**
 * ✅ 서버 REST로 보내는 send
 * - 텍스트/이미지/비디오 어떤 방식이든 “내가 보낸 것”으로 preview 갱신
 * - userId를 받아두면 나중에 구조가 바뀌어도 isSelf가 안 꼬임
 */
export const sendMessageThunk = (messageBody, chatRoomId, userId) => {
  return async dispatch => {
    dispatch(setMessageLoading({chatRoomId, isLoading: true}));

    try {
      const token = await getToken();
      const apiUrl = 'https://kinover.shop/api/chatRoom/messages/send';

      const res = await axios.post(apiUrl, messageBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const msg = res.data;

      // ✅ 방별 메시지 저장
      dispatch(addMessage({chatRoomId, message: msg}));

      // ✅ preview용 보정
      const previewPayload = normalizePreviewMessage(msg, messageBody);

      // ✅ isSelf 판별(가능하면 명확히)
      // 서버 msg에 authorId/userId가 오면 그걸 우선 사용
      const authorId =
        msg?.authorId ?? msg?.userId ?? messageBody?.authorId ?? messageBody?.userId;

      const isSelf =
        userId != null
          ? String(authorId) === String(userId) || authorId == null // authorId 없으면 일단 self로 취급(보낸 thunk니까)
          : true;

      dispatch(
        applyMessagePreview({
          chatRoomId: String(chatRoomId),
          message: previewPayload,
          isSelf,
        }),
      );

      // ✅ 방 목록 화면 리렌더 보수 처리
      dispatch(bumpListRevision());

      return msg;
    } catch (e) {
      dispatch(setMessageError({chatRoomId, error: e.message}));
      throw e;
    } finally {
      dispatch(setMessageLoading({chatRoomId, isLoading: false}));
    }
  };
};

/**
 * ✅ (선택) WebSocket 수신 메시지 처리용
 * - onMessage에서 이 thunk만 호출하면:
 *   1) 방별 메시지 저장
 *   2) 목록 preview 갱신
 *   3) unreadCount 증가(내 메시지면 증가 X)
 */
export const receiveMessageThunk = (incomingMessage, userId) => {
  return async dispatch => {
    const chatRoomId =
      incomingMessage?.chatRoomId ??
      incomingMessage?.chatRoom?.chatRoomId ??
      incomingMessage?.roomId;

    if (chatRoomId == null) return;

    const rid = String(chatRoomId);

    // ✅ 방별 저장
    dispatch(addMessage({chatRoomId: rid, message: incomingMessage}));

    // ✅ preview 보정
    const previewPayload = normalizePreviewMessage(incomingMessage, null);

    // ✅ isSelf 판별(여기가 진짜 중요)
    const authorId =
      incomingMessage?.authorId ??
      incomingMessage?.userId ??
      incomingMessage?.senderId ??
      incomingMessage?.author?.id;

    const isSelf =
      userId != null ? String(authorId) === String(userId) : false;

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
