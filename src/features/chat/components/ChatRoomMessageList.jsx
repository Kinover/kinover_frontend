// 채팅방 메시지 리스트 영역 (MessageFlatList 래퍼)
import React from 'react';
import {View} from 'react-native';
import MessageFlatList from './messageFlatList';

export default function ChatRoomMessageList({
  flatListRef,
  messageList,
  chatRoom,
  userId,
  isKino,
  noMoreMessages,
  isFetchingMore,
  loadOlderMessages,
  handleScroll,
  scrollToBottom,
  isMessageFetched,
  mentionUsers,
  readPointersMap,
}) {
  return (
    <MessageFlatList
      flatListRef={flatListRef}
      messageList={messageList}
      chatRoom={chatRoom}
      userId={userId}
      isKino={isKino}
      noMoreMessages={noMoreMessages}
      isFetchingMore={isFetchingMore}
      loadOlderMessages={loadOlderMessages}
      handleScroll={handleScroll}
      scrollToBottom={scrollToBottom}
      isMessageFetched={isMessageFetched}
      mentionUsers={mentionUsers}
      readPointersMap={readPointersMap}
    />
  );
}
