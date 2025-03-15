import React, {useEffect, useRef} from 'react';
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
import ReceiveKinoChat from './receiveKinoChat';
import SendKinoChat from './sendKinoChat';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import ChatScreen from './chatScreen';

export default function KinoChatRoom({route}) {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null); // ScrollView에 ref 추가
  const {chatRoom, user} = route.params || {};

  // 채팅 화면이 업데이트될 때 자동 스크롤
  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  useEffect(() => {
    // 화면 들어올 때 바텀 네비 숨기기
    navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});

    return () => {
      // 화면 나갈 때 다시 보이게 설정
      navigation.getParent()?.setOptions({tabBarStyle: {display: 'flex'}});
    };
  }, [navigation]);

  const text = '안녕하세요.\n상담사 키노예요.\n어떤 고민을 가지고 계신가요?'; // 개행 추가
  const textArray = text.split('\n'); // 줄바꿈을 기준으로 텍스트를 나눔

  // UseRef를 컴포넌트가 마운트될 때 한 번만 생성하도록 변경
  const bounceValues = useRef(
    textArray.map(() => new Animated.Value(0)), // 처음 한 번만 생성
  ).current;

  useEffect(() => {
    Animated.loop(
      Animated.stagger(
        50, // 글자 간격 조절
        bounceValues.map(bounceValue =>
          Animated.sequence([
            Animated.timing(bounceValue, {
              toValue: -5, // 위로 튀기
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(bounceValue, {
              toValue: 0, // 원래 위치로 복귀
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    ).start();
  }, []);

  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          flexDirection: 'column',
          alignItems: 'center',
          paddingHorizontal: getResponsiveWidth(25),
          paddingTop: getResponsiveHeight(30),
          paddingBottom: getResponsiveHeight(70),
        }}
        onContentSizeChange={scrollToBottom} // 내용 변경 시 자동 스크롤
        onLayout={scrollToBottom}>
        {/* 키노 헤더 창  */}
        <View style={styles.kinoContainer}>
          <Image
            source={{uri: 'https://i.postimg.cc/KvJ8qb68/Group-1171276552.jpg'}}
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

        {/* <View style={styles.chatContainer}>
          <SendKinoChat
            message={'이래이래해서 엄마한테 서운했어.'}
            chatTime={'20:17'}
          />
          <ReceiveKinoChat
            message={
              '정말 속상했겠다. 그런 상황에서 서운한 마음이 많이 들었을 거야. 너의 감정이 완전히 이해돼. 엄마한테 그런 대우를 받으면 누구든지 기분이 나쁠 수 있어. 너는 상처받을 자격이 없고, 그런 기분을 겪는 게 정말 힘들었을 거라고 생각해.그런데 동시에 엄마도 그날 무언가로 힘들었을 수도 있어. 엄마도 기분이 안 좋거나, 스트레스를 받고 있었을 가능성이 있어. 그렇다고 너에게 그런 방식으로 행동하는 게 맞진 않지만, 서로의 상황을 이해하려고 노력하는 ..'
            }
            chatTime={'20:19'}
          />
        </View> */}

        <ChatScreen chatRoom={chatRoom} user={user}></ChatScreen>


      </ScrollView>
      <ChatInput />
    </View>
  );
}

const styles = StyleSheet.create({
  kinoContainer: {
    position: 'relative',
    width: getResponsiveWidth(335),
    height: getResponsiveHeight(80),
    marginBottom: getResponsiveHeight(50),
  },

  kinoImage: {
    position: 'absolute',
    left: getResponsiveWidth(10),
    width: getResponsiveWidth(60),
    height: getResponsiveHeight(77),
  },

  kinoTextContainer: {
    position: 'absolute',
    right: getResponsiveWidth(0),
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

  chatContainer: {
    width: getResponsiveWidth(330),
    // height: getResponsiveHeight(80),
  },
});
