// components/MessageFlatList.jsx
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
  isMessageFetched,

  mentionUsers,

  // ✅ 추가: { [userId]: lastReadAt }
  readPointersMap,
}) {
  const [showKinoTyping, setShowKinoTyping] = useState(false);
  const [introSequenceRunning, setIntroSequenceRunning] = useState(false);
  const [showIntroMessage, setShowIntroMessage] = useState(false);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  const typingTimeoutRef = useRef(null);

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

  useEffect(() => {
    if (!chatRoom?.chatRoomId) return;
    if (isMessageFetched) setIsInitialLoaded(true);
  }, [chatRoom?.chatRoomId, isMessageFetched]);

  // "YYYY-MM-DD HH:mm:ss" / "YYYY-MM-DDTHH:mm:ss" / ISO 전부 최대한 로컬로 파싱
  const toMsLocal = v => {
    if (!v) return 0;
    const s = String(v).trim().replace(' ', 'T');
    const d = new Date(s);
    const t = d.getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  // ✅ 메시지별 “안읽은 사람 수”
  const calcUnreadCount = message => {
    if (!message) return 0;

    const createdAtMs = toMsLocal(message.createdAt);
    if (!createdAtMs) return 0;

    const senderId =
      message?.sender?.userId ??
      message?.senderId ??
      message?.userId ??
      null;

    const users = Array.isArray(mentionUsers) ? mentionUsers : [];
    if (users.length === 0) return 0;

    const map = readPointersMap || {};

    let count = 0;

    for (const u of users) {
      const uid = u?.userId ?? u?.id ?? null;
      if (uid == null) continue;

      // ✅ 보낸 사람 제외
      if (senderId != null && String(uid) === String(senderId)) continue;

      const lastReadAt = map?.[String(uid)] ?? null;

      // lastReadAt이 없으면 = 안읽음
      if (!lastReadAt) {
        count += 1;
        continue;
      }

      const lastReadMs = toMsLocal(lastReadAt);
      if (lastReadMs < createdAtMs) count += 1;
    }

    if (!Number.isFinite(count) || count < 0) return 0;
    return count;
  };

  // =========================
  // 1) 키노 인트로
  // =========================
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

  // =========================
  // 2) 유저 메시지 이후 키노 타이핑
  // =========================
  useEffect(() => {
    if (!isKino) return;
    if (!isInitialLoaded) return;
    if (!messageList || messageList.length === 0) return;
    if (introSequenceRunning) return;

    const latest = messageList[0];

    if (!latest || String(latest.senderId) !== String(userId)) {
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

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setShowKinoTyping(true);
    }, 500);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [messageList, isKino, userId, introSequenceRunning, isInitialLoaded]);

  const roomKey = chatRoom?.chatRoomId ?? 'no-room';

  const kinoIntroMessage = {
    messageId: `kino-intro-${roomKey}`,
    senderId: 0,
    content:
      '안녕하세요! 저는 키노예요! 가족들이 하루 동안 느낀 일들, 나누고 싶은 순간들, 그 모든 따뜻한 기록을 한곳에 모아주는 역할을 하고 있어요. 여기선 무엇이든 편하게 말해줘요. 다 소중한 이야기니까요!',
    createdAt: new Date().toISOString(),
    localType: 'kinoIntro',
  };

  const kinoTypingMessage = {
    messageId: `kino-typing-${roomKey}`,
    senderId: 0,
    content: '',
    createdAt: new Date().toISOString(),
    localType: 'kinoTyping',
  };

  const finalMessages = useMemo(() => {
    let result = [...(messageList ?? [])]; // ✅ DESC 유지

    if (isKino && isInitialLoaded) {
      if (showIntroMessage) result = [...result, kinoIntroMessage];
      if (showKinoTyping) result = [kinoTypingMessage, ...result];
    }

    return result;
  }, [messageList, isKino, showIntroMessage, showKinoTyping, isInitialLoaded]);

  return (
    <FlatList
      ref={flatListRef}
      data={finalMessages}
      keyExtractor={(item, index) => {
        if (item?.clientMessageId) return `cid-${String(item.clientMessageId)}`;
        if (item?.messageId) return String(item.messageId);
        if (item?.localType) return `${item.localType}_${item.createdAt ?? index}`;
        return `${item?.senderId ?? 'x'}_${item?.createdAt ?? 't'}_${index}`;
      }}
      renderItem={({item, index}) => {
        const prev = finalMessages[index + 1];

        const prevDate = prev?.createdAt
          ? new Date(prev.createdAt).toDateString()
          : null;

        const curDate = item?.createdAt
          ? new Date(item.createdAt).toDateString()
          : '';

        const shouldShowDate = curDate !== prevDate;
        const isGrouped = String(prev?.senderId) === String(item?.senderId);

        // ✅ 키노 인트로/타이핑은 읽음 숫자 붙이지 않기
        const isLocalKino =
          item?.localType === 'kinoTyping' || item?.localType === 'kinoIntro';

        const unreadCount = isLocalKino ? 0 : calcUnreadCount(item);

        return (
          <ChatMessageItem
            chatRoom={chatRoom}
            message={item}
            currentUserId={userId}
            isKino={isKino}
            kinoType={chatRoom?.kinoType}
            shouldShowDate={shouldShowDate}
            isGrouped={isGrouped}
            mentionUsers={mentionUsers}
            unreadCount={unreadCount}
          />
        );
      }}
      inverted
      onEndReached={noMoreMessages ? null : loadOlderMessages}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingMore ? <ActivityIndicator size="small" color="#aaa" /> : null
      }
      ListHeaderComponent={<View style={{height: getResponsiveHeight(20)}} />}
      removeClippedSubviews={false}
      onScroll={handleScroll}
      scrollEventThrottle={30}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}
