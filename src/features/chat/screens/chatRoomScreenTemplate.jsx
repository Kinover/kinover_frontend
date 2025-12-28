// ChatRoomScreenTemplate.jsx
import React, {useState, useEffect, useMemo, useRef, useCallback} from 'react';
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
import {markReadThunk, fetchChatRoomUsersThunk} from '../store/chatRoomThunk';

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

// ✅ LocalDateTime 문자열 생성 (Z 없음)
function pad2(n) {
  return String(n).padStart(2, '0');
}
function pad3(n) {
  return String(n).padStart(3, '0');
}
function toLocalDateTimeString(dateLike) {
  if (!dateLike) return null;
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getFullYear();
  const MM = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const HH = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const SSS = pad3(d.getMilliseconds());

  // Spring LocalDateTime 기본 파싱: 2025-12-28T18:30:12.123
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}.${SSS}`;
}

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

  const roomMeta = useSelector(state => selectRoomMeta(state, chatRoomId));
  const isMessageFetched = !!roomMeta?.isFetched;
  const messageList = roomMeta?.messageList ?? [];

  const roomUsers = useSelector(state => state.chatRoom.chatRoomUsers) || [];

  const {
    flatListRef,
    noMoreMessages,
    isFetchingMore,
    loadOlderMessages,
    handleScroll,
    scrollToBottom,
    setNoMoreMessages,
    isUserScrolling,
    isAtBottomRef,
  } = useChatRoomScreen(chatRoom, userId, isKino);

  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList);
  const currentChatRoom =
    chatRoomList.find(
      roomItem => String(roomItem.chatRoomId) === String(chatRoomId),
    ) || chatRoom;

  useHideTabBar();
  useHeaderSetting(navigation, setIsSettingsOpen, title, isKino);

  // ✅ 방 메시지 fetch (여기서만)
  useEffect(() => {
    if (!chatRoomId) return;

    setNoMoreMessages(false);

    if (!isMessageFetched) {
      dispatch(fetchMessageThunk(chatRoomId));
    }
  }, [chatRoomId, isMessageFetched, dispatch, setNoMoreMessages]);

  // ✅ activeChatRoomId는 화면에서만
  useEffect(() => {
    if (!chatRoomId) return;
    dispatch(setActiveChatRoom(chatRoomId));
    return () => dispatch(setActiveChatRoom(null));
  }, [chatRoomId, dispatch]);

  // ✅ roomUsers fetch (멘션 후보)
  useEffect(() => {
    if (!chatRoomId) return;
    dispatch(fetchChatRoomUsersThunk(chatRoomId));
  }, [chatRoomId, dispatch]);

  // ✅ 최신 메시지 createdAt (정렬이 깨져도 안전하게 max로)
  const latestCreatedAtLocal = useMemo(() => {
    if (!Array.isArray(messageList) || messageList.length === 0) return null;

    let maxMs = null;
    let maxDate = null;

    for (const m of messageList) {
      const t = m?.createdAt;
      if (!t) continue;

      const d = new Date(t);
      const ms = d.getTime();
      if (Number.isNaN(ms)) continue;

      if (maxMs == null || ms > maxMs) {
        maxMs = ms;
        maxDate = d;
      }
    }

    return maxDate ? toLocalDateTimeString(maxDate) : null;
  }, [messageList]);

  // ✅ 중복 read 전송 방지
  const lastSentReadAtRef = useRef(null);

  const sendReadIfNeeded = useCallback(() => {
    if (!chatRoomId) return;
    if (!latestCreatedAtLocal) return;

    if (lastSentReadAtRef.current === latestCreatedAtLocal) return;

    lastSentReadAtRef.current = latestCreatedAtLocal;
    dispatch(markReadThunk({chatRoomId, lastReadAt: latestCreatedAtLocal}));
  }, [chatRoomId, latestCreatedAtLocal, dispatch]);

  // ✅ 방 들어오면 1회
  useEffect(() => {
    if (!chatRoomId) return;
    lastSentReadAtRef.current = null;
    sendReadIfNeeded();
  }, [chatRoomId, sendReadIfNeeded]);

  // ✅ 바닥에 붙어있을 때 새 메시지 오면 read 갱신
  useEffect(() => {
    if (!chatRoomId) return;
    if (!latestCreatedAtLocal) return;

    if (isAtBottomRef?.current) {
      sendReadIfNeeded();
    }
  }, [
    chatRoomId,
    latestCreatedAtLocal,
    messageList?.length,
    isAtBottomRef,
    sendReadIfNeeded,
  ]);

  useEffect(() => {
    if (!isUserScrolling && messageList.length > 0) {
      scrollToBottom();
    }
  }, [messageList.length, isUserScrolling, scrollToBottom]);

  const guideSteps = isKino ? KINO_CHAT_GUIDE_STEPS : CHAT_GUIDE_STEPS;
  const guideStorageKey = isKino
    ? 'KINO_CHAT_GUIDE_SHOWN_V1'
    : 'CHAT_GUIDE_SHOWN_V1';
  useGuide(guideStorageKey, guideSteps, !!chatRoomId);

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
          mentionUsers={roomUsers}
        />

        <ChatInput
          chatRoom={currentChatRoom}
          userId={userId}
          enableMediaPicker={!isKino}
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
