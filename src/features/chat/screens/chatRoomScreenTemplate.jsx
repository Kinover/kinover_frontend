// ChatRoomScreenTemplate - 공통 채팅방 화면 (관심사 분리: 훅 + 메시지/입력 컴포넌트)
import React from 'react';
import {StyleSheet, KeyboardAvoidingView, Platform, View} from 'react-native';

import useChatRoomTemplate from '../hooks/useChatRoomTemplate';
import {onLeaveChat} from '../hooks/onLeaveChat';

import ChatRoomMessageList from '../components/ChatRoomMessageList';
import ChatRoomInputArea from '../components/ChatRoomInputArea';
import ChatSettings from './ChatSetting';
import ToastModal from 'components/modal/ToastModal';

export default function ChatRoomScreenTemplate({
  chatRoom,
  title,
  userId,
  isKino,
  navigation,
}) {
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
        keyboardVerticalOffset={102.5}>
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
});
