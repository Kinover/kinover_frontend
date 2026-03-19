// useChatRoomTemplate - 채팅방 화면의 비즈니스 로직·상태 제어를 한곳에서 관리
import {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';

import useChatRoomScreen from './useChatRoomScreen';
import useHeaderSetting from 'hooks/useHeaderSetting';
import useHideTabBar from 'hooks/useHideTabBar';

import {fetchMessageThunk} from '../store/messageThunk';
import {
  setMessageList,
  setMessageFetched,
  selectRoomMeta,
} from '../store/messageSlice';
import {
  setActiveChatRoom,
  selectReadPointers,
  fetchReadPointersThunk,
  markReadThunk,
} from '../store/chatRoomSlice';
import {selectRoomMessagesSorted} from '../store/messageSelectors';
import {fetchChatRoomUsersThunk} from '../store/chatRoomThunk';

import {
  STORE_MOCK_ENABLED,
  getStoreMockKinoMessages,
  getStoreMockChatMessages,
  isStoreMockChatRoomId,
} from '../../home/utils/storeMockData';

import {toLocalDateTimeString} from '../utils/dateUtils';

export default function useChatRoomTemplate({
  chatRoom,
  title,
  userId,
  isKino,
  navigation,
}) {
  const dispatch = useDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inviteToastVisible, setInviteToastVisible] = useState(false);
  const [inviteToastMessage, setInviteToastMessage] = useState('');

  const chatRoomId = chatRoom?.chatRoomId;

  const myUserIdFromStore =
    useSelector(s => s?.user?.userId) ??
    useSelector(s => s?.auth?.user?.userId) ??
    useSelector(s => s?.userSlice?.userId) ??
    null;
  const myUserId = userId ?? myUserIdFromStore;

  const roomMeta = useSelector(state => selectRoomMeta(state, chatRoomId));
  const isMessageFetched = !!roomMeta?.isFetched;
  const messageList = useSelector(state =>
    selectRoomMessagesSorted(state, chatRoomId),
  );

  const roomUsers = useSelector(state => state.chatRoom.chatRoomUsers) || [];
  const readPointersMap = useSelector(state =>
    selectReadPointers(state, chatRoomId),
  );

  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList);
  const currentChatRoom =
    chatRoomList.find(
      roomItem => String(roomItem.chatRoomId) === String(chatRoomId),
    ) || chatRoom;

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

  useHideTabBar();
  useHeaderSetting(navigation, setIsSettingsOpen, title, isKino);

  useEffect(() => {
    if (!inviteToastVisible) return;
    const t = setTimeout(() => setInviteToastVisible(false), 1800);
    return () => clearTimeout(t);
  }, [inviteToastVisible]);

  const openAddMember = useCallback(() => {
    if (!chatRoomId) return;
    setIsSettingsOpen(false);
    navigation.navigate('채팅방멤버추가화면', {
      chatRoomId,
      onInvited: ({count, message}) => {
        const msg =
          message ??
          (typeof count === 'number'
            ? `${count}명을 초대했어요.`
            : '멤버를 초대했어요.');
        setInviteToastMessage(msg);
        setInviteToastVisible(true);
        dispatch(fetchChatRoomUsersThunk(chatRoomId));
      },
    });
  }, [chatRoomId, navigation, dispatch]);

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

  useEffect(() => {
    if (!chatRoomId) return;
    dispatch(setActiveChatRoom(chatRoomId));
    return () => dispatch(setActiveChatRoom(null));
  }, [chatRoomId, dispatch]);

  useEffect(() => {
    if (!chatRoomId) return;
    dispatch(fetchChatRoomUsersThunk(chatRoomId));
  }, [chatRoomId, dispatch]);

  useEffect(() => {
    if (!chatRoomId) return;
    dispatch(fetchReadPointersThunk({chatRoomId}));
  }, [chatRoomId, dispatch]);

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

  const lastSentReadAtRef = useRef(null);
  const sendReadIfNeeded = useCallback(() => {
    if (!chatRoomId || !latestCreatedAtLocal || myUserId == null) return;
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

  useEffect(() => {
    if (!chatRoomId) return;
    lastSentReadAtRef.current = null;
    sendReadIfNeeded();
  }, [chatRoomId, sendReadIfNeeded]);

  useEffect(() => {
    if (!chatRoomId || !latestCreatedAtLocal) return;
    if (isAtBottomRef?.current) sendReadIfNeeded();
  }, [chatRoomId, latestCreatedAtLocal, messageList?.length, isAtBottomRef, sendReadIfNeeded]);

  useEffect(() => {
    if (!isUserScrolling && messageList.length > 0) scrollToBottom();
  }, [messageList.length, isUserScrolling, scrollToBottom]);

  return {
    chatRoomId,
    currentChatRoom,
    myUserId,
    isSettingsOpen,
    setIsSettingsOpen,
    messageList,
    isMessageFetched,
    roomUsers,
    readPointersMap,
    flatListRef,
    noMoreMessages,
    isFetchingMore,
    loadOlderMessages,
    handleScroll,
    scrollToBottom,
    inviteToastVisible,
    inviteToastMessage,
    setInviteToastVisible,
    openAddMember,
    isKino,
  };
}
