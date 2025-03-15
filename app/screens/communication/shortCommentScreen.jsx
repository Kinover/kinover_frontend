import React from 'react';
import {StyleSheet} from 'react-native';
import {View, Image, Text} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {useDispatch, useSelector} from 'react-redux';
import {LOGOUT} from '../../redux/actions/actionTypes';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import {useNavigation} from '@react-navigation/native';

export default function ShortCommentScreen() {
  const user = useSelector(state => state.user);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const appLogout = () => {
    KakaoLogin.logout();
    dispatch({type: LOGOUT, payload: true});
    if (user.login == false) {
      navigation.navigate('온보딩화면');
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* 멤버 1 */}
      <View style={styles.memberContainer1}>
        <Image
          style={styles.memberImage1}
          source={{
            uri: 'https://i.postimg.cc/WbwCzH5N/Ellipse-5-1.png',
          }}></Image>
        <View style={styles.memberComment1Container}>
          <Image
            style={styles.memberComment1}
            source={{
              uri: 'https://i.postimg.cc/8CBftFdF/Group-483-1.png',
            }}></Image>
          <Text style={styles.commentText} onPress={appLogout}>
            멤버 1 코멘트
          </Text>
        </View>
      </View>
      {/* 멤버 2 */}
      <View style={styles.memberContainer2}>
        <View style={styles.memberComment2Container}>
          <Image
            style={styles.memberComment2}
            source={{
              uri: 'https://i.postimg.cc/022nmvsd/Group-482.png',
            }}></Image>
          <Text style={styles.commentText}>멤버 2 코멘트</Text>
        </View>
        <Image
          style={styles.memberImage2}
          source={{
            uri: 'https://i.postimg.cc/WbwCzH5N/Ellipse-5-1.png',
          }}></Image>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingTop: getResponsiveWidth(30),
  },

  // 1
  memberContainer1: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: getResponsiveWidth(10),
    width: getResponsiveWidth(250),
    height: getResponsiveHeight(100),
    position: 'relative', // 상대적인 위치를 설정하여 텍스트를 이미지 위에 배치할 수 있게 해줍니다
  },

  memberImage1: {
    width: getResponsiveIconSize(80),
    height: getResponsiveIconSize(80),
    alignSelf: 'flex-end',
    resizeMode: 'contain',
  },

  memberComment1Container: {
    position: 'absolute', // 이미지를 배경으로, 텍스트를 그 위에 배치
    top: 0,
    left: getResponsiveWidth(85),
    justifyContent: 'center',
    alignItems: 'center',
    width: getResponsiveWidth(100),
    height: getResponsiveHeight(60),
  },

  memberComment1: {
    position: 'absolute', // 이미지 위에 텍스트를 배치
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  // 2
  memberContainer2: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: getResponsiveWidth(250),
    height: getResponsiveHeight(70),
    gap: getResponsiveWidth(10),
    position: 'relative', // 상대적인 위치 설정
  },

  memberImage2: {
    width: getResponsiveIconSize(65),
    height: getResponsiveIconSize(65),
    resizeMode: 'contain',
  },

  memberComment2Container: {
    position: 'absolute', // 이미지 위에 텍스트 배치
    top: 0,
    left: getResponsiveWidth(85),
    justifyContent: 'center',
    alignItems: 'center',
    width: getResponsiveWidth(100),
    height: getResponsiveHeight(50),
  },

  memberComment2: {
    position: 'absolute', // 이미지 위에 텍스트 배치
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  commentText: {
    color: 'gray', // 텍스트 색상
    fontSize: getResponsiveFontSize(12),
    textAlign: 'center', // 텍스트 중앙 정렬
    position: 'relative', // 텍스트를 이미지 위에 배치
    top: '50%', // 이미지 중앙에 텍스트 위치
    left: '50%',
    transform: [{translateX: -50}, {translateY: -50}], // 중앙 정렬
  },
});
