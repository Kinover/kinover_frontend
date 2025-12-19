// redux/slices/notificationSlice.js
import {createSlice} from '@reduxjs/toolkit';
import {fetchNotificationsThunk, fetchHasUnreadThunk} from './notificationThunk';

const initialState = {
  lastCheckedAt: null,
  notifications: [],
  isLoading: false,
  error: null,
  hasUnread: false, // ✅ 벨 빨간점 전용
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotifications: state => {
      state.notifications = [];
      state.lastCheckedAt = null;
      state.hasUnread = false;
      state.isLoading = false;
      state.error = null;
    },

    // 필요하면 외부에서 강제로 빨간점만 조절할 때 사용
    setHasUnread: (state, action) => {
      state.hasUnread = !!action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // -------------------------
      // 알림 리스트 조회(=알림화면 진입)
      // 백엔드에서 이 호출 자체가 "읽음 처리"를 확정함
      // -------------------------
      .addCase(fetchNotificationsThunk.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;

        const payload = action.payload || {};
        state.lastCheckedAt = payload.lastCheckedAt ?? state.lastCheckedAt;
        state.notifications = payload.notifications || [];

        // ✅ 알림화면 들어온 순간 읽음 확정이므로 빨간점은 끔
        state.hasUnread = false;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '알림 조회 실패';
      })

      // -------------------------
      // 벨 빨간점 여부 조회(=unread 체크)
      // -------------------------
      .addCase(fetchHasUnreadThunk.pending, state => {
        // 굳이 로딩 돌릴 필요 없으면 주석 처리해도 됨
        // state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHasUnreadThunk.fulfilled, (state, action) => {
        state.hasUnread = !!action.payload;
        // state.isLoading = false;
      })
      .addCase(fetchHasUnreadThunk.rejected, (state, action) => {
        // state.isLoading = false;
        state.error = action.payload || '안읽은 알림 여부 조회 실패';
      });
  },
});

export const {clearNotifications, setHasUnread} = notificationSlice.actions;
export default notificationSlice.reducer;
