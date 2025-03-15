import React from 'react';
import {StyleSheet, View, Image, Text, TouchableOpacity} from 'react-native';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../utils/responsive';
import {useSelector} from 'react-redux';
// import * as Keychain from 'react-native-keychain';
import {deleteToken} from '../utils/storage';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {LOGOUT} from '../redux/actions/actionTypes';

export default function ProfileScreen() {
  const family = useSelector(state => state.family);
  const user = useSelector(state => state.user);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {login} = useSelector(state => state.user);

  const handleLogout = async () => {
    try {
      // secureStorage에서 'jwtToken' 삭제
      await deleteToken();
      console.log('로그아웃 처리 완료');
      dispatch({type: LOGOUT, payload: 'false'});

      // 로그아웃 후 리디렉션 처리 (예: 홈화면으로 이동)
      navigation.navigate('온보딩화면');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={styles.topContainer}>
          <View style={styles.imageContainer}>
            <TouchableOpacity style={{zIndex: 100, opacity: 0.95}}>
              <Image
                style={styles.camera}
                source={{
                  uri: 'https://i.postimg.cc/TY8RKv89/Group-1171276560.png',
                }}
              />
            </TouchableOpacity>
            {user.image ? (
              <Image style={styles.image} source={{uri: user.image}} />
            ) : (
              <Image
                style={styles.image}
                source={{uri: 'https://i.postimg.cc/hPMYQNhw/Ellipse-265.jpg'}}
              />
            )}
          </View>
          <Text style={styles.nameText}>{user.name}</Text>
        </View>
        <View style={styles.textContainer}>
          <View style={styles.textBox}>
            <Text style={styles.sectorText}>이름</Text>
            <Text style={styles.text}>|</Text>
            <Text style={styles.text}>{user.name}</Text>
          </View>
          <View style={styles.textBox}>
            <Text style={styles.sectorText}>생년월일</Text>
            <Text style={styles.text}>|</Text>
            <Text style={styles.text}>2000.00.00</Text>
          </View>
          <View style={styles.textBox}>
            <Text style={styles.sectorText}>아이디</Text>
            <Text style={styles.text}>|</Text>
            <Text style={styles.text}>{user.email}</Text>
          </View>
        </View>
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{color: 'gray'}}>회원탈퇴</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: getResponsiveHeight(40),
  },
  mainContainer: {
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(40),
    gap: getResponsiveHeight(20),
  },
  topContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveHeight(15),
  },

  imageContainer: {
    position: 'relative',
    width: 'auto',
  },

  image: {
    width: getResponsiveWidth(110),
    height: getResponsiveHeight(110),
    borderRadius: getResponsiveIconSize(55),
  },

  camera: {
    position: 'absolute',
    width: getResponsiveIconSize(26),
    height: getResponsiveIconSize(26),
    zIndex: 100,
    right: getResponsiveWidth(1),
  },

  nameText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(17),
  },

  textContainer: {
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: getResponsiveHeight(10),
  },

  textBox: {
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(32),
    paddingVertical: getResponsiveHeight(4),
    borderRadius: getResponsiveIconSize(30),
    borderColor: '#FFC84D',
    borderWidth: getResponsiveIconSize(1),
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: getResponsiveWidth(10),
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
  },

  sectorText: {
    width: getResponsiveWidth(60),
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
    textAlign: 'center',
  },

  text: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
    textAlign: 'flex-start',
  },

  bottomContainer: {
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: getResponsiveHeight(15),
  },

  button: {
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(32),
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveIconSize(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
  },
});
