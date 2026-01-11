// redux/slices/notificationSlice.js
import {createSlice} from '@reduxjs/toolkit';
import {
  fetchNotificationsThunk,
  fetchHasUnreadThunk,
  fetchUnreadCountThunk,
  markNotificationsReadThunk, // ✅ 추가
} from './notificationThunk';

const initialState = {
  lastCheckedAt: null,
  notifications: [],
  isLoading: false,
  error: null,

  // ✅ bell(종) 전용
  hasUnread: false,
  unreadCount: 0,
};

const toInt = v => {
  const n = Number(v);
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotifications: state => {
      state.notifications = [];
      state.lastCheckedAt = null;
      state.hasUnread = false;
      state.unreadCount = 0;
      state.isLoading = false;
      state.error = null;
    },

    // ✅ bell(종) 직접 제어
    setHasUnread: (state, action) => {
      state.hasUnread = !!action.payload;
      // bell hasUnread가 true인데 count가 0으로 오는 경우 UX 보정(원치 않으면 삭제해도 됨)
      if (state.hasUnread && state.unreadCount < 1) state.unreadCount = 1;
      if (!state.hasUnread) state.unreadCount = 0;
    },

    setUnreadCount: (state, action) => {
      const n = toInt(action.payload);
      state.unreadCount = n;
      state.hasUnread = n > 0;
    },
  },

  extraReducers: builder => {
    builder
      // ✅ 알림 리스트 조회(조회만)
      .addCase(fetchNotificationsThunk.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        const payload = action.payload || {};
        state.lastCheckedAt = payload.lastCheckedAt ?? state.lastCheckedAt;
        state.notifications = payload.notifications || [];

        // ❌ 여기서 읽음 확정(0 처리)하면 서버와 불일치 가능
        // ✅ 읽음 확정은 markNotificationsReadThunk.fulfilled에서만 처리
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '알림 조회 실패';
      })

      // ✅ 알림 읽음 확정(서버 mark-read 성공 시점)
      .addCase(markNotificationsReadThunk.fulfilled, (state, action) => {
        const payload = action.payload || {};

        // 서버가 lastCheckedAt 문자열을 주는 구조라면 그대로 저장
        // (원하면 Date 변환은 selector에서 처리 추천)
        state.lastCheckedAt = payload.lastCheckedAt ?? state.lastCheckedAt;

        state.hasUnread = false;
        state.unreadCount = 0;
      })
      .addCase(markNotificationsReadThunk.rejected, () => {})

      // ✅ bell 빨간점 여부 조회
      .addCase(fetchHasUnreadThunk.fulfilled, (state, action) => {
        const hasUnread = !!action.payload;
        state.hasUnread = hasUnread;
        if (hasUnread && state.unreadCount < 1) state.unreadCount = 1;
        if (!hasUnread) state.unreadCount = 0;
      })
      .addCase(fetchHasUnreadThunk.rejected, () => {})

      // ✅ bell 숫자 뱃지(unreadCount) 조회
      .addCase(fetchUnreadCountThunk.fulfilled, (state, action) => {
        const n = toInt(action.payload);
        state.unreadCount = n;
        state.hasUnread = n > 0;
      })
      .addCase(fetchUnreadCountThunk.rejected, () => {});
  },
});

export const {clearNotifications, setHasUnread, setUnreadCount} =
  notificationSlice.actions;

export default notificationSlice.reducer;
