import React from 'react';
import {View, StyleSheet} from 'react-native';
import ReceiveChat from './receiveChat';
import SendChat from './sendChat';
import ReceiveKinoChat from './receiveKinoChat';
import SendKinoChat from './sendKinoChat';
import {useNavigation} from '@react-navigation/native';
import {useState} from 'react';
import {useLayoutEffect} from 'react';
import ChatSettings from './chatSetting';
import { useEffect } from 'react';
import {RenderHeaderRightChatSetting} from '../../../navigation/tabHeaderHelpers';
export default function ChatMessageItem({
  chatRoom,
  message,
  currentUserId,
  isKino = false,
  isSameSender = false,
}) {
  const isMe = message.senderId === currentUserId;
  const marginBottom = isSameSender ? 15 : 25;

  let ChatComponent;

  const navigation = useNavigation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RenderHeaderRightChatSetting setIsSettingsOpen={setIsSettingsOpen} />
      ),
    });
  }, [navigation]);

  if (isMe) {
    ChatComponent = isKino ? (
      <SendKinoChat
        message={message.content}
        chatTime={message.createdAt}
        style={{marginBottom}}
      />
    ) : (
      <SendChat
        message={message.content}
        chatTime={message.createdAt}
        style={{marginBottom}}
      />
    );
  } else {
    ChatComponent = isKino ? (
      <ReceiveKinoChat
        userName={message.senderName}
        userProfileImage={message.senderImage}
        message={message.content}
        chatTime={message.createdAt}
        style={{marginBottom}}
      />
    ) : (
      <ReceiveChat
        userName={message.senderName}
        userProfileImage={message.senderImage}
        message={message.content}
        chatTime={message.createdAt}
        style={{marginBottom}}
      />
    );
  }

  return (
    <>
      <View
        style={[styles.wrapper, isMe ? styles.alignRight : styles.alignLeft]}>
        {ChatComponent}
      </View>
      <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        chatRoomId={chatRoom.chatRoomId}
        navigation={navigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: '5%',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
});
