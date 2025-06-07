import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchMessageThunk, fetchMoreMessagesThunk } from '../redux/thunk/messageThunk';
import { addMessage } from '../redux/slices/messageSlice';
import { getToken } from '../utils/storage';

export default function useChatRoom({ chatRoom, user, scrollToBottom }) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const scrollTimeout = useRef(null);

  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // 초기 메시지 로드
  useEffect(() => {
    if (chatRoom?.chatRoomId) {
      dispatch(fetchMessageThunk(chatRoom.chatRoomId));
      setNoMoreMessages(false);
    }
  }, [chatRoom?.chatRoomId]);

  // WebSocket 연결
  useEffect(() => {
    const setupWebSocket = async () => {
      const token = await getToken();
      if (!chatRoom || !user?.userId || !token) return;

      if (socketRef.current) socketRef.current.close();

      const ws = new WebSocket(`ws://kinover.shop:9090/chat?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => console.log('✅ WebSocket 연결 성공');
      ws.onmessage = e => {
        try {
          const msg = JSON.parse(e.data);
          dispatch(addMessage(msg));
          if (!isUserScrolling && scrollToBottom) scrollToBottom();
        } catch (err) {
          console.error('❌ 수신 메시지 파싱 실패:', err);
        }
      };
      ws.onerror = err => console.error('⚠️ WebSocket 오류:', err);
      ws.onclose = () => console.log('🔌 WebSocket 종료');
    };

    setupWebSocket();
    return () => socketRef.current?.close();
  }, [chatRoom?.chatRoomId, user?.userId]);

  // 오래된 메시지 로딩
  const loadOlderMessages = async (messageList) => {
    if (isFetchingMore || noMoreMessages || !messageList.length) return;
    setIsFetchingMore(true);

    const oldest = messageList[messageList.length - 1];
    const result = await dispatch(
      fetchMoreMessagesThunk(chatRoom.chatRoomId, oldest?.createdAt)
    );
    if (result.payload?.length === 0) setNoMoreMessages(true);
    setIsFetchingMore(false);
  };

  const handleScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setIsUserScrolling(false), 1000);
  };

  return {
    socketRef,
    noMoreMessages,
    setNoMoreMessages,
    isUserScrolling,
    isFetchingMore,
    loadOlderMessages,
    handleScroll,
  };
}
