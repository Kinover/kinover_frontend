import React, {useEffect} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../../utils/responsive';
import {useNavigation} from '@react-navigation/native';
import ChatScreen from './chatScreen';
import ChatInput from './chatInput';
import {useRef} from 'react';

export default function FamilyChatRoom({route}) {
  const {chatRoom, user} = route.params || {};
  const navigation = useNavigation();
  const scrollViewRef = useRef(null); // ScrollView에 ref 추가

  useEffect(() => {
    navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});

    return () => {
      navigation.getParent()?.setOptions({tabBarStyle: {display: 'flex'}});
    };
  }, []);

  useEffect(() => {
    if (chatRoom) {
      navigation.setOptions({headerTitle: chatRoom.roomName});
    }
  }, [chatRoom, navigation]);

  if (!chatRoom || !user) {
    return <Text>데이터가 없습니다.</Text>;
  }

  // 채팅 화면이 업데이트될 때 자동 스크롤
  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
       {/* 오늘의 질문 */}
      <ImageBackground
          source={{uri: 'https://i.postimg.cc/ZYWh5gLS/Group-484-1.png'}}
          style={styles.todayQuestionContainer}
          resizeMode="contain">
          <View style={styles.todayQuestionContent}>
            <Text style={styles.todayQuestionTitle}>질문 03</Text>
            <Text style={styles.todayQuestionText}>
              우리 가족만이 가지고 있는 유행어나 습관이 있다면?
            </Text>
          </View>
        </ImageBackground>

      <ScrollView
        ref={scrollViewRef} // ref 연결
        contentContainerStyle={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingHorizontal: getResponsiveWidth(25),
          paddingTop: getResponsiveHeight(30),
          paddingBottom: getResponsiveHeight(70),
        }}
        onContentSizeChange={scrollToBottom} // 내용 변경 시 자동 스크롤
        onLayout={scrollToBottom}>

        <View style={styles.chatContainer}>
          <ChatScreen chatRoom={chatRoom} user={user} />
        </View>
      </ScrollView>
      <ChatInput chatRoom={chatRoom} />
    </View>
  );
}

const styles = StyleSheet.create({
  todayQuestionContainer: {
    position:'absolute',
    width: getResponsiveWidth(320),
    height: getResponsiveHeight(176.89),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: getResponsiveHeight(40),
    marginBottom: getResponsiveWidth(30),
    zIndex:100,
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

  chatContainer: {
    width: getResponsiveWidth(330),
  },
});
