import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';

const WebSocketComponent = ({ token, chatRoomId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token || !chatRoomId || !userId) return;

    const ws = new WebSocket(`ws://43.200.47.242:9090/chat?token=${token}`);

    ws.onopen = () => {
      console.log('✅ WebSocket 연결 성공');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📥 받은 메시지:', message);
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        console.error('❌ 메시지 파싱 오류:', err);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket 연결 종료');
    };

    ws.onerror = (error) => {
      console.error('⚠️ WebSocket 오류:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [token, chatRoomId, userId]);

  const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const messageData = {
      content: 'Hello!',
      messageType: 'text',
      chatRoom: { chatRoomId },
      sender: { userId },
    };

    socket.send(JSON.stringify(messageData));
    console.log('📤 보낸 메시지:', messageData);
  };

  return (
    <View>
      <Button title="메시지 보내기" onPress={sendMessage} />
      {messages.map((msg, index) => (
        <Text key={index}>{msg.content}</Text>
      ))}
    </View>
  );
};

export default WebSocketComponent;
