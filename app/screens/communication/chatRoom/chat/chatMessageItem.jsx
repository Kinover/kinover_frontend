import React, {useEffect, useState, useMemo} from 'react';
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
  isSameSender = false, // 부모에서 연속 여부 힌트
  shouldShowDate = false,
}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 내가 보낸 메시지?
  const isMe = message.senderId === currentUserId;

  // 분 단위 동일 시각 비교
  const isSameMinute = (a, b) => {
    if (!a || !b) return false;
    const A = new Date(a);
    const B = new Date(b);
    return (
      A.getFullYear() === B.getFullYear() &&
      A.getMonth() === B.getMonth() &&
      A.getDate() === B.getDate() &&
      A.getHours() === B.getHours() &&
      A.getMinutes() === B.getMinutes()
    );
  };

  // ✅ isGrouped 계산 (이전 메시지 시간이 있으면 더 엄격, 없으면 isSameSender만으로 폴백)
  const isGrouped = useMemo(() => {
    const prevAt = message.prevCreatedAt; // 선택적으로 넘겨줄 수 있음
    if (prevAt) {
      return isSameSender && isSameMinute(prevAt, message.createdAt);
    }
    return isSameSender; // 폴백: 연속 보낸 사람만 같으면 묶음 처리
  }, [isSameSender, message.prevCreatedAt, message.createdAt]);

  // 간격: 그룹이면 위 간격/아래 간격 모두 타이트
  const spacingStyle = useMemo(() => {
    return {
      marginTop: getResponsiveHeight(2),
      marginBottom: getResponsiveHeight(8),
    };
  }, [isGrouped]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
  
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
  
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekday = weekdays[date.getDay()];
  
    return `${year}년 ${month}월 ${day}일 ${weekday}`;
  };

  useEffect(() => {
    navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});
  }, [navigation]);

  let ChatComponent;
  if (isMe) {
    // 내가 보낸 메시지는 아바타/이름이 원래 없으니 간격만 타이트 처리
    ChatComponent = isKino ? (
      <SendKinoChat
        message={message.content}
        chatTime={message.createdAt}
        style={spacingStyle}
        imageUrls={message.imageUrls}
        messageType={message.messageType}
        isGrouped={isGrouped} // 넘겨두면 컴포넌트에서 쓸 수 있음(옵셔널)
      />
    ) : (
      <SendChat
        message={message.content}
        chatTime={message.createdAt}
        style={spacingStyle}
        imageUrls={message.imageUrls}
        messageType={message.messageType}
        isGrouped={isGrouped}
      />
    );
  } else {
    // 받은 메시지는 isGrouped일 때:
    // - ReceiveChat/ReceiveKinoChat 내부에서 프로필/유저명 숨기고 아바타 스페이서로 정렬 유지
    ChatComponent = isKino ? (
      <ReceiveKinoChat
        userName={message.senderName}
        userProfileImage={message.senderImage}
        message={message.content}
        chatTime={message.createdAt}
        style={spacingStyle}
        messageType={message.messageType}
        imageUrls={message.imageUrls}
        isGrouped={isGrouped}
      />
    ) : (
      <ReceiveChat
        userName={message.senderName}
        userProfileImage={message.senderImage}
        message={message.content}
        chatTime={message.createdAt}
        style={spacingStyle}
        messageType={message.messageType}
        imageUrls={message.imageUrls}
        isGrouped={isGrouped}
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
    paddingHorizontal: getResponsiveWidth(15),
    paddingVertical: getResponsiveHeight(7),
    marginVertical: getResponsiveHeight(24),
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: getResponsiveIconSize(20),
  },
  dateSeparatorText: {
    textAlign:'center',
    textAlignVertical:'center',
    fontSize: getResponsiveFontSize(13),
    fontWeight: 'semibold',
    color: 'white',
    alignContent: 'center',
    lineHeight:getResponsiveHeight(18),
  },
});
