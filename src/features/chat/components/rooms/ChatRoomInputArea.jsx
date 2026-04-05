// 채팅방 입력창 영역 (ChatInput 래퍼)
import React from 'react';
import ChatInput from '../input/chatInput';

export default function ChatRoomInputArea({
  chatRoom,
  userId,
  enableMediaPicker,
  mentionUsers,
  enableMention = true,
}) {
  return (
    <ChatInput
      chatRoom={chatRoom}
      userId={userId}
      enableMediaPicker={enableMediaPicker}
      mentionUsers={mentionUsers}
      enableMention={enableMention}
    />
  );
}
