// redux/thunk/notificationThunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getToken } from '../../utils/storage'; // 로컬 스토리지나 AsyncStorage에서 토큰 불러오는 함수

export const fetchNotificationsThunk = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getToken();
      const response = await axios.get('https://kinover.shop/api/user/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('🔴 알림 조회 실패:', error);
      return rejectWithValue(error.response?.data || '알림 조회 실패');
    }
  }
);
