import React, {useEffect} from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  ImageBackground,
  Text,
} from 'react-native';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {loginThunk} from '../../redux/thunk/loginThunk';
import getResponsiveFontSize, {getResponsiveHeight, getResponsiveWidth} from '../../utils/responsive';

export default function OnboardingScreen() {
  const user = useSelector(state => state.user);
  const loginUser = useSelector(state => state.login);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const login = async () => {
    try {
      const result = await KakaoLogin.login();
      console.log('Login Success', result);

      const profile = await KakaoLogin.getProfile();
      console.log('GetProfile Success', profile);

      const kakaoUserDto = {
        kakaoId: profile.id,
        nickname: profile.nickname,
        email: profile.email,
        profileImageUrl: profile.profileImageUrl,
      };

      console.log('kakaoUserDto', kakaoUserDto);

      // 백엔드에 사용자 데이터 전송 및 JWT 토큰 수신
      dispatch(loginThunk(kakaoUserDto));
    } catch (error) {
      if (error.code === 'E_CANCELLED_OPERATION') {
        console.log('카카오 로그인 취소:', error.message);
      } else {
        console.log(`카카오 로그인 실패(code:${error.code})`, error.message);
      }
    }
  };

  useEffect(() => {
    console.log('✅ login status changed:', user);

    if (!loginUser.loading && user.userId !== null) {
      navigation.reset({
        index: 0,
        routes: [{name: '가족설정화면'}],
      });
    }
  }, [user, loginUser]);

  return (
    <View style={styles.container}>
      <View style={styles.mainContainer} />
      <View style={styles.bottomContainer}>
        <ImageBackground
          style={styles.loginBubbleMessage}
          source={require('../../assets/images/login-bubble-message.png')}>
          <Text style={styles.BubbleMessageText}>우리 가족 이야기, 시작해볼까요?</Text>
        </ImageBackground>
        <TouchableOpacity onPress={login}>
          <Image
            style={styles.loginButton}
            source={require('../../assets/images/kakao-login-button.jpg')}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  mainContainer: {
    width: '100%',
    height: '65%',
    backgroundColor: 'lightgray',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(50),
    backgroundColor: 'white',
    gap:getResponsiveHeight(10),
  },
  loginButton: {
    width: getResponsiveWidth(343),
    height: getResponsiveHeight(51),
    borderRadius: 10,
  },
  loginBubbleMessage: {
    position: 'relative',
    width: getResponsiveWidth(213),
    height: getResponsiveHeight(47),
  },
  BubbleMessageText: {
    fontFamily:'Pretendard-Light',
    fontSize:getResponsiveFontSize(14),
    position: 'absolute',
    textAlign: 'center',
    height: getResponsiveHeight(47),
    top: getResponsiveHeight(8.5),
    left: getResponsiveWidth(17.5),
  },
});
