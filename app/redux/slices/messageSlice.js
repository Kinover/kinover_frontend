// messageSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialMessageState = {
  messageList: [],
  sendMessage: {},
  loading: false,
  error: null,
};

const messageSlice = createSlice({
  name: 'message',
  initialState: initialMessageState,
  reducers: {
    setMessageList(state, action) {
      state.messageList = action.payload;
    },
    setSendMessage(state, action) {
      state.sendMessage = action.payload;
    },
    setMessageLoading(state, action) {
      state.loading = action.payload;
    },
    setMessageError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setMessageList,
  setSendMessage,
  setMessageLoading,
  setMessageError,
} = messageSlice.actions;

export default messageSlice.reducer;
