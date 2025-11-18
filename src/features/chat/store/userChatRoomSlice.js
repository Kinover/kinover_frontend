// userChatRoomSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userChatRoomId: '',
  joinedAt: '',
  chatRoomId: '',
  userId: '',
  loading: false,
  error: null,
};

const userChatRoomSlice = createSlice({
  name: 'userChatRoom',
  initialState,
  reducers: {
    setUserChatRoom(state, action) {
      const { userChatRoomId, joinedAt, chatRoomId, userId } = action.payload || {};
      state.userChatRoomId = userChatRoomId ?? state.userChatRoomId;
      state.joinedAt = joinedAt ?? state.joinedAt;
      state.chatRoomId = chatRoomId ?? state.chatRoomId;
      state.userId = userId ?? state.userId;
    },
    setUserChatRoomLoading(state, action) {
      state.loading = action.payload;
    },
    setUserChatRoomError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setUserChatRoom,
  setUserChatRoomLoading,
  setUserChatRoomError,
} = userChatRoomSlice.actions;

export default userChatRoomSlice.reducer;
