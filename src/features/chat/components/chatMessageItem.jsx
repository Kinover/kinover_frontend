// components/common/ChatMessageItem.jsx
import React, {memo} from 'react';
import {View, StyleSheet} from 'react-native';
import AppText from 'components/AppText';
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

/**
 * 퇴장/입장 등 서버 시스템 알림 — 일반 말풍선이 아니라 날짜 구분선과 같은 중앙 pill로 표시
 */
function isRoomSystemNoticeMessage(message) {
  if (!message) return false;
  const localType = message?.localType;
  if (localType === 'kinoTyping' || localType === 'kinoIntro') return false;

  const imgs = getImageUrls(message);
  if (Array.isArray(imgs) && imgs.length > 0) return false;

  const rawType = String(message.messageType ?? message.type ?? '').toLowerCase();
  if (
    [
      'system',
      'notice',
      'leave',
      'event',
      'room_notice',
      'system_notice',
    ].includes(rawType)
  ) {
    return true;
  }

  const c = String(message.content ?? '').trim();
  if (!c) return false;
  return /님이\s*나갔습니다|나갔습니다\.?$|님이\s*입장했습니다|님이\s*초대되었습니다|퇴장했습니다/i.test(
    c,
  );
}

function ChatMessageItem({
  message,
  currentUserId,
  isKino = false,
  shouldShowDate = false,
  isGrouped,
  kinoType,

 // 멘션 하이라이트용
  mentionUsers = [],

  unreadCount = 0,
  forceShowTime = false,
}) {
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

  if (isRoomSystemNoticeMessage(message)) {
    const hideDateSeparator = localType === 'kinoTyping';
    return (
      <View style={[styles.wrapper, styles.alignCenter]}>
        {shouldShowDate && !hideDateSeparator && message?.createdAt && (
          <View style={styles.dateSeparator}>
            <AppText style={styles.dateSeparatorText}>
              {formatDate(message.createdAt)}
            </AppText>
          </View>
        )}
        <View style={[styles.dateSeparator, styles.systemNoticePill]}>
          <AppText style={styles.dateSeparatorText}>
            {String(message?.content ?? '').trim()}
          </AppText>
        </View>
      </View>
    );
  }

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
        forceShowTime={forceShowTime}
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
          <AppText style={styles.dateSeparatorText}>
            {formatDate(message.createdAt)}
          </AppText>
        </View>
      )}
      {ChatComponent}
    </View>
  );
}

export default memo(ChatMessageItem);

const styles = StyleSheet.create({
  wrapper: {width: '100%', paddingHorizontal: '2.5%'},
  alignRight: {alignItems: 'flex-end'},
  alignLeft: {alignItems: 'flex-start'},
  alignCenter: {alignItems: 'center'},
  /** 날짜와 겹칠 때 위쪽 여백만 줄임 (같은 날 시스템 연속 시) */
  systemNoticePill: {
    marginTop: getResponsiveHeight(6),
    maxWidth: '92%',
  },
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
