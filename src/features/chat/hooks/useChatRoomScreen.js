import {useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMessageThunk, fetchMoreMessagesThunk} from '../store/messageThunk';
import {addMessage} from '../store/messageSlice';
import {getToken} from 'utils/storage';

// ✅ userId 숫자를 받도록 변경
export default function useChatRoomScreen(chatRoom, userId, isKino) {
  const messageList = useSelector(state => state.message?.messageList || []);

  const flatListRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const scrollToBottom = () => {
    if (
      isAtBottomRef.current &&
      flatListRef.current &&
      messageList.length > 0
    ) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: true,
        viewPosition: 30,
      });
    }
  };

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

  useEffect(() => {
    const setupWebSocket = async () => {
      const token = await getToken();

      console.log('[WS /chat] params', {
        chatRoomId: chatRoom?.chatRoomId,
        userId,
        hasToken: !!token,
      });

      // ✅ 숫자 userId 기준으로 조건 체크
      if (!chatRoom?.chatRoomId || !userId || !token) {
        console.log('[WS /chat] 필수 값 없음, 연결 안 함');
        return;
      }

      if (socketRef.current) {
        socketRef.current.close();
      }

      const ws = new WebSocket(`ws://kinover.shop:9090/chat?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => console.log('✅ WebSocket /chat 연결 성공');
      // ws.onmessage = e => {
      //   try {
      //     const msg = JSON.parse(e.data);
      //     dispatch(addMessage(msg));
      //     if (isAtBottomRef.current) {
      //       setTimeout(scrollToBottom, 100);
      //     }
      //   } catch (err) {
      //     console.error('❌ 메시지 파싱 실패:', err);
      //   }
      // };
      ws.onmessage = e => {
        try {
          const msg = JSON.parse(e.data);
          dispatch(addMessage(msg));
      
          const isMyMessage = msg.senderId === userId;
      
          // 최신 위치에 있고 + 내가 보낸 메시지일 때만 부드럽게 붙어주기
          if (isAtBottomRef.current && isMyMessage) {
            setTimeout(scrollToBottom, 80);
          }
        } catch (err) {
          console.error('❌ 메시지 파싱 실패:', err);
        }
      };
      ws.onerror = err => console.error('⚠️ WebSocket 오류:', err);
      ws.onclose = () => console.log('🔌 WebSocket 종료');
    };

    setupWebSocket();
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [chatRoom?.chatRoomId, userId]); // ✅ userId 의존성으로 사용

  useEffect(() => {
    if (isAtBottomRef.current && messageList.length > 0) {
      scrollToBottom();
    }
  }, [messageList.length]); // scrollToBottom 은 함수라 dep 에 안 넣는 게 안전

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
