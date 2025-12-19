// redux/thunk/notificationThunk.js
import {createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import {getToken} from '../../../utils/storage';

const BASE = 'https://kinover.shop/api';

export const fetchNotificationsThunk = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const res = await axios.get(`${BASE}/user/notifications`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      // res.data 가 { lastCheckedAt, notifications } 형태라고 가정
      return res.data;
    } catch (error) {
      console.error('🔴 알림 조회 실패:', error);
      return rejectWithValue(error.response?.data || '알림 조회 실패');
    }
  },
);

export const fetchHasUnreadThunk = createAsyncThunk(
  'notification/fetchHasUnread',
  async (_, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const res = await axios.get(`${BASE}/user/notifications/unread`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      // { hasUnread: true/false }
      return res.data?.hasUnread ?? false;
    } catch (error) {
      console.error('🔴 안읽은 알림 여부 조회 실패:', error);
      return rejectWithValue(
        error.response?.data || '안읽은 알림 여부 조회 실패',
      );
    }
  },
);
