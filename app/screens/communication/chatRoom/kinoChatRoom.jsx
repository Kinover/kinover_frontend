import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import ChatInput from './chatInput';
import ChatMessageItem from './chatMessageItem';
import {
  fetchMessageThunk,
  fetchMoreMessagesThunk,
} from '../../../redux/thunk/messageThunk';
import {addMessage, setMessageList} from '../../../redux/slices/messageSlice';
import {getToken} from '../../../utils/storage';

export default function KinoChatRoom({route}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {chatRoom, user} = route.params || {};
  const {messageList, isLoading} = useSelector(state => state.message);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeout = useRef(null);

  // ✅ 초기 메시지 불러오기
  useEffect(() => {
    if (chatRoom?.chatRoomId) {
      dispatch(fetchMessageThunk(chatRoom.chatRoomId));
      setNoMoreMessages(false);
    }
  }, [chatRoom?.chatRoomId]);

  // ✅ WebSocket 연결
  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await getToken();
      if (!chatRoom || !user?.userId || !token) return;

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      const ws = new WebSocket(`ws://43.200.47.242:9090/chat?token=${token}`);

      ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공');
      };

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          console.log('📥 수신:', message);
          dispatch(addMessage(message));

          // ✅ 사용자가 스크롤 중이 아닐 때만 자동 스크롤
          if (!isUserScrolling) {
            setTimeout(() => scrollToBottom(), 100);
          }
        } catch (err) {
          console.error('❌ 수신 메시지 파싱 실패:', err);
        }
      };

      ws.onerror = err => console.error('⚠️ WebSocket 오류:', err);
      ws.onclose = () => console.log('🔌 WebSocket 종료');
      socketRef.current = ws;
    };

    connectWebSocket();

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [chatRoom?.roomId, user?.userId]);

  // ✅ 스크롤 이동 함수
  const scrollToBottom = () => {
    if (flatListRef.current && messageList.length > 0) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: true,
        viewPosition: 0,
      });
    }
  };

  // ✅ 메시지 수신 시 자동 스크롤
  useEffect(() => {
    if (messageList.length > 0 && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messageList.length]);

  // ✅ 더 이전 메시지 로딩
  const loadOlderMessages = async () => {
    if (isFetchingMore || noMoreMessages || messageList.length === 0) return;

    setIsFetchingMore(true);
    const oldest = messageList[messageList.length - 1];
    const result = await dispatch(
      fetchMoreMessagesThunk(chatRoom.chatRoomId, oldest?.createdAt),
    );

    if (result.payload?.length === 0) {
      setNoMoreMessages(true);
    }

    setIsFetchingMore(false);
  };

  // ✅ 사용자 스크롤 감지 핸들러
  const handleScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000); // 사용자가 멈춘 뒤 1초 후 감지 해제
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messageList}
        keyExtractor={item => `${item.messageId}_${item.createdAt}`}
        renderItem={({item, index}) => {
          const next = messageList[index + 1];
          const isSameSender = next?.senderId === item.senderId;

          return (
            <ChatMessageItem
              chatRoom={chatRoom}
              message={item}
              currentUserId={user.userId}
              isKino={chatRoom.kino}
              isSameSender={isSameSender}
            />
          );
        }}
        inverted
        onEndReached={noMoreMessages ? null : loadOlderMessages}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingMore && <ActivityIndicator size="small" color="#aaa" />
        }
        contentContainerStyle={{flexGrow: 1}}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}
        removeClippedSubviews={false}
        onScroll={handleScroll} // ✅ 사용자 스크롤 감지
        scrollEventThrottle={100}
        onScrollToIndexFailed={() => {
          setTimeout(() => scrollToBottom(), 300);
        }}
      />

      <ChatInput
        chatRoom={chatRoom}
        user={user}
        socketRef={socketRef}
        setMessageList={setMessageList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: '15%',
  },
});
