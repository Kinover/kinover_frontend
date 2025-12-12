import {useEffect, useRef, useState, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMessageThunk, fetchMoreMessagesThunk} from '../store/messageThunk';
import {addMessage} from '../store/messageSlice';
import {getToken} from 'utils/storage';

export default function useChatRoomScreen(chatRoom, userId, isKino) {
  const messageList = useSelector(state => state.message?.messageList || []);

  const flatListRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const dispatch = useDispatch();

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

  const handleScroll = event => {
    const y = event.nativeEvent.contentOffset.y;
    isAtBottomRef.current = y <= 50;
    setIsUserScrolling(!isAtBottomRef.current);
  };

  const loadOlderMessages = async () => {
    if (isFetchingMore || noMoreMessages || messageList.length === 0) return;

    setIsFetchingMore(true);
    const oldest = messageList[messageList.length - 1];
    const {payload} = await dispatch(
      fetchMoreMessagesThunk(chatRoom.chatRoomId, oldest.createdAt),
    );

    if (!payload || payload.length < 20) {
      setNoMoreMessages(true);
    }

    setIsFetchingMore(false);
  };

  useEffect(() => {
    if (chatRoom?.chatRoomId) {
      dispatch(fetchMessageThunk(chatRoom.chatRoomId));
      setNoMoreMessages(false);
    }
  }, [chatRoom?.chatRoomId, dispatch]);

  const connect = useCallback(async () => {
    const roomId = chatRoom?.chatRoomId;
    if (!roomId || !userId) return;

    const token = await getToken();
    if (!token) return;

    // ✅ 같은 방인데 이미 살아있으면 재연결 금지
    if (
      prevRoomIdRef.current === roomId &&
      socketRef.current &&
      socketRef.current.readyState === 1
    ) {
      return;
    }

    prevRoomIdRef.current = roomId;

    // 기존 소켓/타이머 정리
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    socketRef.current?.close();

    console.log('[WS /chat] connect', {roomId, userId});

    const ws = new WebSocket(`ws://kinover.shop:9090/chat?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      console.log('✅ WebSocket /chat 연결 성공');
    };

    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        dispatch(addMessage(msg));

        const isMyMessage = msg.senderId === userId;
        if (isAtBottomRef.current && isMyMessage) {
          setTimeout(scrollToBottom, 80);
        }
      } catch (err) {
        console.error('❌ 메시지 파싱 실패:', err);
      }
    };

    ws.onerror = err => {
      console.error('⚠️ WebSocket 오류:', err);
    };

    ws.onclose = e => {
      console.log('🔌 WebSocket 종료', {
        code: e.code,
        reason: e.reason,
        wasClean: e.wasClean,
      });

      // ✅ 간단 재연결 (너무 빡세지 않게 1~5초 백오프)
      const attempt = reconnectAttemptRef.current++;
      const delay = Math.min(1000 * (attempt + 1), 5000);

      reconnectTimerRef.current = setTimeout(() => {
        // 화면이 살아있고 같은 방일 때만 재연결
        if (prevRoomIdRef.current === roomId) connect();
      }, delay);
    };
  }, [chatRoom?.chatRoomId, userId, dispatch, scrollToBottom]);

  useEffect(() => {
    connect();

    return () => {
      // 방 나갈 때만 정리
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  useEffect(() => {
    if (isAtBottomRef.current && messageList.length > 0) {
      scrollToBottom();
    }
  }, [messageList.length, scrollToBottom]);

  return {
    flatListRef,
    messageList,
    setNoMoreMessages,
    noMoreMessages,
    isFetchingMore,
    loadOlderMessages,
    handleScroll,
    scrollToBottom,
    socketRef,
    isUserScrolling,
  };
}

