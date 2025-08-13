import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {
  getResponsiveWidth,
  getResponsiveIconSize,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../../../utils/responsive';

import ReceiveChat from './receiveChat';
import SendChat from './sendChat';
import ReceiveKinoChat from './receiveKinoChat';
import SendKinoChat from './sendKinoChat';

export default function ChatMessageItem({
  chatRoom,
  message,
  currentUserId,
  isKino = false,
  isSameSender = false,
  shouldShowDate = false,
}) {
  const isMe = message.senderId === currentUserId;
  const marginBottom = isSameSender
    ? getResponsiveHeight(15)
    : getResponsiveHeight(25);

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  useEffect(() => {
    navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});
  }, [navigation]);

  let ChatComponent;
  if (isMe) {
    ChatComponent = isKino ? (
      <SendKinoChat
        message={message.content}
        chatTime={message.createdAt}
        style={{marginBottom}}
        imageUrls={message.imageUrls}
        messageType={message.messageType}
      />
    ) : (
      <SendChat
        message={message.content}
        chatTime={message.createdAt}
        style={{marginBottom}}
        imageUrls={message.imageUrls}
        messageType={message.messageType}
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
        messageType={message.messageType}
      />
    ) : (
      <ReceiveChat
        userName={message.senderName}
        userProfileImage={message.senderImage}
        message={message.content}
        chatTime={message.createdAt}
        style={{marginBottom}}
        messageType={message.messageType}
        imageUrls={message.imageUrls}
      />
    );
  }

  return (
    <View style={[styles.wrapper, isMe ? styles.alignRight : styles.alignLeft]}>
      {shouldShowDate && (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>
            {formatDate(message.createdAt)}
          </Text>
        </View>
      )}
      {ChatComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: '4%',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  dateSeparator: {
    alignSelf: 'center',
    // alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(15),
    paddingVertical: getResponsiveHeight(7),
    marginVertical: getResponsiveHeight(24),
    // backgroundColor: 'rgba(255, 202, 85, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: getResponsiveIconSize(20),
  },
  dateSeparatorText: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'semibold',
    color: 'white',
    alignContent: 'center',
  },
});
