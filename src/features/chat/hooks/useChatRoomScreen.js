import {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMoreMessagesThunk} from '../store/messageThunk';
import {
  addMessage,
  initRoom,
  selectRoomMessages,
  selectRoomMeta,
} from '../store/messageSlice';
import {getToken} from 'utils/storage';

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

  const socketRef = useRef(null);
  const prevRoomIdRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (!flatListRef.current) return;
    flatListRef.current.scrollToOffset({offset: 0, animated: true});
  }, []);

  const handleScroll = useCallback(event => {
    const y = event?.nativeEvent?.contentOffset?.y ?? 0;
    isAtBottomRef.current = y <= 50;
    setIsUserScrolling(!isAtBottomRef.current);
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!roomId) return;
    if (isFetchingMore || noMoreMessages || messageList.length === 0) return;

    setIsFetchingMore(true);

    const before =
      roomMeta?.cursor ?? messageList[messageList.length - 1]?.createdAt;

    const {payload} = await dispatch(fetchMoreMessagesThunk(roomId, before));

    if (!payload || payload.length < 20) setNoMoreMessages(true);

    setIsFetchingMore(false);
  }, [
    dispatch,
    roomId,
    isFetchingMore,
    noMoreMessages,
    messageList,
    roomMeta?.cursor,
  ]);

  // ✅ room init만 하고, “초기 fetch”는 Screen에서만 함
  useEffect(() => {
    if (!roomId) return;
    dispatch(initRoom(roomId));

    isAtBottomRef.current = true;
    setIsUserScrolling(false);
    setNoMoreMessages(false);
  }, [roomId, dispatch]);

  const cleanupSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      try {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
      } catch {
        null;
      }
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!roomId || !userId) return;

    const tokenRaw = await getToken();
    if (!tokenRaw) return;

    const token = encodeURIComponent(tokenRaw);

    if (
      prevRoomIdRef.current === roomId &&
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN
    )
      return;

    prevRoomIdRef.current = roomId;

    cleanupSocket();

    const ws = new WebSocket(`ws://kinover.shop:9090/chat?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      console.log('✅ WebSocket /chat 연결 성공');
    };

    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        const incomingRoomId = String(msg?.chatRoomId ?? roomId);

        dispatch(addMessage({chatRoomId: incomingRoomId, message: msg}));

        const isMyMessage = String(msg?.senderId) === String(userId);
        if (isAtBottomRef.current && isMyMessage) {
          setTimeout(scrollToBottom, 50);
        }
      } catch (err) {
        console.error('❌ 메시지 파싱 실패:', err);
      }
    };

    ws.onerror = err => {
      console.error('⚠️ WebSocket 오류:', err?.message ?? err);
    };

    ws.onclose = e => {
      const attempt = reconnectAttemptRef.current++;
      const delay = Math.min(1000 * (attempt + 1), 5000);

      reconnectTimerRef.current = setTimeout(() => {
        if (prevRoomIdRef.current === roomId) connect();
      }, delay);
    };
  }, [roomId, userId, dispatch, scrollToBottom, cleanupSocket]);

  useEffect(() => {
    connect();
    return () => {
      cleanupSocket();
      prevRoomIdRef.current = null;
    };
  }, [connect, cleanupSocket]);

  useEffect(() => {
    if (!messageList || messageList.length === 0) return;
    if (isAtBottomRef.current) scrollToBottom();
  }, [messageList.length, scrollToBottom]);

  return {
    flatListRef,
    messageList,

    noMoreMessages,
    setNoMoreMessages,

    isFetchingMore,
    loadOlderMessages,

    handleScroll,
    scrollToBottom,

    socketRef,
    isUserScrolling,
  };
}
