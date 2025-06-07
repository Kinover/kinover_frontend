// FamilyChatRoom.jsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import ChatRoomScreenTemplate from '../../../components/chatRoomScreenTemplate';

export default function ChatRoom({ route }) {
  const { chatRoom, user } = route.params || {};
  const navigation = useNavigation();

  return <ChatRoomScreenTemplate chatRoom={chatRoom} user={user} isKino={false} navigation={navigation} />;
}
