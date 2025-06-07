import {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import useChatRoom from './useChatRoom';
import {getToken} from '../utils/storage';
import {fetchMessageThunk} from '../redux/thunk/messageThunk';
import {addMessage} from '../redux/slices/messageSlice';

export default function useChatRoomScreen(chatRoom, user, isKino) {
  const flatListRef = useRef(null);
  const dispatch = useDispatch();
  const {messageList} = useSelector(state => state.message);

  const scrollToBottom = () => {
    if (flatListRef.current && messageList.length > 0) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: true,
        viewPosition: 0,
      });
    }
  };

  const {
    socketRef,
    noMoreMessages,
    setNoMoreMessages,
    isUserScrolling,
    isFetchingMore,
    loadOlderMessages,
    handleScroll,
  } = useChatRoom({chatRoom, user, scrollToBottom});

  useEffect(() => {
    if (chatRoom?.chatRoomId) {
      dispatch(fetchMessageThunk(chatRoom.chatRoomId));
      setNoMoreMessages(false);
    }
  }, [chatRoom?.chatRoomId]);

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
          if (!isUserScrolling) scrollToBottom();
        } catch (err) {
          console.error('❌ 메시지 파싱 실패:', err);
        }
      };
      ws.onerror = err => console.error('⚠️ WebSocket 오류:', err);
      ws.onclose = () => console.log('🔌 WebSocket 종료');
    };

    setupWebSocket();
    return () => socketRef.current?.close();
  }, [chatRoom?.chatRoomId, user?.userId]);

  useEffect(() => {
    if (!isUserScrolling && messageList.length > 0) scrollToBottom();
  }, [messageList.length]);

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
