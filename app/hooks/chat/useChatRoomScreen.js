// ✅ scrollToBottom 조건 수정: 유저가 가장 아래에 있을 때만 실행

import {useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchMoreMessagesThunk,
  fetchMessageThunk,
} from '../../redux/thunk/messageThunk';
import {getToken} from '../../utils/storage';
import {addMessage} from '../../redux/slices/messageSlice';

export default function useChatRoomScreen(chatRoom, user, isKino) {
  const flatListRef = useRef(null);
  const dispatch = useDispatch();
  const messageList = useSelector(state => state.message?.messageList || []);
  const socketRef = useRef(null);

  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const isAtBottomRef = useRef(true); // ✅ 가장 아래에 있는지 여부

  const scrollToBottom = () => {
    if (
      isAtBottomRef.current &&
      flatListRef.current &&
      messageList.length > 0
    ) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: true,
        viewPosition: 0,
      });
    }
  };

  const handleScroll = event => {
    const y = event.nativeEvent.contentOffset.y;
    isAtBottomRef.current = y <= 50; // ✅ 스크롤 위치 감지
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
          if (isAtBottomRef.current) {
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
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
    if (isAtBottomRef.current && messageList.length > 0) {
      scrollToBottom();
    }
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
