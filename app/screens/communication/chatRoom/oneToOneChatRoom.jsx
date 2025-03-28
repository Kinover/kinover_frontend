import React, {useEffect, useRef,useState} from 'react';
import {ScrollView, TouchableOpacity,Image,View, Text, StyleSheet} from 'react-native';
import ChatInput from './chatInput';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import ChatScreen from './chatScreen';
import {useNavigation} from '@react-navigation/native';

export default function OneToOneChatRoom({route}) {
  const {chatRoom, user} = route.params || {}; // params에서 가져오기
  const navigation = useNavigation();
  const scrollViewRef = useRef(null); // ScrollView에 ref 추가

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
        onLayout={scrollToBottom}>
        <ChatScreen chatRoom={chatRoom} user={user}></ChatScreen>
      </ScrollView>
      <ChatInput chatRoom={chatRoom} />
    </View>
  );
}

// 헤더 우측 설정 버튼
const renderHeaderRightChatSetting = (setIsSettingsOpen) => (
  <TouchableOpacity onPress={() => setIsSettingsOpen(true)}>
    <Image
      source={{ uri: 'https://i.postimg.cc/WbtFytsT/setting.png' }}
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
