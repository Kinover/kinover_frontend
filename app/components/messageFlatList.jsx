// components/common/MessageFlatList.jsx
import React from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import ChatMessageItem from '../screens/communication/chatRoom/chat/chatMessageItem';

export default function MessageFlatList({
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
}) {
  return (
    <FlatList
      ref={flatListRef}
      data={messageList}
      keyExtractor={item => `${item.messageId}_${item.createdAt}`}
      renderItem={({ item, index }) => {
        const next = messageList[index + 1];
        const prevDate = next?.createdAt
          ? new Date(next.createdAt).toDateString()
          : null;
        const curDate = new Date(item.createdAt).toDateString();
        const shouldShowDate = curDate !== prevDate;

        return (
          <ChatMessageItem
            chatRoom={chatRoom}
            message={item}
            currentUserId={userId}
            isKino={isKino}
            isSameSender={next?.senderId === item.senderId}
            shouldShowDate={shouldShowDate}
          />
        );
      }}
      inverted
      onEndReached={noMoreMessages ? null : loadOlderMessages}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingMore && <ActivityIndicator size="small" color="#aaa" />
      }
      contentContainerStyle={{ flexGrow: 1 }}
      maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      removeClippedSubviews={false}
      onScroll={handleScroll}
      scrollEventThrottle={100}
      onScrollToIndexFailed={() => setTimeout(scrollToBottom, 300)}
    />
  );
}
