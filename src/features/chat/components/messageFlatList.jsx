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
  isMessageFetched
}) {
  const [showKinoTyping, setShowKinoTyping] = useState(false);
  const [introSequenceRunning, setIntroSequenceRunning] = useState(false);
  const [showIntroMessage, setShowIntroMessage] = useState(false);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  const typingTimeoutRef = useRef(null);

  /* ===============================
   * 채팅방 변경 시 상태 리셋
   * =============================== */
  useEffect(() => {
    setIsInitialLoaded(false);
    setShowKinoTyping(false);
    setIntroSequenceRunning(false);
    setShowIntroMessage(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [chatRoom?.chatRoomId]);

  /* ===============================
   * 초기 메시지 로딩 완료 감지
   * =============================== */
  useEffect(() => {
    if (!chatRoom?.chatRoomId) return;

    // ✅ 메시지가 0개여도 "fetch가 끝났으면" 초기 로딩 완료로 인정
    if (isMessageFetched) {
      setIsInitialLoaded(true);
    }
  }, [chatRoom?.chatRoomId, isMessageFetched]);
  

  /* ===============================
   * 1️⃣ 키노 인트로 연출 (초기 로딩 이후에만)
   * =============================== */
  useEffect(() => {
    if (!isKino || !chatRoom?.chatRoomId) return;
    if (!isInitialLoaded) return;

    const storageKey = `kino_intro_shown_${chatRoom.chatRoomId}`;
    let timer;

    const init = async () => {
      try {
        const alreadyShown = await AsyncStorage.getItem(storageKey);

        if (alreadyShown === 'true') {
          setShowIntroMessage(true);
          return;
        }

        setIntroSequenceRunning(true);
        setShowKinoTyping(true);
        setShowIntroMessage(false);

        timer = setTimeout(async () => {
          setShowKinoTyping(false);
          setIntroSequenceRunning(false);
          setShowIntroMessage(true);
          await AsyncStorage.setItem(storageKey, 'true');
        }, 1500);
      } catch {
        setShowKinoTyping(false);
        setIntroSequenceRunning(false);
        setShowIntroMessage(true);
      }
    };

    init();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isKino, chatRoom?.chatRoomId, isInitialLoaded]);

  /* ===============================
   * 2️⃣ 유저 메시지 이후 키노 타이핑 (. . .)
   * =============================== */
  useEffect(() => {
    if (!isKino) return;
    if (!isInitialLoaded) return;
    if (!messageList || messageList.length === 0) return;
    if (introSequenceRunning) return;

    const latest = messageList[0]; // inverted 기준 최신

    if (!latest || latest.senderId !== userId) {
      setShowKinoTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    if (latest.localType === 'kinoTyping' || latest.localType === 'kinoIntro') {
      return;
    }

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
  }, [messageList, isKino, userId, introSequenceRunning, isInitialLoaded]);

  /* ===============================
   * 키노 로컬 메시지 정의
   * =============================== */
  const kinoIntroMessage = {
    messageId: 'kino-intro',
    senderId: 0,
    content:
      '안녕하세요! 저는 키노예요! 가족들이 하루 동안 느낀 일들, 나누고 싶은 순간들, 그 모든 따뜻한 기록을 한곳에 모아주는 역할을 하고 있어요. 여기선 무엇이든 편하게 말해줘요. 다 소중한 이야기니까요!',
    createdAt: chatRoom?.createdAt || new Date(0).toISOString(),
    localType: 'kinoIntro',
  };

  const kinoTypingMessage = {
    messageId: 'kino-typing',
    senderId: 0,
    content: '',
    createdAt: new Date().toISOString(),
    localType: 'kinoTyping',
  };

  /* ===============================
   * 최종 메시지 리스트
   * =============================== */
  const finalMessages = useMemo(() => {
    let result = [...messageList];

    if (isKino && isInitialLoaded) {
      if (showIntroMessage) {
        result = [...result, kinoIntroMessage];
      }
      if (showKinoTyping) {
        result = [kinoTypingMessage, ...result];
      }
    }

    return result;
  }, [messageList, isKino, showIntroMessage, showKinoTyping, isInitialLoaded]);

  return (
    <FlatList
      ref={flatListRef}
      data={finalMessages}
      keyExtractor={(item, index) => {
        // 서버 메시지: messageId가 있으면 그게 제일 안전
        if (item?.messageId) return String(item.messageId);

        // 로컬(typing/intro) 같은 경우
        if (item?.localType)
          return `${item.localType}_${item.createdAt ?? index}`;

        // 최후의 수단
        return `${item.senderId ?? 'x'}_${item.createdAt ?? 't'}_${index}`;
      }}
      renderItem={({item, index}) => {
        const prev = finalMessages[index + 1];
        const prevDate = prev?.createdAt
          ? new Date(prev.createdAt).toDateString()
          : null;
        const curDate = new Date(item.createdAt).toDateString();
        const shouldShowDate = curDate !== prevDate;

        const isGrouped = prev?.senderId === item.senderId;

        return (
          <ChatMessageItem
            chatRoom={chatRoom}
            message={item}
            currentUserId={userId}
            isKino={isKino}
            kinoType={chatRoom.kinoType}
            shouldShowDate={shouldShowDate}
            isGrouped={isGrouped}
          />
        );
      }}
      inverted
      onEndReached={noMoreMessages ? null : loadOlderMessages}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingMore && <ActivityIndicator size="small" color="#aaa" />
      }
      ListHeaderComponent={<View style={{height: getResponsiveHeight(30)}} />}
      removeClippedSubviews={false}
      onScroll={handleScroll}
      scrollEventThrottle={30}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}
