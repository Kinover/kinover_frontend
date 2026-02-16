// FamilyChatRoom.jsx
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import ChatRoomScreenTemplate from './ChatRoomScreenTemplate';

export default function KinoChatRoom({ route }) {
  const { chatRoom, userId } = route.params || {};
  const navigation = useNavigation();

  return <ChatRoomScreenTemplate chatRoom={chatRoom} userId={userId} isKino={true} navigation={navigation} />;
}
