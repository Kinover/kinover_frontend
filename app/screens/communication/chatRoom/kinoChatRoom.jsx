import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  ScrollView,
  TextInput,
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import ChatInput from './chatInput';
import ChatScreen from './chatScreen';
import {getToken} from '../../../utils/storage';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';

export default function KinoChatRoom({route}) {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const socketRef = useRef(null);
  const {chatRoom, user} = route.params || {};
  const [messageList, setMessageList] = useState([]);
  const text = '안녕하세요.\n상담사 키노예요.\n어떤 고민을 가지고 계신가요?'; // 개행 추가
  const textArray = text.split('\n'); // 줄바꿈을 기준으로 텍스트를 나눔
  // UseRef를 컴포넌트가 마운트될 때 한 번만 생성하도록 변경
  const bounceValues = useRef(
    textArray.map(() => new Animated.Value(0)), // 처음 한 번만 생성
  ).current;

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  useEffect(() => {
    navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});
    return () =>
      navigation.getParent()?.setOptions({tabBarStyle: {display: 'flex'}});
  }, [navigation]);

  // 🧪 서버에서 과거 메시지 불러오기
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `http://43.200.47.242:9090/api/chatRoom/${chatRoom.chatRoomId}/messages/fetch`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          },
        );
        const data = await res.json();
        console.log('📜 과거 메시지 불러옴:', data.length);
        setMessageList(data);
      } catch (err) {
        console.error('📛 메시지 불러오기 실패:', err);
      }
    };

    if (chatRoom) fetchMessages();
  }, [chatRoom]);

  // 🧪 WebSocket 연결 및 수신 메시지 수집
  useEffect(() => {
    const connectWebSocket = async () => {
      const token = await getToken();
      if (!chatRoom || !user?.userId || !token) return;

      const ws = new WebSocket(`ws://43.200.47.242:9090/chat?token=${token}`);

      ws.onopen = () => {
        console.log('✅ WebSocket 연결됨');
      };

      ws.onmessage = event => {
        try {
          const newMessage = JSON.parse(event.data);
          console.log('📥 수신 메시지:', newMessage);

          setMessageList(prev => {
            const updated = [...prev, newMessage];
            console.log('🆕 갱신된 messageList 길이:', updated.length);
            return updated;
          });
        } catch (err) {
          console.error('❌ WebSocket 수신 파싱 실패:', err);
        }
      };

      ws.onerror = err => console.error('⚠️ WebSocket 오류:', err);
      ws.onclose = () => console.log('🔌 WebSocket 종료');

      socketRef.current = ws;
    };

    connectWebSocket();

    return () => {
      socketRef.current?.close();
    };
  }, []);

  // 🧪 messageList 변화 로그
  useEffect(() => {
    console.log('🔄 messageList 변경 감지됨. 현재 길이:', messageList.length);
  }, [messageList]);

  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <View style={styles.kinoContainer}>
        <Image
          source={require('../../../assets/images/chatRoom_kino.jpg')}
          style={styles.kinoImage}
        />
        <View style={styles.kinoTextContainer}>
          {textArray.map((line, lineIndex) => (
            <View
              key={lineIndex}
              style={{flexDirection: 'row', flexWrap: 'wrap'}}>
              {line.split('').map((char, index) => (
                <Animated.Text
                  key={index} // 각 문자에 고유한 key 값을 부여
                  style={[
                    styles.kinoText,
                    char === '키' || char === '노' ? styles.highlight : null, // 키노 강조
                    {transform: [{translateY: bounceValues[lineIndex]}]},
                  ]}>
                  {char}
                </Animated.Text>
              ))}
            </View>
          ))}
        </View>
      </View>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatScrollView}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        showsVerticalScrollIndicator={false}>
        <ChatScreen chatRoom={chatRoom} user={user} messageList={messageList} />
      </ScrollView>
      <ChatInput
        chatRoom={chatRoom}
        user={user}
        socketRef={socketRef}
        setMessageList={setMessageList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chatScrollView: {
    flexGrow: 1,
    flexDirection: 'column',
    paddingBottom: getResponsiveHeight(80),
    paddingHorizontal: getResponsiveWidth(20),
  },

  kinoContainer: {
    position: 'relative',
    width: getResponsiveWidth(335),
    height: getResponsiveHeight(80),
    marginBottom: getResponsiveHeight(20),
    marginTop: getResponsiveHeight(15),
    // gap:getResponsiveWidth(10),
    display: 'flex',
    alignSelf: 'center',
  },

  kinoImage: {
    position: 'absolute',
    left: getResponsiveWidth(10),
    width: getResponsiveWidth(60),
    height: getResponsiveHeight(77),
  },

  kinoTextContainer: {
    position: 'absolute',
    right: getResponsiveWidth(-10),
    bottom: getResponsiveHeight(0),
    width: getResponsiveWidth(250),
    flexDirection: 'column',
    flexWrap: 'wrap', // 여러 줄 지원
  },

  kinoText: {
    fontFamily: 'Pretendard-Light',
    textAlign: 'left',
    fontSize: getResponsiveFontSize(20),
    color: '#000',
  },

  highlight: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-Bold',
  },
});

