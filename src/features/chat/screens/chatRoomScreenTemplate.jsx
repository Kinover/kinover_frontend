// ChatRoomScreenTemplate - 공통 채팅방 화면 (관심사 분리: 훅 + 메시지/입력 컴포넌트)
import React from 'react';
import {StyleSheet, Platform, View} from 'react-native';
import {useHeaderHeight} from '@react-navigation/elements';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';

import useChatRoomTemplate from '../hooks/useChatRoomTemplate';

import ChatRoomMessageList from '../components/messages/ChatRoomMessageList';
import ChatRoomInputArea from '../components/rooms/ChatRoomInputArea';
import ToastModal from 'components/modal/ToastModal';

export default function ChatRoomScreenTemplate({
  chatRoom,
  title,
  userId,
  isKino,
  navigation,
}) {
  // 스택 헤더 높이 — iOS KAV offset에 사용
  const headerHeight = useHeaderHeight();

  const {
    chatRoomId,
    currentChatRoom,
    myUserId,
    messageList,
    isMessageFetched,
    roomUsers,
    readPointersMap,
    flatListRef,
    noMoreMessages,
    isFetchingMore,
    loadOlderMessages,
    handleScroll,
    scrollToBottom,
    inviteToastVisible,
    inviteToastMessage,
    setInviteToastVisible,
    isKino: isKinoRoom,
  } = useChatRoomTemplate({chatRoom, title, userId, isKino, navigation});

  const content = (
    <View style={{flex: 1}}>
      <ChatRoomMessageList
        flatListRef={flatListRef}
        messageList={messageList}
        chatRoom={currentChatRoom}
        userId={myUserId}
        isKino={isKinoRoom}
        noMoreMessages={noMoreMessages}
        isFetchingMore={isFetchingMore}
        loadOlderMessages={loadOlderMessages}
        handleScroll={handleScroll}
        scrollToBottom={scrollToBottom}
        isMessageFetched={isMessageFetched}
        mentionUsers={roomUsers}
        readPointersMap={readPointersMap}
      />

      <ChatRoomInputArea
        chatRoom={currentChatRoom}
        userId={myUserId}
        enableMediaPicker={!isKinoRoom}
        mentionUsers={roomUsers}
        enableMention={!isKinoRoom}
      />

      <ToastModal
        visible={inviteToastVisible}
        message={inviteToastMessage}
        onClose={() => setInviteToastVisible(false)}
      />
    </View>
  );

  // react-native-keyboard-controller의 KeyboardAvoidingView:
  // - iOS: behavior="padding" + 헤더 높이 offset (기존과 동일)
  // - Android: behavior="height" + WindowInsetsAnimationCompat API로 정확한 키보드 높이 추적
  //   (edge-to-edge + 자동완성 바 + 삼성 플로팅 툴바 포함)
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      automaticOffset={Platform.OS === 'android'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}>
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
});
