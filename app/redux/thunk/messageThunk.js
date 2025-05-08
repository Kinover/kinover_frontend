// fetchMessageThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import {
  setMessageList,
  setMessageLoading,
  setMessageError,
} from '../slices/messageSlice';

export const fetchMessageThunk = (chatRoomId) => {
  return async (dispatch) => {
    dispatch(setMessageLoading(true));
    try {
      const apiUrl = `http://43.200.47.242:9090/api/chatRoom/${chatRoomId}/messages/fetch`;

      const token = await getToken();

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response.data);

      dispatch(setMessageList(response.data));
    } catch (error) {
      dispatch(setMessageError(error.message));
    } finally {
      dispatch(setMessageLoading(false));
    }
  };
};


export const sendMessageThunk = (message, chatRoomId) => {
    return async (dispatch) => {
      dispatch(setMessageLoading(true));
      try {
        const apiUrl ='http://43.200.47.242:9090/api/chatRoom/messages/send';
  
        const token = await getToken();
  
        const response = await axios.post(apiUrl, message, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
  
        dispatch(setSendMessage(response.data));
  
        // 메시지 전송 후 최신 메시지 목록 다시 불러오기
        dispatch(fetchMessageThunk(chatRoomId));
      } catch (error) {
        dispatch(setMessageError(error.message));
      } finally {
        dispatch(setMessageLoading(false));
      }
    };
  };