import React, {useEffect, useState} from 'react';
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
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';

export default function OnboardingScreen() {
  const user = useSelector(state => state.user);
  const loginUser = useSelector(state => state.login);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [kakaoUserDto, setKakaoUserDto] = useState(null);

  const login = async () => {
    try {
      const result = await KakaoLogin.login();
      console.log('✅ Login Success:', result);

      const profile = await KakaoLogin.getProfile();
      console.log('✅ GetProfile Success:', profile);

      if (
        profile.id !== null &&
        profile.nickname !== null &&
        profile.email !== null &&
        profile.profileImageUrl !== null
      ) {
        const userData = {
          // kakaoId: Number(profile.id) || 0,
          // nickname: profile.nickname || "이름없음",
          // email: profile.email || "no-email@unknown.com",
          // profileImage: profile.profileImageUrl || "https://d",
          kakaoId: 12345678,
          nickname: "test",
          email: "test@example.com",
          profileImage: "https://example.com/image.jpg",
        };
        setKakaoUserDto(userData);

      } else {
        console.warn('⚠️ 카카오 프로필 정보가 불완전함:', profile);
      }
    } catch (error) {
      if (error.code === 'E_CANCELLED_OPERATION') {
        console.log('🚫 카카오 로그인 취소:', error.message);
      } else {
        console.log(
          `❌ 카카오 로그인 실패 (code:${error.code})`,
          error.message,
        );
      }
    }
  };

  // ✅ 프로필 데이터를 받은 뒤에 로그인 요청
  useEffect(() => {
    if (kakaoUserDto) {
      console.log('🚀 프로필 정보 수신 완료, 로그인 요청 보냄:',kakaoUserDto);
      dispatch(loginThunk(kakaoUserDto));
    }
  }, [kakaoUserDto]);

  // ✅ 로그인 완료되면 다음 화면으로 이동
  useEffect(() => {
    console.log('📌 login status changed:', user);

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
          <Text style={styles.BubbleMessageText}>
            우리 가족 이야기, 시작해볼까요?
          </Text>
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
    gap: getResponsiveHeight(10),
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
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(14),
    position: 'absolute',
    textAlign: 'center',
    height: getResponsiveHeight(47),
    top: getResponsiveHeight(8.5),
    left: getResponsiveWidth(17.5),
  },
});
