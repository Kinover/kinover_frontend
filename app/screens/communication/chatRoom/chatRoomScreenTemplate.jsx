// components/common/ChatRoomScreenTemplate.jsx
import React, {useState, useEffect} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {useDispatch} from 'react-redux';
import {getToken} from '../../../utils/storage';
import MessageFlatList from './chat/messageFlatList';
import ChatInput from './chat/chatInput';
import ChatSettings from './setting/chatSetting';
import {addMessage, setMessageList} from '../../../redux/slices/messageSlice';
import useChatRoomScreen from '../../../hooks/useChatRoomScreen';
import useHeaderSetting from '../../../hooks/useHeaderSetting';
import {onLeaveChat} from '../../../hooks/onLeaveChat';
import {fetchMessageThunk} from '../../../redux/thunk/messageThunk';
import useHideTabBar from '../../../hooks/useHideTabBar';

export default function ChatRoomScreenTemplate({
  chatRoom,
  userId,
  isKino,
  navigation,
}) {
  const dispatch = useDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    flatListRef,
    messageList,
    noMoreMessages,
    isFetchingMore,
    loadOlderMessages,
    handleScroll,
    scrollToBottom,
    setNoMoreMessages,
    socketRef,
    isUserScrolling,
  } = useChatRoomScreen(chatRoom, userId, isKino);

  useHideTabBar();
  useHeaderSetting(navigation, setIsSettingsOpen, chatRoom.roomName, isKino);
  useEffect(() => {
    if (chatRoom?.chatRoomId) {
      dispatch(fetchMessageThunk(chatRoom.chatRoomId));
      setNoMoreMessages(false);
    }
  }, [chatRoom?.chatRoomId]);
  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await getToken();
      if (!chatRoom || !userId || !token) return;

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
          console.error('❌ 수신 메시지 파싱 실패:', err);
        }
      };
      ws.onerror = err => console.error('⚠️ WebSocket 오류:', err);
      ws.onclose = () => console.log('🔌 WebSocket 종료');
    };

    connectWebSocket();
    return () => socketRef.current?.close();
  }, [chatRoom?.chatRoomId, userId]);

  useEffect(() => {
    if (!isUserScrolling && messageList.length > 0) scrollToBottom();
  }, [messageList.length]);

  return (
    <SafeAreaView style={styles.container}>
      <MessageFlatList
        flatListRef={flatListRef}
        messageList={messageList}
        chatRoom={chatRoom}
        userId={userId}
        isKino={isKino}
        noMoreMessages={noMoreMessages}
        isFetchingMore={isFetchingMore}
        loadOlderMessages={loadOlderMessages}
        handleScroll={handleScroll}
        scrollToBottom={scrollToBottom}
      />
      <ChatInput
        chatRoom={chatRoom}
        userId={userId}
        socketRef={socketRef}
        setMessageList={setMessageList}
      />
      <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        chatRoomId={chatRoom.chatRoomId}
        navigation={navigation}
        onLeaveChat={onLeaveChat}
        isKino={isKino}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
});
