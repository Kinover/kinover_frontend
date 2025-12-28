// src/features/chat/hooks/useChatRoomScreen.js
import {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMoreMessagesThunk} from '../store/messageThunk';
import {initRoom, selectRoomMessages, selectRoomMeta} from '../store/messageSlice';

export default function useChatRoomScreen(chatRoom, userId, isKino) {
  const dispatch = useDispatch();

  const roomId = useMemo(() => {
    const id = chatRoom?.chatRoomId;
    return id == null ? null : String(id);
  }, [chatRoom?.chatRoomId]);

  const messageList = useSelector(state => selectRoomMessages(state, roomId));
  const roomMeta = useSelector(state => selectRoomMeta(state, roomId));

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

    const before =
      roomMeta?.cursor ?? messageList[messageList.length - 1]?.createdAt;

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

  useEffect(() => {
    if (!roomId) return;

    dispatch(initRoom(roomId));

    isAtBottomRef.current = true;
    setIsUserScrolling(false);
    setNoMoreMessages(false);

    if (!roomMeta?.isFetched) {
      setTimeout(scrollToBottom, 0);
    }
  }, [roomId, dispatch, roomMeta?.isFetched, scrollToBottom]);

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
