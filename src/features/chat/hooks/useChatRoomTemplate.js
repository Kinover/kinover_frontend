// useChatRoomTemplate - 채팅방 화면의 비즈니스 로직·상태 제어를 한곳에서 관리
// RTK Query 마이그레이션:
//   - fetchMessageThunk        → useGetMessagesQuery (useChatRoomScreen에서)
//   - fetchChatRoomUsersThunk  → useGetChatRoomUsersQuery
//   - fetchReadPointersThunk   → useGetReadPointersQuery (onQueryFulfilled에서 slice 동기화)

import {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {useSelector, useDispatch} from 'react-redux';

import useChatRoomScreen from './useChatRoomScreen';
import useHeaderSetting from 'hooks/useHeaderSetting';
import useHideTabBar from 'hooks/useHideTabBar';

import {
  setActiveChatRoom,
  selectReadPointers,
} from '../store/chatRoomSlice';
import {useGetChatRoomUsersQuery, useGetReadPointersQuery, useMarkReadRestMutation} from '../services/chatApi';

import {
  STORE_MOCK_ENABLED,
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
  const [markReadRest] = useMarkReadRestMutation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inviteToastVisible, setInviteToastVisible] = useState(false);
  const [inviteToastMessage, setInviteToastMessage] = useState('');

  const chatRoomId = chatRoom?.chatRoomId;

  const myUserIdFromStore = useSelector(s => s?.user?.userId) ?? null;
  const myUserId = userId ?? myUserIdFromStore;

  // ── RTK Query: 채팅방 유저 목록 ──────────────────────────────
  const {data: roomUsers = []} = useGetChatRoomUsersQuery(
    String(chatRoomId),
    {skip: !chatRoomId || (STORE_MOCK_ENABLED && isStoreMockChatRoomId(chatRoomId))},
  );

  // ── RTK Query: 읽음 포인터 (onQueryFulfilled에서 chatRoomSlice.setReadPointers 동기화) ──
  useGetReadPointersQuery(String(chatRoomId), {skip: !chatRoomId});
  const readPointersMap = useSelector(state =>
    selectReadPointers(state, chatRoomId),
  );

  // ── slice: chatRoomList에서 현재 채팅방 정보 ──
  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList);
  const currentChatRoom =
    chatRoomList.find(
      roomItem => String(roomItem.chatRoomId) === String(chatRoomId),
    ) || chatRoom;

  const {
    flatListRef,
    messageList,
    noMoreMessages,
    isFetchingMore,
    loadOlderMessages,
    handleScroll,
    scrollToBottom,
    setNoMoreMessages,
    isUserScrolling,
    isAtBottomRef,
  } = useChatRoomScreen(chatRoom, myUserId, isKino);

  // ── STORE_MOCK: 메시지 목록 직접 inject (실서버 미사용 시) ──
  // getMessages RTK Query 캐시에 모의 데이터 주입이 필요하면 useChatRoomScreen 내부에서 처리
  // 여기서는 모의 여부를 isMessageFetched 판단에만 활용
  const isMessageFetched = Array.isArray(messageList) && messageList.length >= 0;

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
        // RTK Query tag invalidation: addUsersToChatRoom mutation이 이미 처리함
      },
    });
  }, [chatRoomId, navigation]);

  // active chat room 설정
  useEffect(() => {
    if (!chatRoomId) return;
    dispatch(setActiveChatRoom(chatRoomId));
    return () => dispatch(setActiveChatRoom(null));
  }, [chatRoomId, dispatch]);

  // ── 읽음 처리 ──────────────────────────────────────────────
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
    markReadRest({
      chatRoomId,
      lastReadAt: latestCreatedAtLocal,
      userId: myUserId,
    });
  }, [chatRoomId, latestCreatedAtLocal, markReadRest, myUserId]);

  useEffect(() => {
    if (!chatRoomId) return;
    lastSentReadAtRef.current = null;
    sendReadIfNeeded();
  }, [chatRoomId, sendReadIfNeeded]);

  useEffect(() => {
    if (!chatRoomId || !latestCreatedAtLocal) return;
    if (isAtBottomRef?.current) sendReadIfNeeded();
  }, [chatRoomId, latestCreatedAtLocal, messageList?.length, isAtBottomRef, sendReadIfNeeded]);

  // 새 메시지 도착 시 스크롤 bottom
  useEffect(() => {
    const len = Array.isArray(messageList) ? messageList.length : 0;
    if (!isUserScrolling && len > 0) scrollToBottom();
  }, [messageList, isUserScrolling, scrollToBottom]);

  // STORE_MOCK: 모의 메시지 직접 주입 (useChatRoomScreen 스킵 우회)
  useEffect(() => {
    if (!chatRoomId || !STORE_MOCK_ENABLED) return;
    // mock 메시지는 chatApi.util.upsertQueryData 대신 별도 처리가 필요한 경우
    // 현재는 useChatRoomScreen에서 getMessages skip 처리로 대응
  }, [chatRoomId]);

  useEffect(() => {
    if (!chatRoomId) return;
    setNoMoreMessages(false);
  }, [chatRoomId, setNoMoreMessages]);

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
