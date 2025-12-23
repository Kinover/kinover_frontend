import React, {useState, useEffect} from 'react';
import {StyleSheet, KeyboardAvoidingView, Platform, View} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import MessageFlatList from '../components/messageFlatList';
import ChatInput from '../components/ChatInput';
import ChatSettings from './chatSetting';

import useChatRoomScreen from '../hooks/useChatRoomScreen';
import useHeaderSetting from '../../../hooks/useHeaderSetting';
import {onLeaveChat} from '../hooks/onLeaveChat';
import {fetchMessageThunk} from '../store/messageThunk';
import useHideTabBar from '../../../hooks/useHideTabBar';
import {setActiveChatRoom} from '../store/chatRoomSlice';

import {selectRoomMeta} from '../store/messageSlice';
import useGuide from 'hooks/useGuide';

const CHAT_GUIDE_STEPS = [
  {
    title: '대화 나누기',
    description:
      '메세지로 가볍게 안부를 묻거나 사진으로 하루의 순간들을 나누며 가족과 소통해보세요.',
  },
  {
    title: '채팅방 이름 꾸미기',
    description:
      '설정창에서 채팅방 이름을 바꿔 가족만의 분위기를 만들어보세요.',
  },
  {
    title: '대화 멤버 관리',
    description: '필요할 때 설정창에서 가족을 채팅방에 추가할 수 있어요.',
  },
];

const KINO_CHAT_GUIDE_STEPS = [
  {
    title: '키노와 고민을 나눠요',
    description:
      '지금 느끼는 감정이나 고민을 키노에게 가볍게 털어놓아보세요. 가족에게 건네면 좋을 말들도 함께 생각해줘요.',
  },
  {
    title: '키노 성격 선택하기',
    description:
      '설정창에서 “키노 선택하기”를 누르면 3가지 성격 유형 중 원하는 키노를 선택해 대화를 이어갈 수 있어요.',
  },
  {
    title: '가볍게, 자주 이야기하기',
    description:
      '거창한 얘기가 아니어도 괜찮아요. 오늘 있었던 일들을 짧게 남겨두는 것도 충분히 의미 있어요.',
  },
];

export default function ChatRoomScreenTemplate({
  chatRoom,
  title,
  userId,
  isKino,
  navigation,
}) {
  const dispatch = useDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const chatRoomId = chatRoom?.chatRoomId;

  // ✅ 방별 캐시
  const room = useSelector(state => selectRoomMeta(state, chatRoomId));
  const isMessageFetched = !!room?.isFetched;
  const messageList = room?.messageList ?? [];
  const roomUsers = useSelector(state => state.chatRoom.chatRoomUsers) || [];

  const {
    flatListRef,
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
    chatRoomList.find(roomItem => roomItem.chatRoomId === chatRoomId) ||
    chatRoom;

  /**
   * ✅ 멘션용 유저 리스트 만들기
   * - ChatInput / 말풍선 하이라이트 둘 다 이걸 쓴다
   *
   * ⚠️ 주의: 네 room 구조에 따라 키 이름이 달라질 수 있으니까
   * 아래에서 가능한 후보들을 넓게 커버했어.
   */
 

  useHideTabBar();
  useHeaderSetting(navigation, setIsSettingsOpen, title, isKino);

  // ✅ fetch는 “여기서만” 한다 (훅에서는 제거)
  useEffect(() => {
    if (!chatRoomId) return;

    setNoMoreMessages(false);

    if (!isMessageFetched) {
      dispatch(fetchMessageThunk(chatRoomId));
    }
  }, [chatRoomId, isMessageFetched, dispatch, setNoMoreMessages]);

  useEffect(() => {
    if (!chatRoomId) return;

    dispatch(setActiveChatRoom(chatRoomId));
    return () => {
      dispatch(setActiveChatRoom(null));
    };
  }, [chatRoomId, dispatch]);

  useEffect(() => {
    if (!isUserScrolling && messageList.length > 0) {
      scrollToBottom();
    }
  }, [messageList.length, isUserScrolling, scrollToBottom]);

  const guideSteps = isKino ? KINO_CHAT_GUIDE_STEPS : CHAT_GUIDE_STEPS;
  const guideStorageKey = isKino
    ? 'KINO_CHAT_GUIDE_SHOWN_V1'
    : 'CHAT_GUIDE_SHOWN_V1';

  const guideEnabled = !!chatRoomId;

  useGuide(guideStorageKey, guideSteps, guideEnabled);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 102.5 : 0}>
      <View style={{flex: 1}}>
        <MessageFlatList
          flatListRef={flatListRef}
          messageList={messageList}
          chatRoom={currentChatRoom}
          userId={userId}
          isKino={isKino}
          noMoreMessages={noMoreMessages}
          isFetchingMore={isFetchingMore}
          loadOlderMessages={loadOlderMessages}
          handleScroll={handleScroll}
          scrollToBottom={scrollToBottom}
          isMessageFetched={isMessageFetched}

          // ✅ 추가: 말풍선에서 @ 하이라이트하려면 필요
          mentionUsers={roomUsers}
        />

        <ChatInput
          chatRoom={currentChatRoom}
          userId={userId}
          socketRef={socketRef}
          enableMediaPicker={!isKino}

          // ✅ 핵심: ChatInput 멘션 후보
          mentionUsers={roomUsers}
        />

        <ChatSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          chatRoomId={chatRoomId}
          navigation={navigation}
          onLeaveChat={onLeaveChat}
          isKino={isKino}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
});
