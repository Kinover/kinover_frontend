// components/MessageFlatList.jsx
import React, {useEffect, useState, useMemo, useRef, useCallback} from 'react';
import {FlatList, ActivityIndicator, View} from 'react-native';
import ChatMessageItem from './chatMessageItem';
import {getResponsiveHeight} from 'utils/responsive';

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
  scrollToBottom: _scrollToBottom,
  isMessageFetched,

  mentionUsers,

  // ✅ 추가: { [userId]: lastReadAt }
  readPointersMap,
}) {
  const [showKinoTyping, setShowKinoTyping] = useState(false);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);

  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    setIsInitialLoaded(false);
    setShowKinoTyping(false);

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

  const sortKey = useCallback(
    m =>
      String(
        m?.messageId ??
          m?.clientMessageId ??
          `${m?.senderId ?? m?.userId ?? 'x'}_${m?.createdAt ?? ''}`,
      ),
    [],
  );

  // 참가자/리드포인터를 미리 정규화해서 메시지 렌더 루프에서 반복 계산을 줄인다.
  const participantIds = useMemo(() => {
    const users = Array.isArray(mentionUsers) ? mentionUsers : [];
    return users
      .map(u => u?.userId ?? u?.id ?? null)
      .filter(v => v != null)
      .map(v => String(v));
  }, [mentionUsers]);

  const readAtMsByUserId = useMemo(() => {
    const map = new Map();
    const pointers = readPointersMap || {};
    participantIds.forEach(uid => {
      map.set(uid, toMsLocal(pointers[uid]));
    });
    return map;
  }, [participantIds, readPointersMap]);

  // =========================
  // 유저 메시지 이후 키노 타이핑
  // =========================
  useEffect(() => {
    if (!isKino) return;
    if (!isInitialLoaded) return;
    if (!messageList || messageList.length === 0) return;
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
  }, [messageList, isKino, userId, isInitialLoaded]);

  const roomKey = chatRoom?.chatRoomId ?? 'no-room';
  const syntheticCreatedAt = useMemo(() => new Date().toISOString(), [roomKey]);

  const kinoTypingMessage = useMemo(
    () => ({
      messageId: `kino-typing-${roomKey}`,
      senderId: 0,
      content: '',
      createdAt: syntheticCreatedAt,
      localType: 'kinoTyping',
    }),
    [roomKey, syntheticCreatedAt],
  );

  const finalMessages = useMemo(() => {
    let result = [...(messageList ?? [])].sort((a, b) => {
      const diff = toMsLocal(b?.createdAt) - toMsLocal(a?.createdAt);
      if (diff !== 0) return diff;
      return sortKey(b).localeCompare(sortKey(a));
    });

    if (isKino && isInitialLoaded && showKinoTyping) {
      result = [kinoTypingMessage, ...result];
    }

    return result;
  }, [
    messageList,
    isKino,
    showKinoTyping,
    isInitialLoaded,
    kinoTypingMessage,
    sortKey,
  ]);

  const latestRealMessageId = useMemo(() => {
    const firstReal = (finalMessages || []).find(
      m => m?.localType !== 'kinoTyping',
    );
    if (!firstReal) return null;
    return (
      firstReal?.clientMessageId ||
      firstReal?.messageId ||
      `${firstReal?.senderId ?? 'x'}_${firstReal?.createdAt ?? ''}`
    );
  }, [finalMessages]);

  const decoratedMessages = useMemo(() => {
    const countUnread = message => {
      if (!message) return 0;
      if (participantIds.length === 0) return 0;

      const createdAtMs = toMsLocal(message?.createdAt);
      if (!createdAtMs) return 0;

      const senderId =
        message?.sender?.userId ??
        message?.senderId ??
        message?.userId ??
        null;
      const senderIdStr = senderId == null ? null : String(senderId);

      let count = 0;
      for (const uid of participantIds) {
        if (senderIdStr && uid === senderIdStr) continue;

        const lastReadMs = readAtMsByUserId.get(uid) || 0;
        if (!lastReadMs || lastReadMs < createdAtMs) count += 1;
      }

      if (!Number.isFinite(count) || count < 0) return 0;
      return count;
    };

    return finalMessages.map((item, index) => {
      const prev = finalMessages[index + 1];
      const prevDate = prev?.createdAt
        ? new Date(prev.createdAt).toDateString()
        : null;
      const curDate = item?.createdAt
        ? new Date(item.createdAt).toDateString()
        : '';
      const shouldShowDate = curDate !== prevDate;
      const isGrouped = String(prev?.senderId) === String(item?.senderId);
      const isLocalKino = item?.localType === 'kinoTyping';
      const unreadCount = isLocalKino ? 0 : countUnread(item);
      const itemStableId =
        item?.clientMessageId ||
        item?.messageId ||
        `${item?.senderId ?? 'x'}_${item?.createdAt ?? ''}`;
      const forceShowTime = latestRealMessageId === itemStableId;

      return {
        message: item,
        shouldShowDate,
        isGrouped,
        unreadCount,
        forceShowTime,
      };
    });
  }, [finalMessages, latestRealMessageId, participantIds, readAtMsByUserId]);

  const renderMessageItem = useCallback(
    ({item}) => (
      <ChatMessageItem
        message={item.message}
        currentUserId={userId}
        isKino={isKino}
        kinoType={chatRoom?.kinoType}
        shouldShowDate={item.shouldShowDate}
        isGrouped={item.isGrouped}
        mentionUsers={mentionUsers}
        unreadCount={item.unreadCount}
        forceShowTime={item.forceShowTime}
      />
    ),
    [userId, isKino, chatRoom?.kinoType, mentionUsers],
  );

  return (
    <FlatList
      ref={flatListRef}
      data={decoratedMessages}
      keyExtractor={(item, index) => {
        const message = item?.message;
        if (message?.clientMessageId) return `cid-${String(message.clientMessageId)}`;
        if (message?.messageId) return String(message.messageId);
        if (message?.localType) {
          return `${message.localType}_${message.createdAt ?? index}`;
        }
        return `${message?.senderId ?? 'x'}_${message?.createdAt ?? 't'}_${index}`;
      }}
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      windowSize={9}
      removeClippedSubviews={true}
      renderItem={renderMessageItem}
      inverted
      onEndReached={noMoreMessages ? null : loadOlderMessages}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        isFetchingMore ? <ActivityIndicator size="small" color="#aaa" /> : null
      }
      ListHeaderComponent={<View style={{height: getResponsiveHeight(20)}} />}
      onScroll={handleScroll}

      // ✅✅ 변경 1) 스크롤 이벤트 촘촘하게(부드러움 + 바닥판단 안정)
      scrollEventThrottle={16}

      // ✅✅ 변경 2) 키보드 열린 채로 스크롤 가능하게 (터치가 키보드로 빨려가지 않게)
      keyboardShouldPersistTaps="handled"

      // ✅✅ 변경 3) 스크롤 드래그로 키보드가 내려가며 제스처가 뻣뻣해지는 걸 방지
      keyboardDismissMode="none"

      // ✅✅ 변경 4) 안드로이드 중첩/제스처 충돌 완화
      nestedScrollEnabled
    />
  );
}
