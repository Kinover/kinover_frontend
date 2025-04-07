// fetchChatRoomListThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import {
  setChatRoomList,
  setChatRoomLoading,
  setChatRoomError,
} from '../slices/chatRoomSlice';

export const fetchChatRoomListThunk = (familyId, userId) => {
  return async (dispatch) => {
    dispatch(setChatRoomLoading(true));
    try {
      const apiUrl = `http://43.200.47.242:9090/api/chatRoom/${familyId}/${userId}`;

      const token = await getToken();

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setChatRoomList(response.data));
      console.log('✅ 채팅방 목록 불러오기 성공:', response.data);
    } catch (error) {
      console.error('❌ 채팅방 목록 불러오기 실패:', error);
      dispatch(setChatRoomError(error.message));
    } finally {
      dispatch(setChatRoomLoading(false));
    }
  };
};
