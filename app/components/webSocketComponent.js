import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';

const WebSocketComponent = () => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 웹소켓 연결
    const ws = new WebSocket('ws://your-server-url/chat');  // 웹소켓 서버 URL을 입력하세요.
    
    // 서버로부터 메시지 수신 시
    ws.onmessage = (event) => {
      const message = event.data;
      console.log('받은 메시지:', message);
      setMessages((prevMessages) => [...prevMessages, message]);  // 받은 메시지를 상태에 추가
    };

    // 연결이 열렸을 때
    ws.onopen = () => {
      console.log('웹소켓 연결 성공');
    };

    // 연결이 종료되었을 때
    ws.onclose = () => {
      console.log('웹소켓 연결 종료');
    };

    // 오류가 발생했을 때
    ws.onerror = (error) => {
      console.error('웹소켓 오류:', error);
    };

    // 웹소켓 객체 저장
    setSocket(ws);

    // 컴포넌트 언마운트 시 웹소켓 연결 종료
    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (socket) {
      const message = 'Hello from React Native!';
      socket.send(message);  // 서버로 메시지 전송
      console.log('보낸 메시지:', message);
    }
  };

  return (
    <View>
      <Button title="메시지 보내기" onPress={sendMessage} />
      {messages.map((msg, index) => (
        <Text key={index}>{msg}</Text>
      ))}
    </View>
  );
};

export default WebSocketComponent;
