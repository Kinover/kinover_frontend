// FamilyChatRoom.jsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import ChatRoomScreenTemplate from './chatRoomScreenTemplate';

export default function ChatRoom({ route }) {
  const { chatRoom, userId } = route.params || {};
  const navigation = useNavigation();

  return <ChatRoomScreenTemplate chatRoom={chatRoom} userId={userId} isKino={false} navigation={navigation} />;
}
