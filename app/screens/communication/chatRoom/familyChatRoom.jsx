import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import ChatScreen from './chatScreen';
import ChatInput from './chatInput';
import { getToken } from '../../../utils/storage';

export default function FamilyChatRoom({ route }) {
  const { chatRoom, user } = route.params || {};
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const socketRef = useRef(null);
  const [messageList, setMessageList] = useState([]);
  const [isQuestionVisible, setIsQuestionVisible] = useState(false);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
    };
  }, [navigation]);

  useEffect(() => {
    if (chatRoom) {
      navigation.setOptions({ headerTitle: chatRoom.roomName });
    }
  }, [chatRoom, navigation]);

  // ✅ 과거 메시지 불러오기
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `http://43.200.47.242:9090/api/chatRoom/${chatRoom.chatRoomId}/messages/fetch`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          }
        );
        const data = await res.json();
        console.log('📜 과거 메시지:', data.length);
        setMessageList(data);
      } catch (err) {
        console.error('❌ 메시지 가져오기 실패:', err);
      }
    };

    if (chatRoom) fetchMessages();
  }, [chatRoom]);

  // ✅ WebSocket 연결 및 실시간 메시지 처리
  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await getToken();
      if (!chatRoom || !user?.userId || !token) return;

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      const ws = new WebSocket(`ws://43.200.47.242:9090/chat?token=${token}`);

      ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📥 수신:', message);

          setMessageList(prev => [...prev, message]);
        } catch (err) {
          console.error('❌ 수신 메시지 파싱 실패:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('⚠️ WebSocket 오류:', err);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket 종료');
      };

      socketRef.current = ws;
    };

    connectWebSocket();

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [chatRoom?.roomId, user?.userId]);

  if (!chatRoom || !user) {
    return <Text>데이터가 없습니다.</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {isQuestionVisible && (
        <>
          <View style={styles.overlay} />
          <ImageBackground
            source={{ uri: 'https://i.postimg.cc/ZYWh5gLS/Group-484-1.png' }}
            style={styles.todayQuestionContainer}
            resizeMode="contain">
            <View style={styles.todayQuestionContent}>
              <Text style={styles.todayQuestionTitle}>질문 03</Text>
              <Text style={styles.todayQuestionText}>
                우리 가족만이 가지고 있는 유행어나 습관이 있다면?
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity><View style={styles.answerButton} /></TouchableOpacity>
              <TouchableOpacity><View style={styles.answerButton} /></TouchableOpacity>
              <TouchableOpacity>
                <Image
                  style={styles.plusButton}
                  source={{ uri: 'https://i.postimg.cc/63VJ4VHz/Group-1171276565-1.png' }}
                />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </>
      )}

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatScrollView}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        showsVerticalScrollIndicator={false}>
        <ChatScreen
          chatRoom={chatRoom}
          user={user}
          messageList={messageList} // ✅ 실시간 메시지 전달
        />
      </ScrollView>

      <ChatInput
        chatRoom={chatRoom}
        user={user}
        socketRef={socketRef}
        setMessageList={setMessageList} // ✅ 전송 시 메시지 리스트 갱신
      />
    </View>
  );
}


const styles = StyleSheet.create({
  todayQuestionContainer: {
    position: 'absolute',
    width: getResponsiveWidth(320),
    height: getResponsiveHeight(176.89),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: getResponsiveHeight(40),
    marginTop: getResponsiveHeight(60),
    zIndex: 200,
  },
  todayQuestionContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayQuestionTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
    marginBottom: getResponsiveHeight(15),
    textAlign: 'center',
  },
  todayQuestionText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(14),
    width: getResponsiveWidth(150),
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    flexDirection: 'row',
    top: getResponsiveHeight(150),
    width: getResponsiveWidth(320),
    paddingHorizontal: getResponsiveWidth(20),
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveWidth(7),
  },
  answerButton: {
    width: getResponsiveWidth(23.6),
    height: getResponsiveHeight(23.6),
    borderRadius: getResponsiveIconSize(11.8),
    backgroundColor: '#D9D9D9',
  },
  plusButton: {
    width: getResponsiveWidth(23.6),
    height: getResponsiveHeight(23.6),
  },
  chatScrollView: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: getResponsiveWidth(25),
    paddingBottom: getResponsiveHeight(80),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 150,
  },
});
