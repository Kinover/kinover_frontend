import axios from 'axios';
import {getToken} from '../../utils/storage';
import {
  setMessageList,
  appendMessageList,
  setMessageLoading,
  setMessageError,
  setSendMessage,
} from '../slices/messageSlice';

// ✅ 초기 메시지 로딩 (덮어쓰기)
export const fetchMessageThunk = (chatRoomId, before = null, limit = 20) => {
  return async dispatch => {
    dispatch(setMessageLoading(true));
    try {
      const token = await getToken();

      let apiUrl = `https://kinover.shop/api/chatRoom/${chatRoomId}/messages/fetch?limit=${limit}`;
      if (before) {
        apiUrl += `&before=${encodeURIComponent(before)}`;
      }

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('fetchMesssage', response.data);
      dispatch(setMessageList(response.data)); // ✅ 최신 → 오래된 순서 그대로
    } catch (error) {
      dispatch(setMessageError(error.message));
    } finally {
      dispatch(setMessageLoading(false));
    }
  };
};

// ✅ 추가 메시지 로딩 (뒤에 추가)
export const fetchMoreMessagesThunk = (chatRoomId, beforeTime) => {
  return async dispatch => {
    try {
      const token = await getToken();
      const limit = 20;
      let apiUrl = `https://kinover.shop/api/chatRoom/${chatRoomId}/messages/fetch?limit=${limit}&before=${encodeURIComponent(
        beforeTime,
      )}`;

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('fetchMoreMesssage', response.data);

      dispatch(appendMessageList(response.data)); // ✅ 뒤에 붙이기
      return {payload: response.data};
    } catch (error) {
      console.error('추가 메시지 로딩 실패:', error);
      return {payload: []};
    }
  };
};

// ✅ 메시지 전송 후 최신 메시지 다시 로딩
export const sendMessageThunk = (message, chatRoomId) => {
  return async dispatch => {
    dispatch(setMessageLoading(true));
    try {
      const apiUrl = 'https://kinover.shop/api/chatRoom/messages/send';
      const token = await getToken();

      const response = await axios.post(apiUrl, message, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setSendMessage(response.data));
      dispatch(fetchMessageThunk(chatRoomId)); // ✅ 오타 수정
    } catch (error) {
      dispatch(setMessageError(error.message));
    } finally {
      dispatch(setMessageLoading(false));
    }
  };
};
