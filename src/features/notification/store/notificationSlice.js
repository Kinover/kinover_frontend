// redux/slices/notificationSlice.js
import {createSlice} from '@reduxjs/toolkit';
import {
  fetchNotificationsThunk,
  fetchHasUnreadThunk,
  fetchUnreadCountThunk,
} from './notificationThunk';

const initialState = {
  lastCheckedAt: null,
  notifications: [],
  isLoading: false,
  error: null,

  // ✅ 빨간점용
  hasUnread: false,

  // ✅ 숫자 뱃지용 (서버 unreadCount)
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

    // ✅ 빨간점 직접 제어 (포그라운드 푸시 받았을 때 등)
    setHasUnread: (state, action) => {
      state.hasUnread = !!action.payload;
      // hasUnread=true면 unreadCount도 최소 1로 보정(UX용)
      if (state.hasUnread && state.unreadCount < 1) state.unreadCount = 1;
      if (!state.hasUnread && state.unreadCount !== 0) state.unreadCount = 0;
    },

    // ✅ 숫자 뱃지 직접 제어(필요할 때)
    setUnreadCount: (state, action) => {
      const n = toInt(action.payload);
      state.unreadCount = n;
      state.hasUnread = n > 0;
    },
  },

  extraReducers: builder => {
    builder
      // =========================
      // ✅ 알림 리스트 조회 (알림화면 진입)
      // =========================
      .addCase(fetchNotificationsThunk.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        const payload = action.payload || {};
        state.lastCheckedAt = payload.lastCheckedAt ?? state.lastCheckedAt;
        state.notifications = payload.notifications || [];

        // ✅ 알림화면 들어오면 백에서 lastCheckedAt 갱신 = 읽음 확정
        // → 빨간점/숫자뱃지 모두 0으로
        state.hasUnread = false;
        state.unreadCount = 0;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '알림 조회 실패';
      })

      // =========================
      // ✅ 빨간점 여부 조회
      // =========================
      .addCase(fetchHasUnreadThunk.fulfilled, (state, action) => {
        const hasUnread = !!action.payload;
        state.hasUnread = hasUnread;

        // ✅ 서버 hasUnread=true인데 unreadCount가 아직 0이면 1로 보정(UX)
        if (hasUnread && state.unreadCount < 1) state.unreadCount = 1;

        // ✅ hasUnread=false면 unreadCount도 0으로 정리(불일치 방지)
        if (!hasUnread) state.unreadCount = 0;
      })
      .addCase(fetchHasUnreadThunk.rejected, () => {
        // 뱃지/빨간점 체크 실패는 조용히 무시
      })

      // =========================
      // ✅ 숫자 뱃지(unreadCount) 조회
      // =========================
      .addCase(fetchUnreadCountThunk.fulfilled, (state, action) => {
        const n = toInt(action.payload);
        state.unreadCount = n;
        state.hasUnread = n > 0;
      })
      .addCase(fetchUnreadCountThunk.rejected, () => {
        // 숫자 뱃지 체크 실패도 조용히 무시
      });
  },
});

export const {
  clearNotifications,
  setHasUnread,
  setUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;
