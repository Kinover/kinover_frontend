// store/chatRoomSelectors.ts
export const selectChatRoomKinoTypeById =
  (chatRoomId) => (state) => {
    return state.chatRoom?.byId?.[chatRoomId]?.kinoType; // ✅ 너 구조에 맞게 여기만 수정
  };
