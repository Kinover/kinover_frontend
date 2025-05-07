import React, {useEffect, useRef, useState} from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Image,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import ChatInput from './chatInput';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import ChatScreen from './chatScreen';
import {useNavigation} from '@react-navigation/native';
import { getToken } from '../../../utils/storage';

export default function OneToOneChatRoom({route}) {
  const {chatRoom, user} = route.params || {}; // params에서 가져오기
  const navigation = useNavigation();
  const scrollViewRef = useRef(null); // ScrollView에 ref 추가
  const socketRef = useRef(null); // ✅ useRef로 socket 관리
  const [socket, setSocket] = useState(null);

  // 채팅 화면이 업데이트될 때 자동 스크롤
  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await getToken();
      if (!chatRoom || !user?.userId || !token) {
        console.log('🚫 조건 부족으로 WebSocket 연결 안함');
        return;
      }
  
      console.log('🪪 토큰:', token);
      const ws = new WebSocket(`ws://43.200.47.242:9090/chat?token=${token}`);
  
      ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공');
      };
  
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📥 수신:', message);
        } catch (err) {
          console.error('❌ 수신 메시지 파싱 실패:', err);
        }
      };
  
      ws.onerror = (err) => {
        console.error('⚠️ WebSocket 오류:', err);
      };
  
      ws.onclose = (e) => {
        console.log('🔌 WebSocket 연결 종료', e.code, e.reason);
      };
  
      socketRef.current = ws;
    };
  
    connectWebSocket();
  
    return () => {
      if (socketRef.current) {
        console.log('🧹 WebSocket 정리');
        socketRef.current.close();
      }
    };
  }, []); // ✅ useEffect 딱 한 번만 실행!

  useEffect(() => {
    // 화면 들어올 때 바텀 네비 숨기기
    navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});

    return () => {
      // 화면 나갈 때 다시 보이게 설정
      navigation.getParent()?.setOptions({tabBarStyle: {display: 'flex'}});
    };
  }, [navigation]);

  useEffect(() => {
    if (chatRoom) {
      navigation.setOptions({headerTitle: chatRoom.roomName});
    }
  }, [navigation, chatRoom]);

  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatScrollView}
        onContentSizeChange={scrollToBottom} // 내용 변경 시 자동 스크롤
        onLayout={scrollToBottom}
        showsVerticalScrollIndicator={false}>
        <ChatScreen chatRoom={chatRoom} user={user}></ChatScreen>
      </ScrollView>
      <ChatInput
        chatRoom={chatRoom}
        user={user}
        socketRef={socketRef} // ChatScreen에서 useState로 관리한 WebSocket 객체
      />
    </View>
  );
}

// 헤더 우측 설정 버튼
const renderHeaderRightChatSetting = setIsSettingsOpen => (
  <TouchableOpacity onPress={() => setIsSettingsOpen(true)}>
    <Image
      source={{uri: 'https://i.postimg.cc/WbtFytsT/setting.png'}}
      style={{
        width: getResponsiveWidth(26),
        height: getResponsiveHeight(28),
        marginRight: getResponsiveWidth(30),
        resizeMode: 'contain',
      }}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chatScrollView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: getResponsiveWidth(25),
    paddingBottom: getResponsiveHeight(80),
  },
});
