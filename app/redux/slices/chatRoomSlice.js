// chatRoomSlice.js
import {createSlice} from '@reduxjs/toolkit';

const initialChatRoomState = {
  chatRoomList: [],
  chatRoomUsers: [],
  loading: false,
  error: null,
};

const chatRoomSlice = createSlice({
  name: 'chatRoom',
  initialState: initialChatRoomState,
  reducers: {
    setChatRoomList(state, action) {
      state.chatRoomList = [...action.payload]; // ✅ 레퍼런스 변경 확실하게
    },
    setChatRoomUsers: (state, action) => {
      state.chatRoomUsers = [...action.payload]; // ✅ 레퍼런스 변경 확실하게
    },

    setChatRoomLoading(state, action) {
      state.loading = action.payload;
    },
    setChatRoomError(state, action) {
      state.error = action.payload;
    },
    updateLatestMessage: (state, action) => {
      const {chatRoomId, message} = action.payload;
      const room = state.chatRoomList.find(
        room => room.chatRoomId === chatRoomId,
      );
      if (room) {
        room.latestMessageContent = message.content;
        room.latestMessageTime = message.createdAt;
      }
    },
    updateChatRoomNameInList: (state, action) => {
      const {chatRoomId, newRoomName} = action.payload;

      state.chatRoomList = state.chatRoomList.map(room =>
        room.chatRoomId === chatRoomId
          ? {...room, roomName: newRoomName}
          : room,
      );
    },
  },
});

export const {
  setChatRoomList,
  setChatRoomUsers,
  setChatRoomLoading,
  setChatRoomError,
  updateLatestMessage,
  updateChatRoomNameInList, // ✅ 요거 추가!
} = chatRoomSlice.actions;

export default chatRoomSlice.reducer;
