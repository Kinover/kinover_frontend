import 'react-native-gesture-handler'; // 이 코드가 제일 첫 줄에 있어야 합니다.
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import React from 'react';
import {StyleSheet} from 'react-native';
import ChatRoomListScreen from './chatRoomListScreen';
import ShortCommentScreen from './shortCommentScreen';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';
import FloatingButton from '../../utils/floatingButton';
import UserHeader from './header';

export default function CommunicationScreen({navigation}) {


  // 가족 정보, 유저 정보 fetch

  return (
    <GestureHandlerRootView style={styles.mainContainer}>

      {/* 유저 헤더 */}
      <UserHeader />

      {/* 가족 구성원 한마디 */}
      <ShortCommentScreen />

      {/* 채팅방 리스트 바텀시트 */}
      <ChatRoomListScreen navigation={navigation} />

      {/* 채팅방 추가 플로팅 버튼 */}
      <FloatingButton type="communication" />
    </GestureHandlerRootView>
  );
}

// 스타일 시트
const styles = StyleSheet.create({
  mainContainer: {
    position: 'relative',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(30),
    paddingVertical: getResponsiveHeight(30),
    backgroundColor: '#FFC84D',
    gap: getResponsiveHeight(30),
  },

});
