import React, {useEffect, useMemo, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';

import ChatRoomScreenTemplate from './chatRoomScreenTemplate';
import {fetchChatRoomThunk} from '../store/chatRoomThunk';
import {selectChatRoomById} from '../store/chatRoomSelector';

const toId = v => (v == null ? null : String(v));

export default function FamilyChatRoom({route}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const params = route?.params || {};

  // ✅ 푸시/딥링크는 chatRoomId만 오는 경우가 많음
  const chatRoomId = toId(params.chatRoomId || params.chatRoom?.chatRoomId);

  // ✅ 기존 진입(목록 클릭)은 chatRoom 객체가 올 수도 있음
  const initialChatRoom = params.chatRoom || null;

  // ✅ title/userId fallback
  const userId = params.userId ?? null;
  const titleFromParams = params.title ?? null;

  // ✅ store에서 chatRoomList 기반으로 단건 찾기
  const roomFromStore = useSelector(state => selectChatRoomById(state, chatRoomId));

  const [localRoom, setLocalRoom] = useState(initialChatRoom);
  const [loading, setLoading] = useState(false);

  // ✅ 템플릿에 넘길 chatRoom 결정
  const chatRoom = useMemo(() => {
    return roomFromStore || localRoom || null;
  }, [roomFromStore, localRoom]);

  // ✅ title 결정
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
        setLoading(true);
        const res = await dispatch(fetchChatRoomThunk(chatRoomId));
        if (alive && res?.payload) setLocalRoom(res.payload);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [dispatch, chatRoomId, roomFromStore, localRoom]);

  if (!chatRoomId) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!chatRoom && loading) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator />
      </View>
    );
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
