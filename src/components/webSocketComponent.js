import React, {useEffect, useState} from 'react';
import {View, Text, Button} from 'react-native';
import {useDispatch} from 'react-redux';
import {applyMessagePreview, bumpListRevision} from '../features/chat/store/chatRoomSlice';

const WebSocketComponent = ({token, chatRoomId, userId}) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token || !userId) return;

    const ws = new WebSocket(`ws://43.200.47.242:9090/chat?token=${token}`);

    ws.onopen = () => console.log('✅ WebSocket 연결 성공');

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);

 // 1) 정규화
        const rid = String(raw?.chatRoom?.chatRoomId ?? chatRoomId);
        const createdAt = raw?.createdAt
          ? new Date(raw.createdAt).toISOString()
          : new Date().toISOString();

        const msg = {...raw, createdAt};
        const isSelf = raw?.sender?.userId === userId;

        setMessages(prev => [...prev, msg]);

 // 2) 목록 프리뷰 갱신 (시간/텍스트/정렬)
        dispatch(applyMessagePreview({ chatRoomId: rid, message: msg, isSelf }));
        dispatch(bumpListRevision()); // 바로 렌더 트리거

      } catch (err) {
        console.error('❌ 메시지 파싱 오류:', err);
      }
    };

    ws.onclose = () => console.log('🔌 WebSocket 연결 종료');
    ws.onerror = (error) => console.error('⚠️ WebSocket 오류:', error);

    setSocket(ws);
    return () => ws.close();
  }, [token, userId, dispatch, chatRoomId]); // ok

  const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

 // 3) 송신도 동일 포맷(ISO 시간, 문자열 ID)
    const now = new Date().toISOString();
    const rid = String(chatRoomId);

    const messageData = {
      content: 'Hello!',
      messageType: 'text',
      createdAt: now,
      chatRoom: { chatRoomId: rid },
      sender: { userId },
    };

    socket.send(JSON.stringify(messageData));
    setMessages(prev => [...prev, messageData]);
 // fetchChatRoomListThunk(familyId,userId);

 // 낙관적 프리뷰
    dispatch(applyMessagePreview({ chatRoomId: rid, message: messageData, isSelf: true }));
    dispatch(bumpListRevision()); // 바로 렌더 트리거

  };

  return (
    <View>
      <Button title="메시지 보내기" onPress={sendMessage} />
      {messages.map((m, i) => (
        <Text key={`${m.createdAt}-${i}`}>{m.content}</Text>
      ))}
    </View>
  );
};

export default WebSocketComponent;
