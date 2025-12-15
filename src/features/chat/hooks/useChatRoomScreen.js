// src/features/chat/hooks/useChatRoomScreen.js
// ✅ 소켓 제거 버전 (화면은 Redux 구독 + 스크롤/페이징만)

import {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMoreMessagesThunk} from '../store/messageThunk';
import {initRoom, selectRoomMessages, selectRoomMeta} from '../store/messageSlice';

export default function useChatRoomScreen(chatRoom, userId, isKino) {
  const dispatch = useDispatch();

  /** =====================
   * Room ID
   * ===================== */
  const roomId = useMemo(() => {
    const id = chatRoom?.chatRoomId;
    return id == null ? null : String(id);
  }, [chatRoom?.chatRoomId]);

  const messageList = useSelector(state => selectRoomMessages(state, roomId));
  const roomMeta = useSelector(state => selectRoomMeta(state, roomId));

  /** =====================
   * Refs / State
   * ===================== */
  const flatListRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  /** =====================
   * Scroll helpers
   * ===================== */
  const scrollToBottom = useCallback(() => {
    if (!flatListRef.current) return;
    // inverted FlatList 기준이면 offset 0이 바닥
    flatListRef.current.scrollToOffset({offset: 0, animated: true});
  }, []);

  const handleScroll = useCallback(event => {
    const y = event?.nativeEvent?.contentOffset?.y ?? 0;
    isAtBottomRef.current = y <= 50;
    setIsUserScrolling(!isAtBottomRef.current);
  }, []);

  /** =====================
   * Load older messages (pagination)
   * ===================== */
  const loadOlderMessages = useCallback(async () => {
    if (!roomId) return;
    if (isFetchingMore || noMoreMessages || !messageList || messageList.length === 0)
      return;

    setIsFetchingMore(true);

    const before = roomMeta?.cursor ?? messageList[messageList.length - 1]?.createdAt;

    const {payload} = await dispatch(fetchMoreMessagesThunk(roomId, before));

    if (!payload || payload.length < 20) {
      setNoMoreMessages(true);
    }

    setIsFetchingMore(false);
  }, [
    dispatch,
    roomId,
    isFetchingMore,
    noMoreMessages,
    messageList,
    roomMeta?.cursor,
  ]);

  /** =====================
   * Init room (중요)
   * ===================== */
  useEffect(() => {
    if (!roomId) return;

    dispatch(initRoom(roomId));

    isAtBottomRef.current = true;
    setIsUserScrolling(false);
    setNoMoreMessages(false);

    // 방 진입 직후 맨 아래로
    if (!roomMeta?.isFetched) {
      setTimeout(scrollToBottom, 0);
    }
  }, [roomId, dispatch, roomMeta?.isFetched, scrollToBottom]);

  /** =====================
   * 메시지 변화 시 자동 스크롤
   * ===================== */
  useEffect(() => {
    if (!messageList || messageList.length === 0) return;

    // ✅ 맨 아래 붙어있을 때는 상대/내 메시지 상관없이 내려주기
    if (isAtBottomRef.current) {
      setTimeout(scrollToBottom, 0);
    }
  }, [messageList?.length, scrollToBottom]);

  /** =====================
   * Return
   * ===================== */
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
  };
}
