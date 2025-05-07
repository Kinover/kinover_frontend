import React, {useState} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import ReceiveChat from './receiveChat';
import SendChat from './sendChat';
import ReceiveKinoChat from './receiveKinoChat';
import SendKinoChat from './sendKinoChat';
import {useLayoutEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {RenderHeaderRightChatSetting} from '../../../navigation/tabHeaderHelpers';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import ChatSettings from './chatSetting';

export default function ChatScreen({chatRoom, user, messageList = []}) {
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };
  const navigation = useNavigation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RenderHeaderRightChatSetting setIsSettingsOpen={setIsSettingsOpen} />
      ),
    });
  }, [navigation]);

  const sortedMessages = [...messageList].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  return (
    <View style={styles.chatContainer}>
      {sortedMessages.map((message, index) => {
        const currentMessageDate = new Date(message.createdAt).toDateString();
        const prevMessageDate =
          index > 0
            ? new Date(sortedMessages[index - 1].createdAt).toDateString()
            : null;

        const isSameSender =
          index > 0 && sortedMessages[index - 1].senderId === message.senderId;

        return (
          <React.Fragment key={message.messageId}>
            {prevMessageDate !== currentMessageDate && (
              <Text style={styles.dateSeparator}>
                {formatDate(message.createdAt)}
              </Text>
            )}

            {message.senderId !== user.userId ? (
              chatRoom.kino ? (
                <ReceiveKinoChat
                  userName={message.senderName}
                  userProfileImage={message.senderImage}
                  message={message.content}
                  chatTime={message.createdAt}
                  style={{marginBottom: isSameSender ? 15 : 25}}
                />
              ) : (
                <ReceiveChat
                  userName={message.senderName}
                  userProfileImage={message.senderImage}
                  message={message.content}
                  chatTime={message.createdAt}
                  style={{marginBottom: isSameSender ? 15 : 25}}
                />
              )
            ) : chatRoom.kino ? (
              <SendKinoChat
                message={message.content}
                chatTime={message.createdAt}
                style={{marginBottom: isSameSender ? 15 : 25}}
              />
            ) : (
              <SendChat
                message={message.content}
                chatTime={message.createdAt}
                style={{marginBottom: isSameSender ? 15 : 25}}
              />
            )}
          </React.Fragment>
        );
      })}
      <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chatContainer: {
    width: getResponsiveWidth(350),
    alignSelf: 'center',
  },
  dateSeparator: {
    alignSelf: 'center',
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(5),

    marginVertical: getResponsiveHeight(30),
    backgroundColor: 'rgba(255, 202, 85, 0.7)',
    borderRadius: getResponsiveIconSize(20),
    color: '#666',
  },
});
