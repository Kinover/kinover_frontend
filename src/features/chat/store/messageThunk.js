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
 * ✅ 서버 REST로 보내는 send(너 기존 코드 유지하면서 “방별 저장”만 정리)
 * - 너는 지금 WebSocket으로 이미지/텍스트도 보내는 구조라면 이 thunk는 “안 써도 됨”
 * - 만약 텍스트는 REST로 보내는 구조면 사용
 */
export const sendMessageThunk = (messageBody, chatRoomId) => {
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

      // ✅ 여기 핵심: preview용 최소 필드 보정
      const previewPayload = {
        ...msg,
        createdAt: msg?.createdAt ?? new Date().toISOString(),
        content: msg?.content ?? messageBody?.content ?? '',
        messageType: msg?.messageType ?? messageBody?.messageType ?? 'text',
      };

      // ✅ 방 목록 미리보기 즉시 갱신
      dispatch(
        applyMessagePreview({
          chatRoomId: String(chatRoomId),
          message: previewPayload,
          isSelf: true,
        }),
      );

      // ✅ 방 목록 화면이 리렌더 안 먹을 때 대비(보수적으로)
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
