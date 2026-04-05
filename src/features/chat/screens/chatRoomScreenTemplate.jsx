// ChatRoomScreenTemplate - 공통 채팅방 화면 (관심사 분리: 훅 + 메시지/입력 컴포넌트)
import React from 'react';
import {StyleSheet, KeyboardAvoidingView, Platform, View} from 'react-native';
import {useHeaderHeight} from '@react-navigation/elements';

import useChatRoomTemplate from '../hooks/useChatRoomTemplate';
import {onLeaveChat} from '../hooks/onLeaveChat';

import ChatRoomMessageList from '../components/messages/ChatRoomMessageList';
import ChatRoomInputArea from '../components/rooms/ChatRoomInputArea';
import ChatSettings from './chatSetting';
import ToastModal from 'components/modal/ToastModal';

export default function ChatRoomScreenTemplate({
  chatRoom,
  title,
  userId,
  isKino,
  navigation,
}) {
  // 스택 헤더 높이 — iOS KeyboardAvoidingView offset에 safe area top만 쓰면 입력창이 키보드에 가려짐
  const headerHeight = useHeaderHeight();

  const {
    chatRoomId,
    currentChatRoom,
    myUserId,
    isSettingsOpen,
    setIsSettingsOpen,
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
    openAddMember,
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

      <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        chatRoomId={chatRoomId}
        navigation={navigation}
        onLeaveChat={onLeaveChat}
        isKino={isKinoRoom}
        onOpenAddMember={openAddMember}
      />
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}>
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
});
