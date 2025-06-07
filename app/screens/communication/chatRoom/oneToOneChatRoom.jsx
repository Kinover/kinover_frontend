import React, {useEffect, useRef, useState} from 'react';
import {View, FlatList, ActivityIndicator, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useLayoutEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import ChatInput from './chat/chatInput';
import ChatMessageItem from './chat/chatMessageItem';
import {SafeAreaView} from 'react-native';
import ChatSettings from './setting/chatSetting';
import { Text } from 'react-native';
import {
  fetchMessageThunk,
  fetchMoreMessagesThunk,
} from '../../../redux/thunk/messageThunk';
import {addMessage, setMessageList} from '../../../redux/slices/messageSlice';
import {getToken} from '../../../utils/storage';
import {RenderHeaderRightChatSetting} from '../../../navigation/tabHeaderHelpers';

export default function OneToOneChatRoom({route}) {
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RenderHeaderRightChatSetting setIsSettingsOpen={setIsSettingsOpen} />
      ),
    });
  }, [navigation]);

  const onLeaveChat = () => {
    dispatch(leaveChatRoomThunk(chatRoom.chatRoomId))
      .unwrap()
      .then(() => {
        Alert.alert('채팅방을 나갔습니다.');
        navigation.goBack();
      })
      .catch(err => {
        console.error('❌ 나가기 실패:', err);
        Alert.alert(
          '채팅방 나가기 실패',
          typeof err === 'string' ? err : '다시 시도해 주세요',
        );
      });
  };

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

      const ws = new WebSocket(`ws://kinover.shop:9090/chat?token=${token}`);

      ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공');
      };

      ws.onmessage = event => {
        try {
          const message = JSON.parse(event.data);
          console.log('📥 수신:', message);
          dispatch(addMessage(message));
          if (!isUserScrolling) {
            setTimeout(() => scrollToBottom(), 100);
          }
        } catch (err) {
          console.error('❌ 메시지 파싱 실패:', err);
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

  // ✅ 하단 자동 스크롤
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

  // ✅ 과거 메시지 불러오기
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

  // ✅ 사용자 스크롤 감지
  const handleScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
  };


  useEffect(() => {
    if (chatRoom) {
      navigation.setOptions({
        headerTitle: () => (
          <Text
            style={{
              fontFamily: 'Pretendard-Regular', // ✅ 원하는 폰트로 변경!
              fontSize: 19,
              color: '#333', // 또는 원하는 색상
            }}>
            {chatRoom.roomName}
          </Text>
        ),
      });
    }
  }, [chatRoom, navigation]);
  

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messageList}
        keyExtractor={item => `${item.messageId}_${item.createdAt}`}
        renderItem={({item, index}) => {
          const next = messageList[index + 1];
          const isSameSender = next?.senderId === item.senderId;
          const prevMessage = messageList[index + 1]; // inverted=true니까 다음 index가 이전 메시지
          const currentDate = new Date(item.createdAt).toDateString();
          const prevDate = prevMessage
            ? new Date(prevMessage.createdAt).toDateString()
            : null;
          const shouldShowDate = currentDate !== prevDate;
          return (
            <ChatMessageItem
              chatRoom={chatRoom}
              message={item}
              currentUserId={user.userId}
              isKino={false}
              isSameSender={isSameSender}
              shouldShowDate={shouldShowDate}
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
        onScroll={handleScroll}
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
      <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        chatRoomId={chatRoom.chatRoomId}
        navigation={navigation}
        onLeaveChat={onLeaveChat}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
