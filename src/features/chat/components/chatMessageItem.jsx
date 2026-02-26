// components/common/ChatMessageItem.jsx
import React, {useEffect} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  getResponsiveWidth,
  getResponsiveIconSize,
  getResponsiveHeight,
  getResponsiveFontSize,
} from 'utils/responsive';

import ReceiveChat from './receiveChat';
import SendChat from './sendChat';
import ReceiveKinoChat from './receiveKinoChat';
import SendKinoChat from './sendKinoChat';

const getSenderId = message => {
  if (!message) return null;
  return (
    message.senderId ??
    message.senderID ??
    message.userId ??
    message.sender?.id ??
    message.sender?.userId ??
    null
  );
};

const isSameId = (a, b) => {
  if (a == null || b == null) return false;
  return String(a) === String(b);
};

const getImageUrls = message => {
  const raw =
    message?.imageUrls ??
    message?.mediaUrls ??
    message?.images ??
    message?.imageUrl ??
    [];
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
};

const getMessageType = message => {
  const t = message?.messageType ?? message?.type ?? 'text';
  return String(t).toLowerCase();
};

export default function ChatMessageItem({
  message,
  currentUserId,
  isKino = false,
  shouldShowDate = false,
  isGrouped,
  kinoType,

 // 멘션 하이라이트용
  mentionUsers = [],

  unreadCount = 0,
}) {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});
  }, [navigation]);

  if (!message) return null;

  const localType = message?.localType;
  const senderId = getSenderId(message);
  const isMe = isSameId(senderId, currentUserId);

  const messageType = getMessageType(message);
  const imageUrls = getImageUrls(message);

  const formatDate = dateString => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = [
      '일요일',
      '월요일',
      '화요일',
      '수요일',
      '목요일',
      '금요일',
      '토요일',
    ];
    return `${year}년 ${month}월 ${day}일 ${weekdays[date.getDay()]}`;
  };

  let ChatComponent;

  if (isKino && localType === 'kinoTyping') {
    ChatComponent = (
      <ReceiveKinoChat
        isGrouped={false}
        isSameSender={false}
        isTyping={true}
        kinoType={kinoType}
        mentionUsers={mentionUsers}
      />
    );
  } else if (isMe) {
    ChatComponent = isKino ? (
      <SendKinoChat
        message={message?.content}
        chatTime={message?.createdAt}
        isGrouped={isGrouped}
        messageType={messageType}
        imageUrls={imageUrls}
        mentionUsers={mentionUsers}
        kinoType={kinoType}
 // unreadCount={unreadCount}
      />
    ) : (
      <SendChat
        message={message?.content}
        chatTime={message?.createdAt}
        mediaUrls={imageUrls}
        messageType={messageType}
        uploadStatus={message?.uploadStatus}
        isGrouped={isGrouped}
        mentionUsers={mentionUsers}
        unreadCount={unreadCount}
      />
    );
  } else {
    ChatComponent = isKino ? (
      <ReceiveKinoChat
        message={message?.content}
        chatTime={message?.createdAt}
        isGrouped={isGrouped}
        kinoType={kinoType}
        messageType={messageType}
        imageUrls={imageUrls}
        mentionUsers={mentionUsers}
 // unreadCount={unreadCount}
      />
    ) : (
      <ReceiveChat
        userName={message?.senderName}
        userProfileImage={message?.senderImage}
        message={message?.content}
        chatTime={message?.createdAt}
        mediaUrls={imageUrls}
        messageType={messageType}
        isGrouped={isGrouped}
        mentionUsers={mentionUsers}
        unreadCount={unreadCount}
      />
    );
  }

  const hideDateSeparator = localType === 'kinoTyping';

  return (
    <View style={[styles.wrapper, isMe ? styles.alignRight : styles.alignLeft]}>
      {shouldShowDate && !hideDateSeparator && message?.createdAt && (
        <View style={styles.dateSeparator}>
          <Text allowFontScaling={false} style={styles.dateSeparatorText}>
            {formatDate(message.createdAt)}
          </Text>
        </View>
      )}
      {ChatComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {width: '100%', paddingHorizontal: '2.5%'},
  alignRight: {alignItems: 'flex-end'},
  alignLeft: {alignItems: 'flex-start'},
  dateSeparator: {
    alignSelf: 'center',
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(4),
    marginVertical: getResponsiveHeight(25),
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: getResponsiveIconSize(20),
  },
  dateSeparatorText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(11.5),
    color: 'white',
    lineHeight: getResponsiveHeight(16),
  },
});
