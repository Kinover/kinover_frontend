// FamilyChatRoom.jsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import ChatRoomScreenTemplate from './chatRoomScreenTemplate';

export default function ChatRoom({ route }) {
  const { chatRoom, title, userId } = route.params || {};
  const navigation = useNavigation();

  return (
    <ChatRoomScreenTemplate
      chatRoom={chatRoom}
      title={title}   // <-- 그냥 넘기기만
      userId={userId}
      isKino={false}
      navigation={navigation}
    />
  );
}
