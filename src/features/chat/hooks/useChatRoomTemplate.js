// useChatRoomTemplate - 채팅방 화면의 비즈니스 로직·상태 제어를 한곳에서 관리
// RTK Query 마이그레이션:
//   - fetchMessageThunk        → useGetMessagesQuery (useChatRoomScreen에서)
//   - fetchChatRoomUsersThunk  → useGetChatRoomUsersQuery
//   - fetchReadPointersThunk   → useGetReadPointersQuery (onQueryFulfilled에서 slice 동기화)

import {useState, useEffect, useMemo, useRef, useCallback} from 'react';
import {useSelector, useDispatch, useStore} from 'react-redux';

import useChatRoomScreen from './useChatRoomScreen';
import useHeaderSetting from 'hooks/useHeaderSetting';
import useHideTabBar from 'hooks/useHideTabBar';

import {
  setActiveChatRoom,
  selectReadPointers,
  markRoomRead,
} from '../store/chatRoomSlice';
import {syncAppBadge} from 'features/notification/utils/syncAppBadge';
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
  const store = useStore();
  const [markReadRest] = useMarkReadRestMutation();
  const [inviteToastVisible, setInviteToastVisible] = useState(false);
  const [inviteToastMessage, setInviteToastMessage] = useState('');

  const chatRoomId = chatRoom?.chatRoomId;

  const myUserIdFromStore = useSelector(s => s?.user?.userId) ?? null;
  const myUserId = userId ?? myUserIdFromStore;

  const blockedIds = useSelector(s => s.blockedUsers?.ids ?? []);
  const blockedSet = useMemo(
    () => new Set(blockedIds.map(Number).filter(Number.isFinite)),
    [blockedIds],
  );

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

  const visibleMessageList = useMemo(() => {
    if (!blockedSet.size) return messageList;
    return (messageList || []).filter(m => {
      const sid = m?.senderId ?? m?.userId ?? m?.authorId;
      const n = Number(sid);
      if (!Number.isFinite(n)) return true;
      if (String(sid) === String(myUserId)) return true;
      return !blockedSet.has(n);
    });
  }, [messageList, blockedSet, myUserId]);

  const mentionUsersForInput = useMemo(() => {
    if (!blockedSet.size) return roomUsers;
    return (roomUsers || []).filter(u => {
      const n = Number(u?.userId ?? u?.id);
      if (!Number.isFinite(n)) return true;
      return !blockedSet.has(n);
    });
  }, [roomUsers, blockedSet]);

  // ── STORE_MOCK: 메시지 목록 직접 inject (실서버 미사용 시) ──
  // getMessages RTK Query 캐시에 모의 데이터 주입이 필요하면 useChatRoomScreen 내부에서 처리
  // 여기서는 모의 여부를 isMessageFetched 판단에만 활용
  const isMessageFetched =
    Array.isArray(visibleMessageList) && visibleMessageList.length >= 0;

  useHideTabBar();
  useHeaderSetting(navigation, chatRoomId, title, isKino);

  useEffect(() => {
    if (!inviteToastVisible) return;
    const t = setTimeout(() => setInviteToastVisible(false), 1800);
    return () => clearTimeout(t);
  }, [inviteToastVisible]);

  const openAddMember = useCallback(() => {
    if (!chatRoomId) return;
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
    if (!Array.isArray(visibleMessageList) || visibleMessageList.length === 0) {
      return null;
    }
    let maxMs = null;
    let maxDate = null;
    for (const m of visibleMessageList) {
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
  }, [visibleMessageList]);

  const lastSentReadAtRef = useRef(null);
  const sendReadIfNeeded = useCallback(async () => {
    if (!chatRoomId || !latestCreatedAtLocal || myUserId == null) return;
    if (lastSentReadAtRef.current === latestCreatedAtLocal) return;

    // 낙관적 store 업데이트: unreadCount 즉시 0
    dispatch(markRoomRead(chatRoomId));
    try {
      await markReadRest({
        chatRoomId,
        lastReadAt: latestCreatedAtLocal,
        userId: myUserId,
      }).unwrap();
    } catch {
      return;
    }
    lastSentReadAtRef.current = latestCreatedAtLocal;

    // 서버에 읽음 반영 후에 badge-count를 불러야 숫자가 맞음 (이전에는 레이스로 배지가 안 내려감)
    try {
      await syncAppBadge({dispatch, getState: store.getState});
    } catch {
      null;
    }
  }, [chatRoomId, latestCreatedAtLocal, markReadRest, myUserId, dispatch, store]);

  useEffect(() => {
    if (!chatRoomId) return;
    lastSentReadAtRef.current = null;
    sendReadIfNeeded();
  }, [chatRoomId, sendReadIfNeeded]);

  useEffect(() => {
    if (!chatRoomId || !latestCreatedAtLocal) return;
    if (isAtBottomRef?.current) sendReadIfNeeded();
  }, [
    chatRoomId,
    latestCreatedAtLocal,
    visibleMessageList?.length,
    isAtBottomRef,
    sendReadIfNeeded,
  ]);

  // 새 메시지 도착 시 스크롤 bottom
  useEffect(() => {
    const len = Array.isArray(visibleMessageList) ? visibleMessageList.length : 0;
    if (!isUserScrolling && len > 0) scrollToBottom();
  }, [visibleMessageList, isUserScrolling, scrollToBottom]);

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
    messageList: visibleMessageList,
    isMessageFetched,
    roomUsers: mentionUsersForInput,
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
