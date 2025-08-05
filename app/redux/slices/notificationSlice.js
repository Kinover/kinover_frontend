// redux/slices/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fetchNotificationsThunk } from '../thunk/notificationThunk';

const initialState = {
  lastCheckedAt: null,
  notifications: [],
  isLoading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
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
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
