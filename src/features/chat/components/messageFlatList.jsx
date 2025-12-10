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
  // 1) 키노방 전용 자기소개 메시지 생성
  const kinoIntroMessage = {
    messageId: 'kino-intro',
    senderId: 0, // 시스템 메시지
    content:
      '안녕하세요! 저는 키노예요! 가족들이 하루 동안 느낀 일들, 나누고 싶은 순간들, 그 모든 따뜻한 기록을 한곳에 모아주는 역할을 하고 있어요. 여기선 무엇이든 편하게 말해줘요. 다 소중한 이야기니까요!',
    createdAt: chatRoom?.createdAt || new Date(0).toISOString(),
    type: 'system',
    isSystem: true,
  };

  // ✅ 2) 키노방이면 맨 위에 시스템 메시지 추가
  const finalMessages = isKino
    ? [...messageList, kinoIntroMessage] // inverted라 끝에 넣어야 맨 위로 감
    : messageList;

  return (
    <FlatList
      ref={flatListRef}
      data={finalMessages}
      keyExtractor={item => `${item.messageId}_${item.createdAt}`}
      renderItem={({item, index}) => {
        const prev = finalMessages[index + 1]; // inverted +1
        const next = finalMessages[index - 1];

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
            isGrouped={isSameSenderAsPrev}
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
      scrollEventThrottle={30}
      onScrollToIndexFailed={() => setTimeout(scrollToBottom, 300)}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}
