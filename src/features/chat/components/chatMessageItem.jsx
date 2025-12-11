// components/common/ChatMessageItem.jsx
import React, {useEffect} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  getResponsiveWidth,
  getResponsiveIconSize,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../../utils/responsive';

import ReceiveChat from './receiveChat';
import SendChat from './sendChat';
import ReceiveKinoChat from './receiveKinoChat';
import SendKinoChat from './sendKinoChat';

export default function ChatMessageItem({
  message,
  currentUserId,
  isKino = false,
  shouldShowDate = false,
  isGrouped,
}) {
  const navigation = useNavigation();
  const isMe = message.senderId === currentUserId;
  const localType = message.localType; // 클라 전용 타입 (kinoTyping, kinoIntro 등)

  useEffect(() => {
    navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});
  }, [navigation]);

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
    const weekday = weekdays[date.getDay()];

    return `${year}년 ${month}월 ${day}일 ${weekday}`;
  };

  let ChatComponent;

  // ✅ 1) 키노 타이핑 버블 (. . .)
  if (isKino && !isMe && localType === 'kinoTyping') {
    ChatComponent = (
      <ReceiveKinoChat
        isGrouped={false}
        isSameSender={false}
        isTyping={true}
      />
    );
  }
  // ✅ 2) 나(현재 유저)가 보낸 메시지
  else if (isMe) {
    ChatComponent = isKino ? (
      <SendKinoChat
        message={message.content}
        chatTime={message.createdAt}
        isGrouped={isGrouped}
      />
    ) : (
      <SendChat
        message={message.content}
        chatTime={message.createdAt}
        mediaUrls={message.imageUrls}
        isGrouped={isGrouped}
      />
    );
  }
  // ✅ 3) 상대방 메시지 (키노 / 일반)
  else {
    ChatComponent = isKino ? (
      <ReceiveKinoChat
        message={message.content}
        chatTime={message.createdAt}
        isGrouped={isGrouped}
      />
    ) : (
      <ReceiveChat
        userName={message.senderName}
        userProfileImage={message.senderImage}
        message={message.content}
        chatTime={message.createdAt}
        mediaUrls={message.imageUrls}
        isGrouped={isGrouped}
      />
    );
  }

  // ✅ 타이핑 메시지에는 날짜 구분선 안 보이게
  const hideDateSeparator = localType === 'kinoTyping';

  return (
    <View style={[styles.wrapper, isMe ? styles.alignRight : styles.alignLeft]}>
      {shouldShowDate && !hideDateSeparator && message.createdAt && (
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
    paddingHorizontal: '2.5%',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  dateSeparator: {
    alignSelf: 'center',
    paddingHorizontal: getResponsiveWidth(13),
    paddingVertical: getResponsiveHeight(5),
    marginVertical: getResponsiveHeight(25),
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: getResponsiveIconSize(20),
  },
  dateSeparatorText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
    color: 'white',
    lineHeight: getResponsiveHeight(17),
  },
});
