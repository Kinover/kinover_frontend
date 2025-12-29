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
      return res.data; // { lastCheckedAt, notifications }
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
      return res.data?.hasUnread ?? false;
    } catch (error) {
      console.error('🔴 안읽은 알림 여부 조회 실패:', error);
      return rejectWithValue(
        error.response?.data || '안읽은 알림 여부 조회 실패',
      );
    }
  },
);

/**
 * ✅ 숫자 뱃지용 unreadCount
 * 백엔드 추가 API: GET /api/user/notifications/unread-count
 * 응답 예시: { unreadCount: 3 }
 */
export const fetchUnreadCountThunk = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const res = await axios.get(`${BASE}/user/notifications/unread-count`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      return Number(res.data?.unreadCount ?? 0);
    } catch (error) {
      console.error('🔴 안읽은 알림 개수 조회 실패:', error);
      return rejectWithValue(
        error.response?.data || '안읽은 알림 개수 조회 실패',
      );
    }
  },
);
