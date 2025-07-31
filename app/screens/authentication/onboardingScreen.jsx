// 🔐 카카오 로그인 후 토큰을 저장하도록 수정한 전체 OnboardingScreen 컴포넌트

import React, {useEffect, useState, useRef} from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
  Text,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {loginThunk} from '../../redux/thunk/loginThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  getHasFamily,
  getToken,
  saveLoginInfo,
} from '../../utils/storage';
import {setLoginSuccess} from '../../redux/slices/authSlice';
import {fetchUserThunk} from '../../redux/thunk/userThunk';
import {fetchFamilyThunk} from '../../redux/thunk/familyThunk';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export default function OnboardingScreen() {
  const slides = [
    {
      key: '1',
      image: require('../../assets/onboarding/slide1.png'),
      textSize: 26,
      text: (
        <>
          우리 가족, {'\n'}오늘은
          <Text style={styles.highlight}> 어떤 기분</Text>일까?
        </>
      ),
    },
    {
      key: '2',
      image: require('../../assets/onboarding/slide2.png'),
      textSize: 23,
      text: (
        <>
          소소한 대화부터 고민 상담까지 {'\n'}채팅으로
          <Text style={styles.highlight}> 더 자주, 더 깊게</Text> 소통해요.
        </>
      ),
    },
    {
      key: '3',
      image: require('../../assets/onboarding/slide3.png'),
      textSize: 26,
      text: (
        <>
          가족 일정, {'\n'}
          <Text style={styles.highlight}>한눈에 </Text>
          확인하고
          <Text style={styles.highlight}> 함께 </Text>
          챙겨요!
        </>
      ),
    },
    {
      key: '4',
      image: require('../../assets/onboarding/slide4.png'),
      textSize: 23,
      text: (
        <>
          <Text style={styles.highlight}>소중한 순간들</Text>을 {'\n'}
          사진으로 남기고, 마음으로 간직해요.
        </>
      ),
    },
  ];

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [isCheckingAutoLogin, setIsCheckingAutoLogin] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef();

  const navigateToHome = () => {
    navigation.reset({
      routes: [
        {
          name: 'Tabs',
          state: {
            routes: [{name: '홈', state: {routes: [{name: '홈'}]}}],
          },
        },
      ],
    });
  };

  const handleAutoLogin = async () => {
    try {
      const token = await getToken();
      const hasFamily = await getHasFamily();

      console.log('🔐 자동 로그인 - 토큰:', token);
      console.log('👨‍👩‍👧 hasFamily:', hasFamily);

      if (token && hasFamily) {
        dispatch(setLoginSuccess());
        await dispatch(fetchUserThunk());
        await dispatch(
          fetchFamilyThunk('0e992098-1544-11f0-be5c-0a1e787a0cd7'),
        );
        navigateToHome();
      }
    } catch (err) {
      console.error('🚨 자동 로그인 실패:', err);
    } finally {
      setIsCheckingAutoLogin(false);
    }
  };

  useEffect(() => {
    handleAutoLogin();
  }, []);

  const login = async () => {
    try {
      const result = await KakaoLogin.login();

      console.log('✅ Login Success:', result);

      // ⬇️ 토큰 저장
      await saveLoginInfo({
        token: result.accessToken,
        hasFamily: true,
      });

      await dispatch(loginThunk(result.accessToken));
      await dispatch(fetchUserThunk());
      await dispatch(fetchFamilyThunk('0e992098-1544-11f0-be5c-0a1e787a0cd7'));

      navigateToHome();
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

  const handleScroll = event => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentPage(index);
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom', 'right', 'left']}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={item => item.key}
        renderItem={({item}) => (
          <View style={styles.slide}>
            <Image
              source={require('../../assets/onboarding/background.png')}
              style={styles.backgroundImage}
              resizeMode="contain"
            />
            {item.key === '4' && currentPage === 3 && (
              <Image
                source={item.image}
                style={{
                  position: 'absolute',
                  width: '150%',
                  height: '75%',
                  top: getResponsiveHeight(30),
                  zIndex: 0,
                }}
                resizeMode="contain"
              />
            )}
            {item.key !== '4' && (
              <Image
                source={item.image}
                style={[
                  styles.slideImage,
                  item.key === '1' && {
                    width: '70%',
                    top: getResponsiveHeight(80),
                  },
                  item.key === '2' && {
                    width: '100%',
                    resizeMode: 'cover',
                    top: getResponsiveHeight(70),
                  },
                  item.key === '3' && {width: '70%'},
                ]}
                resizeMode="contain"
              />
            )}
            <Text
              style={[
                styles.slideText,
                {
                  fontSize: getResponsiveFontSize(item.textSize),
                  ...(item.key === '1' && {
                    alignSelf: 'baseline',
                    left: getResponsiveWidth(50),
                  }),
                },
              ]}>
              {item.text}
            </Text>
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              currentPage === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          onPress={!isCheckingAutoLogin ? login : null}
          disabled={isCheckingAutoLogin}>
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
  container: {flex: 1, backgroundColor: 'white'},
  slide: {
    width: SCREEN_WIDTH,
    height: getResponsiveHeight(500),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    bottom: Platform.OS === 'android' ? -50 : 0,
  },
  backgroundImage: {
    position: 'absolute',
    width: '200%',
    height: '100%',
    bottom: -100,
  },
  slideText: {
    position: 'absolute',
    bottom: getResponsiveHeight(10),
    fontSize: getResponsiveFontSize(23),
    fontFamily: 'Pretendard-Bold',
    fontWeight: Platform.OS === 'android' ? 'bold' : 'bold',
    color: '#333',
  },
  slideImage: {
    position: 'absolute',
    width: '100%',
    height: getResponsiveHeight(320),
    zIndex: 999,
  },
  highlight: {
    color: '#FF8D29',
    fontFamily: 'Pretendard-Bold',
    fontWeight: Platform.OS === 'android' ? 'bold' : 'bold',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom:
      Platform.OS === 'ios' ? getResponsiveHeight(70) : getResponsiveHeight(50),
    gap: getResponsiveWidth(18),
  },
  indicatorDot: {
    width: getResponsiveWidth(7),
    height: getResponsiveWidth(7),
    borderRadius: 999,
    backgroundColor: '#DDD0B1',
  },
  activeDot: {
    backgroundColor: '#FFB000',
    width: getResponsiveWidth(7),
    height: getResponsiveWidth(7),
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical:
      Platform.OS === 'ios' ? getResponsiveHeight(30) : getResponsiveHeight(40),
    backgroundColor: 'white',
    gap: getResponsiveHeight(16),
  },
  loginButton: {
    width: getResponsiveWidth(343),
    height: getResponsiveHeight(51),
    borderRadius: getResponsiveWidth(10),
  },
});