// src/features/notification/store/notificationThunk.js
import {createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import {getToken} from '../../../utils/storage';
import {applyAppBadgeCount} from '../../../utils/appBadge';

// ✅ 채팅 unread 총합 selector import
// 경로가 다르면 여기만 맞춰줘!
import {selectChatUnreadTotal} from '../../chat/store/chatRoomSelector';

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
 * ✅ bell 숫자 뱃지용 unreadCount
 * GET /api/user/notifications/unread-count
 * 응답: { unreadCount: 3 }
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

/**
 * ✅ 알림 읽음 처리(서버 lastNotificationCheckedAt 갱신)
 * POST /api/user/notifications/mark-read
 * 응답 예: { lastCheckedAt, hasUnread:false, unreadCount:0 }
 */
export const markNotificationsReadThunk = createAsyncThunk(
  'notification/markRead',
  async (_, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const res = await axios.post(
        `${BASE}/user/notifications/mark-read`,
        {},
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );
      return res.data;
    } catch (error) {
      console.error('🔴 알림 읽음 처리 실패:', error);
      return rejectWithValue(
        error.response?.data || '알림 읽음 처리 실패',
      );
    }
  },
);

/**
 * ✅ 앱 아이콘 뱃지 동기화 (핵심)
 * - 앱 뱃지 = 채팅 unread 총합 + 알림 unreadCount
 * - 어디서든 이 thunk 한번 호출하면 뱃지 정확히 맞춰짐
 */
export const syncAppBadgeThunk = createAsyncThunk(
  'notification/syncAppBadge',
  async (_, {dispatch, getState}) => {
    // 1) 알림 unreadCount는 서버 기준으로
    const action = await dispatch(fetchUnreadCountThunk());
    const notiCount = Number(action?.payload ?? 0) || 0;

    // 2) 채팅 unread 총합은 store(chatRoomList) 기준으로
    const state = getState();
    const chatTotal = Number(selectChatUnreadTotal(state) ?? 0) || 0;

    const total = chatTotal + notiCount;

    await applyAppBadgeCount(total);

    return {total, chatTotal, notiCount};
  },
);
