import React from 'react';
import {View, StyleSheet} from 'react-native';
import ReceiveChat from './receiveChat';
import SendChat from './sendChat';
import ReceiveKinoChat from './receiveKinoChat';
import SendKinoChat from './sendKinoChat';
import {useNavigation} from '@react-navigation/native';
import {useState} from 'react';
import {useLayoutEffect} from 'react';
import {useDispatch} from 'react-redux';
import ChatSettings from './chatSetting';
import {leaveChatRoomThunk} from '../../../redux/thunk/chatRoomThunk';
import {useEffect} from 'react';
import {
  getResponsiveWidth,
  getResponsiveIconSize,
  getResponsiveHeight,
} from '../../../utils/responsive';
import {Alert, Text} from 'react-native';
import {RenderHeaderRightChatSetting} from '../../../navigation/tabHeaderHelpers';
export default function ChatMessageItem({
  chatRoom,
  message,
  currentUserId,
  isKino = false,
  isSameSender = false,
  shouldShowDate = false, // ✅ 추가
}) {
  const isMe = message.senderId === currentUserId;
  const marginBottom = isSameSender ? 15 : 25;
  const dispatch = useDispatch();

  let ChatComponent;

  const navigation = useNavigation();
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
    <>
      <View
        style={[styles.wrapper, isMe ? styles.alignRight : styles.alignLeft]}>
        {shouldShowDate && (
          <Text style={styles.dateSeparator}>
            {formatDate(message.createdAt)}
          </Text>
        )}
        {ChatComponent}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingHorizontal: '3%',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  dateSeparator: {
    alignSelf: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: getResponsiveWidth(5),
    marginVertical: getResponsiveHeight(28),
    backgroundColor: 'rgba(255, 202, 85, 0.7)', // 투명도 0.5로 설정
    borderColor: 'transparent',
    borderRadius: getResponsiveIconSize(20),
    borderWidth: 9,
    color: '#666',
  },
});
