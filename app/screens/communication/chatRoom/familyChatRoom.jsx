import React, {useEffect, useState, useRef} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import ChatScreen from './chatScreen';
import ChatInput from './chatInput';

export default function FamilyChatRoom({route}) {
  const {chatRoom, user} = route.params || {};
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const [isQuestionVisible, setIsQuestionVisible] = useState(false); // 상태 추가

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: {display: 'none'},
      headerRight: () => (
        <TouchableOpacity onPress={() => setIsQuestionVisible(prev => !prev)}>
          <Image
            source={{
              uri: 'https://i.postimg.cc/3ryLhKKF/free-icon-message-5251132.png',
            }}
            style={{
              width: getResponsiveWidth(23),
              height: getResponsiveHeight(23),
              marginRight: getResponsiveWidth(30),
              resizeMode: 'contain',
            }}></Image>
        </TouchableOpacity>
      ),
    });

    return () => {
      navigation.setOptions({tabBarStyle: {display: 'flex'}});
    };
  }, [navigation, isQuestionVisible]);

  useEffect(() => {
    if (chatRoom) {
      navigation.setOptions({headerTitle: chatRoom.roomName});
    }
  }, [chatRoom, navigation]);

  if (!chatRoom || !user) {
    return <Text>데이터가 없습니다.</Text>;
  }

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  };

  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      {/* 질문 표시 및 배경 어둡게 */}
      {isQuestionVisible && (
        <>
          <View style={styles.overlay} />
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
            <View style={styles.buttonContainer}>
              <TouchableOpacity>
                <View style={styles.answerButton} />
              </TouchableOpacity>
              <TouchableOpacity>
                <View style={styles.answerButton} />
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  style={styles.plusButton}
                  source={{
                    uri: 'https://i.postimg.cc/63VJ4VHz/Group-1171276565-1.png',
                  }}
                />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </>
      )}

      {/* 채팅 화면 */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatScrollView}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}>
        <ChatScreen chatRoom={chatRoom} user={user} />
      </ScrollView>

      <ChatInput chatRoom={chatRoom} />
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
    display: 'flex',
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: getResponsiveWidth(25),
    paddingBottom: getResponsiveHeight(80),
  },
  chatContainer: {
    width: getResponsiveWidth(340),
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
