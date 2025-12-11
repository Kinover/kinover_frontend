// components/common/MessageFlatList.jsx
import React, {useEffect, useState, useMemo, useRef} from 'react';
import {FlatList, ActivityIndicator, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [showKinoTyping, setShowKinoTyping] = useState(false); // 키노 ... 말풍선
  const [introSequenceRunning, setIntroSequenceRunning] = useState(false); // 첫 입장 연출 중인지
  const [showIntroMessage, setShowIntroMessage] = useState(false); // 인트로 말풍선 실제 노출 여부

  const typingTimeoutRef = useRef(null); // 유저 발화용 타이핑 타이머

  // ✅ 1) 키노방 + 채팅방별로 “처음 입장인지” 체크 (처음만 . . . → 인트로)
  useEffect(() => {
    if (!isKino || !chatRoom?.chatRoomId) return;

    const storageKey = `kino_intro_shown_${chatRoom.chatRoomId}`;
    let timer;

    const init = async () => {
      try {
        const alreadyShown = await AsyncStorage.getItem(storageKey);

        // ✅ 이미 인트로를 본 방이면: 인트로만 항상 노출, 자동 ... 없음
        if (alreadyShown === 'true') {
          setShowKinoTyping(false);
          setIntroSequenceRunning(false);
          setShowIntroMessage(true); // 인트로는 채팅 히스토리처럼 계속 보이게
          return;
        }

        // ✅ 처음 들어온 방: . . . → 인트로 순서
        setIntroSequenceRunning(true);
        setShowKinoTyping(true); // 처음엔 . . . 만 보임
        setShowIntroMessage(false); // 인트로는 숨김

        timer = setTimeout(async () => {
          setShowKinoTyping(false); // . . . 숨기고
          setIntroSequenceRunning(false);
          setShowIntroMessage(true); // 인트로 등장
          await AsyncStorage.setItem(storageKey, 'true');
        }, 1500);
      } catch (e) {
        // 에러 나면 그냥 인트로만 보여주고 끝
        setShowKinoTyping(false);
        setIntroSequenceRunning(false);
        setShowIntroMessage(true);
      }
    };

    init();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isKino, chatRoom?.chatRoomId]);

  // ✅ 2) 유저가 새 메시지 보낼 때마다: 0.5초 뒤 키노 타이핑 말풍선 표시
  useEffect(() => {
    if (!isKino) return;
    if (!messageList || messageList.length === 0) return;

    // 입장 첫 연출 도는 중이면, 유저 발화 기반 타이핑은 잠깐 막기
    if (introSequenceRunning) return;

    const latest = messageList[0]; // 🔹 inverted라 0번이 "최신"이라고 가정

    // 최신 메시지가 유저가 아니면: 타이핑 끄고, 타이머 정리
    if (!latest || latest.senderId !== userId) {
      setShowKinoTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    // 로컬 타입(타이핑/인트로) 메시지면 무시
    if (latest.localType === 'kinoTyping' || latest.localType === 'kinoIntro') {
      return;
    }

    // 유저가 새 메시지를 보냈을 때: 0.5초 후 `. . .` 표시
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setShowKinoTyping(true);
    }, 500);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageList, isKino, userId, introSequenceRunning]);

  // ✅ 키노 자기소개 메시지
  const kinoIntroMessage = {
    messageId: 'kino-intro',
    senderId: 0,
    content:
      '안녕하세요! 저는 키노예요! 가족들이 하루 동안 느낀 일들, 나누고 싶은 순간들, 그 모든 따뜻한 기록을 한곳에 모아주는 역할을 하고 있어요. 여기선 무엇이든 편하게 말해줘요. 다 소중한 이야기니까요!',
    createdAt: chatRoom?.createdAt || new Date(0).toISOString(),
    localType: 'kinoIntro',
  };

  // ✅ 키노 타이핑 메시지
  const kinoTypingMessage = {
    messageId: 'kino-typing',
    senderId: 0,
    content: '',
    createdAt: new Date().toISOString(),
    localType: 'kinoTyping',
  };

  // ✅ 최종 메시지 리스트 생성
  const finalMessages = useMemo(() => {
    let result = [...messageList];

    if (isKino) {
      // ✨ 인트로는 showIntroMessage가 true일 때만 붙이기
      if (showIntroMessage) {
        result = [...result, kinoIntroMessage]; // 오래된 쪽에 동작하도록 뒤에 붙임
      }

      // ✨ 타이핑 말풍선은 항상 "가장 최신" 위치에
      if (showKinoTyping) {
        result = [kinoTypingMessage, ...result]; // inverted 기준 맨 아래쪽
      }
    }

    return result;
  }, [messageList, isKino, showIntroMessage, showKinoTyping]);

  return (
    <FlatList
      ref={flatListRef}
      data={finalMessages}
      keyExtractor={item => `${item.messageId}_${item.createdAt}`}
      renderItem={({item, index}) => {
        const prev = finalMessages[index + 1]; // inverted라 +1이 "이전(위쪽)" 메시지
        const prevDate = prev?.createdAt
          ? new Date(prev.createdAt).toDateString()
          : null;
        const curDate = new Date(item.createdAt).toDateString();
        const shouldShowDate = curDate !== prevDate;

        const isSameSenderAsPrev = prev?.senderId === item.senderId;

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
        <View
          style={{
            height: getResponsiveHeight(30),
          }}></View>
      }
      removeClippedSubviews={false}
      onScroll={handleScroll}
      scrollEventThrottle={30}
      onScrollToIndexFailed={() => setTimeout(scrollToBottom, 300)}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      maintainVisibleContentPosition={{
        minIndexForVisible: 1, // 현재 화면에 보이는 index 기준
        autoscrollToTopThreshold: 50, // 아래쪽 근처(=최신)일 때만 자동으로 붙여 줌
      }}
    />
  );
}
