// components/common/MessageFlatList.jsx
import React from 'react';
import {FlatList, ActivityIndicator, View} from 'react-native';
import ChatMessageItem from './ChatMessageItem';
import {getResponsiveHeight} from '../../../utils/responsive';

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
      renderItem={({item, index}) => {
        const prev = messageList[index + 1]; // inverted라서 +1이 '이전'임
        const next = messageList[index - 1];

        // 같은 사람인지 체크 (inverted 고려)
        const isSameSenderAsPrev = prev?.senderId === item.senderId;

        const prevDate = prev?.createdAt
          ? new Date(prev.createdAt).toDateString()
          : null;
        const curDate = new Date(item.createdAt).toDateString();
        const shouldShowDate = curDate !== prevDate;

        return (
          <ChatMessageItem
            chatRoom={chatRoom}
            message={item}
            currentUserId={userId}
            isKino={isKino}
            shouldShowDate={shouldShowDate}
            isGrouped={isSameSenderAsPrev} // ✅ 바로 위 메시지랑 같은 사람이면 그룹
          />
        );
      }}
      inverted
      onEndReached={noMoreMessages ? null : loadOlderMessages}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingMore && <ActivityIndicator size="small" color="#aaa" />
      }
      ListHeaderComponent={
        <View style={{height: getResponsiveHeight(20)}}></View>
      }
      removeClippedSubviews={false}
      onScroll={handleScroll}
      scrollEventThrottle={30} // ✅ 이렇게 바꿔줘
      onScrollToIndexFailed={() => setTimeout(scrollToBottom, 300)}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}
