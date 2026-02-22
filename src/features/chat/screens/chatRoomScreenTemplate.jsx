// ChatRoomScreenTemplate - 공통 채팅방 화면 템플릿
import React, {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {StyleSheet, KeyboardAvoidingView, Platform, View} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';

import MessageFlatList from '../components/MessageFlatList';
import ChatInput from '../components/ChatInput';
import ChatSettings from './ChatSetting';

import useChatRoomScreen from '../hooks/useChatRoomScreen';
import useHeaderSetting from 'hooks/useHeaderSetting';
import {onLeaveChat} from '../hooks/onLeaveChat';
import {fetchMessageThunk} from '../store/messageThunk';
import {setMessageList, setMessageFetched} from '../store/messageSlice';
import {
  STORE_MOCK_ENABLED,
  getStoreMockKinoMessages,
  getStoreMockChatMessages,
  isStoreMockChatRoomId,
} from '../../home/utils/storeMockData';
import useHideTabBar from 'hooks/useHideTabBar';

import {
  setActiveChatRoom,
  selectReadPointers,
  fetchReadPointersThunk,
  markReadThunk,
} from '../store/chatRoomSlice';

import {selectRoomMeta} from '../store/messageSlice';
import {fetchChatRoomUsersThunk} from '../store/chatRoomThunk';

import ToastModal from 'components/modal/ToastModal';


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

  // ✅ props userId가 undefined일 수 있음(푸시 진입에서 userId 안 넘기는 구조)
  const myUserIdFromStore =
    useSelector(s => s?.user?.userId) ??
    useSelector(s => s?.auth?.user?.userId) ??
    useSelector(s => s?.userSlice?.userId) ??
    null;

  const myUserId = userId ?? myUserIdFromStore;

  const roomMeta = useSelector(state => selectRoomMeta(state, chatRoomId));
  const isMessageFetched = !!roomMeta?.isFetched;
  const messageList = roomMeta?.messageList ?? [];

  const roomUsers = useSelector(state => state.chatRoom.chatRoomUsers) || [];

  // ✅ readPointers: { [userId]: lastReadAt }
  const readPointersMap = useSelector(state =>
    selectReadPointers(state, chatRoomId),
  );

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
  } = useChatRoomScreen(chatRoom, myUserId, isKino);

  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList);
  const currentChatRoom =
    chatRoomList.find(
      roomItem => String(roomItem.chatRoomId) === String(chatRoomId),
    ) || chatRoom;

  useHideTabBar();
  useHeaderSetting(navigation, setIsSettingsOpen, title, isKino);

  // =========================================================
  // ✅ [추가] 초대 토스트 (스크린에서 띄움)
  // =========================================================
  const [inviteToastVisible, setInviteToastVisible] = useState(false);
  const [inviteToastMessage, setInviteToastMessage] = useState('');

  useEffect(() => {
    if (!inviteToastVisible) return;
    const t = setTimeout(() => setInviteToastVisible(false), 1800);
    return () => clearTimeout(t);
  }, [inviteToastVisible]);

  // ✅ AddChatMemberScreen 열기 + 콜백으로 초대 완료 처리
  const openAddMember = useCallback(() => {
    if (!chatRoomId) return;

    // 설정창이 열려있으면 닫아주기(UX 깔끔)
    setIsSettingsOpen(false);

    navigation.navigate('채팅방멤버추가화면', {
      chatRoomId,
      onInvited: ({count, message}) => {
        // ✅ 1) 초대 완료 즉시 토스트
        const msg =
          message ??
          (typeof count === 'number'
            ? `${count}명을 초대했어요.`
            : '멤버를 초대했어요.');
        setInviteToastMessage(msg);
        setInviteToastVisible(true);

        // ✅ 2) 멤버 목록 갱신 (멘션 후보/멤버 리스트)
        dispatch(fetchChatRoomUsersThunk(chatRoomId));
      },
    });
  }, [chatRoomId, navigation, dispatch]);

  // =========================================================
  // ✅ 방 메시지 fetch (여기서만)
  // =========================================================
  useEffect(() => {
    if (!chatRoomId) return;

    setNoMoreMessages(false);

    if (!isMessageFetched) {
      if (STORE_MOCK_ENABLED && isKino) {
        const messages = getStoreMockKinoMessages(myUserId);
        dispatch(setMessageList({chatRoomId, messages}));
        dispatch(setMessageFetched({chatRoomId, isFetched: true}));
      } else if (
        STORE_MOCK_ENABLED &&
        isStoreMockChatRoomId(chatRoomId) &&
        !isKino
      ) {
        const messages = getStoreMockChatMessages(chatRoomId, myUserId);
        dispatch(setMessageList({chatRoomId, messages}));
        dispatch(setMessageFetched({chatRoomId, isFetched: true}));
      } else {
        dispatch(fetchMessageThunk(chatRoomId));
      }
    }
  }, [chatRoomId, isMessageFetched, dispatch, setNoMoreMessages, isKino, myUserId]);

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

  // ✅ readPointers 초기 로드 (입장 시 1회)
  useEffect(() => {
    if (!chatRoomId) return;
    dispatch(fetchReadPointersThunk({chatRoomId}));
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
    if (myUserId == null) return;

    if (lastSentReadAtRef.current === latestCreatedAtLocal) return;
    lastSentReadAtRef.current = latestCreatedAtLocal;

    dispatch(
      markReadThunk({
        chatRoomId,
        lastReadAt: latestCreatedAtLocal,
        userId: myUserId,
      }),
    );
  }, [chatRoomId, latestCreatedAtLocal, dispatch, myUserId]);

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

  // =========================================================
  // ✅ 핵심 변경: iOS만 KeyboardAvoidingView 사용
  // - Android는 시스템(adjustResize)에게 맡기고, RN이 padding으로 또 밀지 않게 함
  // =========================================================
  const content = (
    <View style={{flex: 1}}>
      <MessageFlatList
        flatListRef={flatListRef}
        messageList={messageList}
        chatRoom={currentChatRoom}
        userId={myUserId}
        isKino={isKino}
        noMoreMessages={noMoreMessages}
        isFetchingMore={isFetchingMore}
        loadOlderMessages={loadOlderMessages}
        handleScroll={handleScroll}
        scrollToBottom={scrollToBottom}
        isMessageFetched={isMessageFetched}
        mentionUsers={roomUsers}
        readPointersMap={readPointersMap}
      />

      <ChatInput
        chatRoom={currentChatRoom}
        userId={myUserId}
        enableMediaPicker={!isKino}
        mentionUsers={roomUsers}
      />

      <ToastModal
        visible={inviteToastVisible}
        message={inviteToastMessage}
        onClose={() => setInviteToastVisible(false)}
      />

      <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        chatRoomId={chatRoomId}
        navigation={navigation}
        onLeaveChat={onLeaveChat}
        isKino={isKino}
        onOpenAddMember={openAddMember}
      />
    </View>
  );

  // ✅ iOS만 KAV로 부드럽게
  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        // 너 기존 값 유지. (헤더 높이가 바뀌면 여기만 조정)
        keyboardVerticalOffset={102.5}>
        {content}
      </KeyboardAvoidingView>
    );
  }

  // ✅ Android는 KAV 제거(팍 튐/이중 회피 방지)
  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
});
