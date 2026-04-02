// src/features/chat/hooks/useChatRoomScreen.js
// RTK Query 마이그레이션:
//   - messageList: useSelector(selectRoomMessages) → useGetMessagesQuery
//   - fetchMoreMessages: dispatch(fetchMoreMessagesThunk) → useLazyGetMessagesQuery

import {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {useDispatch} from 'react-redux';
import {initRoom} from '../store/messageSlice';
import {useGetMessagesQuery, useLazyGetMessagesQuery} from '../services/chatApi';

export default function useChatRoomScreen(chatRoom, _userId, _isKino) {
  const dispatch = useDispatch();

  const roomId = useMemo(() => {
    const id = chatRoom?.chatRoomId;
    return id == null ? null : String(id);
  }, [chatRoom?.chatRoomId]);

  // RTK Query 캐시에서 메시지 읽기
  const {data: messageList = []} = useGetMessagesQuery(
    {chatRoomId: roomId},
    {skip: !roomId},
  );

  // 페이지네이션용 lazy query
  const [fetchMoreMessages] = useLazyGetMessagesQuery();

  const flatListRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (!flatListRef.current) return;
    flatListRef.current.scrollToOffset({offset: 0, animated: true}); // inverted 기준
  }, []);

  const handleScroll = useCallback(event => {
    const y = event?.nativeEvent?.contentOffset?.y ?? 0;
    isAtBottomRef.current = y <= 50;
    setIsUserScrolling(!isAtBottomRef.current);
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!roomId) return;
    if (isFetchingMore || noMoreMessages || !messageList || messageList.length === 0)
      return;

    setIsFetchingMore(true);

    // 가장 오래된 메시지의 createdAt을 before 커서로 사용
    const before = messageList[messageList.length - 1]?.createdAt;
    if (!before) {
      setNoMoreMessages(true);
      setIsFetchingMore(false);
      return;
    }

    try {
      const result = await fetchMoreMessages(
        {chatRoomId: roomId, before},
        /* preferCacheValue */ false,
      ).unwrap();

      // 20개 미만이면 더 이상 불러올 메시지 없음
      if (!result || result.length < 20) {
        setNoMoreMessages(true);
      }
    } catch {
      // 에러는 apiClient 인터셉터가 처리
    } finally {
      setIsFetchingMore(false);
    }
  }, [
    fetchMoreMessages,
    roomId,
    isFetchingMore,
    noMoreMessages,
    messageList,
  ]);

  useEffect(() => {
    if (!roomId) return;

    dispatch(initRoom(roomId));

    isAtBottomRef.current = true;
    setIsUserScrolling(false);
    setNoMoreMessages(false);
  }, [roomId, dispatch]);

  useEffect(() => {
    if (!messageList || messageList.length === 0) return;
    if (isAtBottomRef.current) {
      setTimeout(scrollToBottom, 0);
    }
  }, [messageList?.length, scrollToBottom]);

  return {
    flatListRef,
    messageList,

    noMoreMessages,
    setNoMoreMessages,

    isFetchingMore,
    loadOlderMessages,

    handleScroll,
    scrollToBottom,

    isUserScrolling,
    isAtBottomRef,
  };
}
