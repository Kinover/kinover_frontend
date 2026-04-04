// components/common/ChatMessageItem.jsx
import React, {memo} from 'react';
import {View} from 'react-native';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveWidth,
  getResponsiveIconSize,
  getResponsiveHeight,
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

const getMessageStableId = message => {
  if (!message) return 'no-message';
  return (
    message?.clientMessageId ??
    message?.messageId ??
    `${message?.senderId ?? message?.userId ?? 'x'}_${message?.createdAt ?? ''}`
  );
};

const normalizeImageUrls = message => {
  const urls = getImageUrls(message);
  return urls.map(v => String(v));
};

const areStringArraysEqual = (a = [], b = []) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const areMentionUsersEqual = (prevUsers = [], nextUsers = []) => {
  if (prevUsers === nextUsers) return true;
  if (!Array.isArray(prevUsers) || !Array.isArray(nextUsers)) return false;
  if (prevUsers.length !== nextUsers.length) return false;

  for (let i = 0; i < prevUsers.length; i += 1) {
    const prev = prevUsers[i] || {};
    const next = nextUsers[i] || {};

    const prevId = String(prev?.userId ?? prev?.id ?? '');
    const nextId = String(next?.userId ?? next?.id ?? '');
    if (prevId !== nextId) return false;

    const prevName = String(prev?.userName ?? prev?.name ?? prev?.nickName ?? '');
    const nextName = String(next?.userName ?? next?.name ?? next?.nickName ?? '');
    if (prevName !== nextName) return false;
  }

  return true;
};

/** 퇴장/입장 등 서버 시스템 알림 — 날짜 구분선과 같은 중앙 pill */
function isRoomSystemNoticeMessage(message) {
  if (!message) return false;
  const localType = message?.localType;
  if (localType === 'kinoTyping' || localType === 'kinoIntro') return false;

  const imgs = getImageUrls(message);
  if (Array.isArray(imgs) && imgs.length > 0) return false;

  // 서버에서 systemMessage: true 플래그로 명시적으로 구분
  if (message.systemMessage === true) return true;

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

  return false;
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
  const styles = useScaledStyleSheet(rf => ({
    wrapper: {width: '100%', paddingHorizontal: '2.5%'},
    alignRight: {alignItems: 'flex-end'},
    alignLeft: {alignItems: 'flex-start'},
    alignCenter: {alignItems: 'center'},
    dateSeparator: {
      alignSelf: 'center',
      paddingHorizontal: getResponsiveWidth(12),
      paddingVertical: getResponsiveHeight(4),
      marginVertical: getResponsiveHeight(25),
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
      borderRadius: getResponsiveIconSize(20),
    },
    systemNoticePill: {
      marginTop: getResponsiveHeight(6),
      maxWidth: '92%',
    },
    dateSeparatorText: {
      textAlign: 'center',
      textAlignVertical: 'center',
      fontFamily: 'Pretendard-SemiBold',
      fontSize: rf(11.5),
      color: 'white',
      lineHeight: rf(16),
    },
  }));

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

function areEqualChatMessageItemProps(prevProps, nextProps) {
  if (prevProps === nextProps) return true;

  if (prevProps.currentUserId !== nextProps.currentUserId) return false;
  if (prevProps.isKino !== nextProps.isKino) return false;
  if (prevProps.shouldShowDate !== nextProps.shouldShowDate) return false;
  if (prevProps.isGrouped !== nextProps.isGrouped) return false;
  if (prevProps.kinoType !== nextProps.kinoType) return false;
  if (prevProps.unreadCount !== nextProps.unreadCount) return false;
  if (prevProps.forceShowTime !== nextProps.forceShowTime) return false;
  if (!areMentionUsersEqual(prevProps.mentionUsers, nextProps.mentionUsers)) {
    return false;
  }

  const prevMsg = prevProps.message;
  const nextMsg = nextProps.message;

  if (prevMsg === nextMsg) return true;
  if (!prevMsg || !nextMsg) return false;

  if (getMessageStableId(prevMsg) !== getMessageStableId(nextMsg)) return false;

  if (String(prevMsg?.content ?? '') !== String(nextMsg?.content ?? '')) return false;
  if (String(prevMsg?.createdAt ?? '') !== String(nextMsg?.createdAt ?? '')) {
    return false;
  }
  if (String(prevMsg?.localType ?? '') !== String(nextMsg?.localType ?? '')) {
    return false;
  }
  if (String(prevMsg?.messageType ?? prevMsg?.type ?? '') !== String(nextMsg?.messageType ?? nextMsg?.type ?? '')) {
    return false;
  }
  if (String(prevMsg?.uploadStatus ?? '') !== String(nextMsg?.uploadStatus ?? '')) {
    return false;
  }
  if (String(prevMsg?.senderName ?? '') !== String(nextMsg?.senderName ?? '')) {
    return false;
  }
  if (String(prevMsg?.senderImage ?? '') !== String(nextMsg?.senderImage ?? '')) {
    return false;
  }
  if ((prevMsg?.systemMessage ?? false) !== (nextMsg?.systemMessage ?? false)) {
    return false;
  }

  const prevSenderId = String(
    prevMsg?.senderId ??
      prevMsg?.senderID ??
      prevMsg?.userId ??
      prevMsg?.sender?.id ??
      prevMsg?.sender?.userId ??
      '',
  );
  const nextSenderId = String(
    nextMsg?.senderId ??
      nextMsg?.senderID ??
      nextMsg?.userId ??
      nextMsg?.sender?.id ??
      nextMsg?.sender?.userId ??
      '',
  );
  if (prevSenderId !== nextSenderId) return false;

  const prevImages = normalizeImageUrls(prevMsg);
  const nextImages = normalizeImageUrls(nextMsg);
  if (!areStringArraysEqual(prevImages, nextImages)) return false;

  return true;
}

export default memo(ChatMessageItem, areEqualChatMessageItemProps);
