// src/features/notification/store/notificationThunk.js
import {createAsyncThunk} from '@reduxjs/toolkit';
import {applyAppBadgeCount} from 'utils/appBadge';
import {notificationApi} from '../services/notificationApi';

// 채팅 unread 총합 selector
import {selectChatUnreadTotal} from 'features/chat/store/chatRoomSelector';

/**
 * 알림 목록 조회
 * GET /api/user/notifications
 * 응답: { lastCheckedAt, notifications }
 */
export const fetchNotificationsThunk = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, {rejectWithValue, dispatch}) => {
    try {
      const req = dispatch(
        notificationApi.endpoints.getNotifications.initiate(undefined, {
          forceRefetch: true,
        }),
      );
      const data = await req.unwrap();
      req.unsubscribe();
      return data;
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      console.error('🔴 알림 조회 실패:', {status, data});
      return rejectWithValue(data || '알림 조회 실패');
    }
  },
);

/**
 * 안읽은 알림 존재 여부
 * GET /api/user/notifications/unread
 * 응답: { hasUnread: true/false }
 */
export const fetchHasUnreadThunk = createAsyncThunk(
  'notification/fetchHasUnread',
  async (_, {rejectWithValue, dispatch}) => {
    try {
      const req = dispatch(
        notificationApi.endpoints.getHasUnread.initiate(undefined, {
          forceRefetch: true,
        }),
      );
      const data = await req.unwrap();
      req.unsubscribe();
      return data?.hasUnread ?? false;
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      console.error('🔴 안읽은 알림 여부 조회 실패:', {status, data});
      return rejectWithValue(data || '안읽은 알림 여부 조회 실패');
    }
  },
);

/**
 * bell 숫자 뱃지용 unreadCount
 * GET /api/user/notifications/unread-count
 * 응답: { unreadCount: 3 }
 */
export const fetchUnreadCountThunk = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, {rejectWithValue, dispatch}) => {
    try {
      const req = dispatch(
        notificationApi.endpoints.getUnreadCount.initiate(undefined, {
          forceRefetch: true,
        }),
      );
      const data = await req.unwrap();
      req.unsubscribe();
      return Number(data?.unreadCount ?? 0);
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      console.error('🔴 안읽은 알림 개수 조회 실패:', {status, data});
      return rejectWithValue(data || '안읽은 알림 개수 조회 실패');
    }
  },
);

/**
 * 알림 읽음 처리
 * POST /api/user/notifications/mark-read
 * 응답 예: { lastCheckedAt, hasUnread:false, unreadCount:0 }
 */
export const markNotificationsReadThunk = createAsyncThunk(
  'notification/markRead',
  async (_, {rejectWithValue, dispatch}) => {
    try {
      const req = dispatch(
        notificationApi.endpoints.markNotificationsRead.initiate(),
      );
      const data = await req.unwrap();
      req.unsubscribe();
      return data;
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      console.error('🔴 알림 읽음 처리 실패:', {status, data});
      return rejectWithValue(data || '알림 읽음 처리 실패');
    }
  },
);

/**
 * 앱 아이콘 뱃지 동기화
 * - total = 채팅 unread 총합 + 알림 unreadCount
 * - 알림 unreadCount는 서버 기준으로 다시 땡김
 */
export const syncAppBadgeThunk = createAsyncThunk(
  'notification/syncAppBadge',
  async (_, {dispatch, getState}) => {
 // 1) 알림 unreadCount는 서버 기준
    const action = await dispatch(fetchUnreadCountThunk());
    const notiCount = Number(action?.payload ?? 0) || 0;

 // 2) 채팅 unread 총합은 store 기준
    const state = getState();
    const chatTotal = Number(selectChatUnreadTotal(state) ?? 0) || 0;

    const total = chatTotal + notiCount;

    await applyAppBadgeCount(total);

    return {total, chatTotal, notiCount};
  },
);
