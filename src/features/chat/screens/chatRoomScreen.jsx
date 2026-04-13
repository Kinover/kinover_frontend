import React, {useEffect, useLayoutEffect, useMemo, useState, useCallback} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import ChatRoomScreenTemplate from './chatRoomScreenTemplate';
import {useLazyGetChatRoomQuery} from '../services/chatApi';
import {selectChatRoomById} from '../store/chatRoomSelector';
import YellowSpinner from 'components/yellowSpinner';
import ToastModal from 'components/modal/ToastModal';
import {blockedIdSetFromStateIds, shouldHideChatRoomForBlockedUsers} from 'features/moderation/utils/blockedUserFilter';

const toId = v => (v == null ? null : String(v));

function BlockedChatRoomGate({navigation}) {
  const [visible, setVisible] = useState(true);
  const handleClose = useCallback(() => {
    setVisible(false);
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={{flex: 1, backgroundColor: '#F9F9F9'}}>
      <ToastModal
        visible={visible}
        message="차단한 유저와의 채팅방은 열 수 없어요."
        onClose={handleClose}
        duration={2200}
      />
    </View>
  );
}

export default function FamilyChatRoom({route}) {
  const navigation = useNavigation();
  const [fetchChatRoom] = useLazyGetChatRoomQuery();

  const params = route?.params || {};

 // 푸시/딥링크는 chatRoomId만 오는 경우가 많음
  const chatRoomId = toId(params.chatRoomId || params.chatRoom?.chatRoomId);

  const initialChatRoom = params.chatRoom || null;

 // title/userId fallback
  const userId = params.userId ?? null;
  const titleFromParams = params.title ?? null;

  const myUserId = useSelector(s => s.user?.userId ?? s.user?.id);
  const effectiveUserId = userId ?? myUserId;

  const blockedIds = useSelector(s => s.blockedUsers?.ids ?? []);
  const blockedSet = useMemo(
    () => blockedIdSetFromStateIds(blockedIds),
    [blockedIds],
  );

 // store에서 chatRoomList 기반으로 단건 찾기
  const roomFromStore = useSelector(state => selectChatRoomById(state, chatRoomId));

  const [localRoom, setLocalRoom] = useState(initialChatRoom);

 // 템플릿에 넘길 chatRoom 결정 (목록/단건 fetch 전에도 route의 chatRoomId로 훅·fetch가 동작하도록 최소 스텁 유지)
  const chatRoom = useMemo(() => {
    const base = roomFromStore || localRoom || null;
    if (!chatRoomId) return base;
    if (!base) return {chatRoomId};
    return {...base, chatRoomId: base.chatRoomId ?? chatRoomId};
  }, [roomFromStore, localRoom, chatRoomId]);

 // title 결정
  const title = useMemo(() => {
    return titleFromParams || chatRoom?.roomName || chatRoom?.title || '채팅';
  }, [titleFromParams, chatRoom]);

  useEffect(() => {
    if (!chatRoomId) return;

 // store나 local에 있으면 fetch 생략
    if (roomFromStore || localRoom) return;

    let alive = true;

    (async () => {
      try {
        const data = await fetchChatRoom(chatRoomId).unwrap();
        if (alive) setLocalRoom(data);
      } catch (e) {
        // thunk 자체가 throw하는 경우(네트워크 등) — 화면은 스텁(chatRoomId만 있는) 상태로 유지
      }
    })();

    return () => {
      alive = false;
    };
  }, [fetchChatRoom, chatRoomId, roomFromStore, localRoom]);

  const roomForBlock = roomFromStore || localRoom;
  const blockedNow = useMemo(() => {
    if (
      !roomForBlock ||
      roomForBlock.kino ||
      effectiveUserId == null ||
      !blockedSet?.size
    ) {
      return false;
    }
    const ucs = roomForBlock.userChatRooms;
    if (!Array.isArray(ucs) || ucs.length === 0) {
      return false;
    }
    return shouldHideChatRoomForBlockedUsers(
      roomForBlock,
      effectiveUserId,
      blockedSet,
    );
  }, [roomForBlock, effectiveUserId, blockedSet]);

  const [blockedLatch, setBlockedLatch] = useState(false);
  useLayoutEffect(() => {
    if (blockedNow) {
      setBlockedLatch(true);
    }
  }, [blockedNow]);

  if (!chatRoomId) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <YellowSpinner />
      </View>
    );
  }

  if (blockedLatch) {
    return <BlockedChatRoomGate navigation={navigation} />;
  }

  return (
    <ChatRoomScreenTemplate
      chatRoom={chatRoom}
      title={title}
      userId={userId}
      isKino={false}
      navigation={navigation}
    />
  );
}
