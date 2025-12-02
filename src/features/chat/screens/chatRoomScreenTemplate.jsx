import React, {useState, useEffect} from 'react';
import {StyleSheet, KeyboardAvoidingView, Platform, View} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import MessageFlatList from '../components/messageFlatList';
import ChatInput from '../components/ChatInput';
import ChatSettings from './chatSetting';
import {setMessageList} from '../store/messageSlice';
import useChatRoomScreen from '../hooks/useChatRoomScreen';
import useHeaderSetting from '../../../hooks/useHeaderSetting';
import {onLeaveChat} from '../hooks/onLeaveChat';
import {fetchMessageThunk} from '../store/messageThunk';
import useHideTabBar from '../../../hooks/useHideTabBar';
import {setActiveChatRoom} from '../store/chatRoomSlice';

// 🔹 공통 인앱 가이드 훅 & 모달
import useGuide from 'hooks/useGuide';
import GuideModal from 'components/GuideModal';

// 🔹 일반 채팅방 가이드 스텝
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
    description:
      '필요할 때 설정창에서 가족을 채팅방에 추가할 수 있어요.',
  },
];

// 🔹 키노 채팅방 가이드 스텝
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

  useEffect(() => {
    if (!isUserScrolling && messageList.length > 0) {
      scrollToBottom();
    }
  }, [messageList, isUserScrolling, scrollToBottom]);

  // 🔹 인앱 가이드: 키노/일반에 따라 다른 스텝 + 다른 스토리지 키 사용
  const guideSteps = isKino ? KINO_CHAT_GUIDE_STEPS : CHAT_GUIDE_STEPS;
  const guideStorageKey = isKino
    ? 'KINO_CHAT_GUIDE_SHOWN_V1'
    : 'CHAT_GUIDE_SHOWN_V1';

  // 채팅방 id가 있을 때만 가이드 활성화
  const guideEnabled = !!chatRoom?.chatRoomId;

  const {
    isGuideVisible,
    guideStep,
    currentGuide,
    totalSteps,
    nextStep,
    skipGuide,
  } = useGuide(guideStorageKey, guideSteps, guideEnabled);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 102.5 : 0}>
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

        {/* 🔹 인앱 가이드 모달 (키노/일반 공통, 내용만 다름) */}
        {currentGuide && (
          <GuideModal
            visible={isGuideVisible}
            step={guideStep}
            totalSteps={totalSteps}
            title={currentGuide.title} // 원하면 여기 title 바꿔 써도 됨
            description={currentGuide.description}
            onNext={nextStep}
            onSkip={skipGuide}
          />
        )}
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
