import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  ImageBackground,
  Text,
} from 'react-native';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk } from '../../redux/thunk/loginThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHasFamily, getToken } from '../../utils/storage';
import { setLoginSuccess } from '../../redux/slices/authSlice';
import { fetchUserThunk } from '../../redux/thunk/userThunk';
import { fetchFamilyThunk } from '../../redux/thunk/familyThunk';

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [autoLoginDone, setAutoLoginDone] = useState(false); // ✅ 자동 로그인 완료 여부

  const login = async () => {
    try {
      const result = await KakaoLogin.login();
      console.log('✅ Login Success:', result);
      console.log('accessToken:', result.accessToken);

      dispatch(loginThunk(result.accessToken));
    } catch (error) {
      if (error.code === 'E_CANCELLED_OPERATION') {
        console.log('🚫 카카오 로그인 취소:', error.message);
      } else {
        console.log(`❌ 카카오 로그인 실패 (code:${error.code})`, error.message);
      }
    }
  };

  // ✅ 앱 실행 시 자동 로그인 시도
  useEffect(() => {
    const init = async () => {
      try {
        const token = await getToken();
        const hasFamily = await getHasFamily();
        console.log('🔐 토큰:', token);
        console.log('👨‍👩‍👧 hasFamily:', hasFamily);

        if (token && hasFamily) {
          console.log('🚀 자동 로그인 + 가족 있음 → 감정화면 이동');

          dispatch(setLoginSuccess());
          await dispatch(fetchUserThunk());
          await dispatch(fetchFamilyThunk('0e992098-1544-11f0-be5c-0a1e787a0cd7')); // TODO: 실제 familyId로 교체

          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'Tabs',
                state: {
                  routes: [
                    {
                      name: '감정기록',
                      state: {
                        routes: [{ name: '감정화면' }],
                      },
                    },
                  ],
                },
              },
            ],
          });
        }
      } catch (err) {
        console.error('🚨 자동 로그인 실패:', err);
      } finally {
        setAutoLoginDone(true); // ✅ 버튼 활성화
      }
    };

    init();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'right', 'left']}>
      <View style={styles.mainContainer} />
      <View style={styles.bottomContainer}>
        <ImageBackground
          style={styles.loginBubbleMessage}
          source={require('../../assets/images/login-bubble-message.png')}>
          <Text style={styles.BubbleMessageText}>우리 가족 이야기, 시작해볼까요?</Text>
        </ImageBackground>

        {/* ✅ 자동 로그인 끝난 후에만 클릭 가능 */}
        <TouchableOpacity onPress={autoLoginDone ? login : null} disabled={!autoLoginDone}>
          <Image
            style={styles.loginButton}
            source={require('../../assets/images/kakao-login-button.jpg')}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
