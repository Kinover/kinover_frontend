// chatRoomSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialChatRoomState = {
  chatRoomList: [],
  loading: false,
  error: null,
};

const chatRoomSlice = createSlice({
  name: 'chatRoom',
  initialState: initialChatRoomState,
  reducers: {
    setChatRoomList(state, action) {
      state.chatRoomList = action.payload;
    },
    setChatRoomLoading(state, action) {
      state.loading = action.payload;
    },
    setChatRoomError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setChatRoomList, setChatRoomLoading, setChatRoomError } = chatRoomSlice.actions;
export default chatRoomSlice.reducer;
