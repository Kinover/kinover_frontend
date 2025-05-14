import {createSlice} from '@reduxjs/toolkit';

const messageSlice = createSlice({
  name: 'message',
  initialState: {
    messageList: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    // ✅ 전체 초기 메시지 설정
    addMessage: (state, action) => {
      state.messageList.unshift(action.payload);
    },

    setMessageList: (state, action) => {
      state.messageList = action.payload.reverse();
    },

    // ✅ 앞쪽에 추가 (이전 메시지) + 중복 제거
    appendMessageList: (state, action) => {
      const existingIds = new Set(state.messageList.map(m => m.messageId));
      const newMessages = action.payload
        .filter(m => !existingIds.has(m.messageId))
        .reverse();

      state.messageList = [...state.messageList,...newMessages ];
      console.log('메세지리스트', state.messageList);
    },

    // ✅ 실시간 전송 메시지 추가 + 중복 제거
    setSendMessage: (state, action) => {
      const exists = state.messageList.some(
        m => m.messageId === action.payload.messageId,
      );
      if (!exists) {
        state.messageList.push(action.payload);
      }
    },

    // ✅ 로딩 상태 설정
    setMessageLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // ✅ 에러 상태 설정
    setMessageError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setMessageList,
  appendMessageList,
  setSendMessage,
  setMessageLoading,
  setMessageError,
  addMessage,
} = messageSlice.actions;

export default messageSlice.reducer;
