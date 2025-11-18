// redux/slices/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fetchNotificationsThunk } from './notificationThunk';

const initialState = {
  lastCheckedAt: null,
  notifications: [],
  isLoading: false,
  error: null,
  hasUnread: false, // ✅ 새 알림 여부
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setHasUnread: (state, action) => {
      state.hasUnread = action.payload; // ✅ 새 알림 여부 수동 설정
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastCheckedAt = action.payload.lastCheckedAt;
        state.notifications = action.payload.notifications;

        // ✅ 새 알림 여부 자동 반영
        state.hasUnread = action.payload.notifications.some(
          (n) => !n.read, // 서버에서 read 여부를 내려주면 이렇게 체크
        );
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearNotifications, setHasUnread } = notificationSlice.actions;
export default notificationSlice.reducer;
