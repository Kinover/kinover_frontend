import React, {useState, useEffect} from 'react';
import {StyleSheet, KeyboardAvoidingView, Platform, View} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import MessageFlatList from '../components/messageFlatList';
import ChatInput from '../components/chatInput';
import ChatSettings from './chatSetting';
import { setMessageList} from '../store/messageSlice';
import useChatRoomScreen from '../hooks/useChatRoomScreen';
import useHeaderSetting from '../../../hooks/useHeaderSetting';
import {onLeaveChat} from '../hooks/onLeaveChat';
import {fetchMessageThunk} from '../store/messageThunk';
import useHideTabBar from '../../../hooks/useHideTabBar';
import {setActiveChatRoom} from '../store/chatRoomSlice';

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

  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList);
  const currentChatRoom =
    chatRoomList.find(room => room.chatRoomId === chatRoom.chatRoomId) ||
    chatRoom;

  useHideTabBar();

  useHeaderSetting(
    navigation,
    setIsSettingsOpen,
    currentChatRoom.roomName,
    isKino,
  );

  useEffect(() => {
    if (chatRoom?.chatRoomId) {
      dispatch(fetchMessageThunk(chatRoom.chatRoomId));
      setNoMoreMessages(false);
    }
  }, [chatRoom?.chatRoomId, dispatch, setNoMoreMessages]);

  useEffect(() => {
    dispatch(setActiveChatRoom(chatRoom.chatRoomId));
    return () => {
      dispatch(setActiveChatRoom(null));
    };
  }, [chatRoom.chatRoomId, dispatch]);

  // 🔥 여기 있었던 connectWebSocket useEffect는 아예 제거!

  useEffect(() => {
    if (!isUserScrolling && messageList.length > 0) {
      scrollToBottom();
    }
  }, [messageList, isUserScrolling, scrollToBottom]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 102.5 : 0}
    >
      <View style={{flex: 1}}>
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
          enableMediaPicker={!isKino}
        />
        <ChatSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          chatRoomId={chatRoom.chatRoomId}
          navigation={navigation}
          onLeaveChat={onLeaveChat}
          isKino={isKino}
        />
      </View>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
