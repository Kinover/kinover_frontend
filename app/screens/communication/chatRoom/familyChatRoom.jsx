import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {RenderHeaderRightChatSetting} from '../../../navigation/tabHeaderHelpers';
import {useLayoutEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import ChatInput from './chat/chatInput';
import ChatMessageItem from './chat/chatMessageItem';
import {getToken} from '../../../utils/storage';
import {useDispatch} from 'react-redux';
import {addMessage} from '../../../redux/slices/messageSlice';
import {
  fetchMessageThunk,
  fetchMoreMessagesThunk,
} from '../../../redux/thunk/messageThunk';
import ChatSettings from './setting/chatSetting';

import {useSelector} from 'react-redux';
import { leaveChatRoomThunk } from '../../../redux/thunk/chatRoomThunk';

export default function FamilyChatRoom({route}) {
  const {chatRoom, user} = route.params || {};
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const {messageList} = useSelector(state => state.message);
  const [isQuestionVisible, setIsQuestionVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeout = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const scrollToBottom = () => {
    if (flatListRef.current && messageList.length > 0) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: true,
        viewPosition: 0,
      });
    }
  };

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RenderHeaderRightChatSetting setIsSettingsOpen={setIsSettingsOpen} />
      ),
    });
  }, [navigation]);
 

  useEffect(() => {
    if (chatRoom) {
      navigation.setOptions({headerTitle: chatRoom.roomName});
    }
  }, [chatRoom, navigation]);

  useEffect(() => {
    if (chatRoom?.chatRoomId) {
      dispatch(fetchMessageThunk(chatRoom.chatRoomId));
      setNoMoreMessages(false);
    }
  }, [chatRoom?.chatRoomId]);

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

  useEffect(() => {
    if (messageList.length > 0 && !isUserScrolling) {
      scrollToBottom();
    }
  }, [messageList.length]);

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

  const handleScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
  };

  if (!chatRoom || !user) {
    return <Text>데이터가 없습니다.</Text>;
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: 'white',
      }}>
      {isQuestionVisible && (
        <>
          <View style={styles.overlay} />
          <ImageBackground
            source={{uri: 'https://i.postimg.cc/ZYWh5gLS/Group-484-1.png'}}
            style={styles.todayQuestionContainer}
            resizeMode="contain">
            <View style={styles.todayQuestionContent}>
              <Text style={styles.todayQuestionTitle}>질문 03</Text>
              <Text style={styles.todayQuestionText}>
                우리 가족만이 가지고 있는 유행어나 습관이 있다면?
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity>
                <View style={styles.answerButton} />
              </TouchableOpacity>
              <TouchableOpacity>
                <View style={styles.answerButton} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  style={styles.plusButton}
                  source={{
                    uri: 'https://i.postimg.cc/63VJ4VHz/Group-1171276565-1.png',
                  }}
                />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </>
      )}

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

      <ChatInput chatRoom={chatRoom} user={user} socketRef={socketRef} />
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

const Styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    flexDirection: 'row',
    top: getResponsiveHeight(150),
    width: getResponsiveWidth(320),
    paddingHorizontal: getResponsiveWidth(20),
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveWidth(7),
  },
  answerButton: {
    width: getResponsiveWidth(23.6),
    height: getResponsiveHeight(23.6),
    borderRadius: getResponsiveIconSize(11.8),
    backgroundColor: '#D9D9D9',
  },
  plusButton: {
    width: getResponsiveWidth(23.6),
    height: getResponsiveHeight(23.6),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 150,
  },
});
