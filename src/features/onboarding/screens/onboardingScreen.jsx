/* eslint-disable react-native/no-inline-styles */
// 기존 파일에서 훅 사용하도록 변경

import React, {useEffect, useRef} from 'react';
import {
  TouchableOpacity,
  View,
  Image,
  StyleSheet,
  Text,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useKakaoLogin} from 'features/auth/hooks/useKakaoLogin';
import {useOnboardingPager} from '../hooks/useOnboardingPager';
import {useAutoLogin} from 'features/auth/hooks/useAutoLogin';
import FastImage from '@d11/react-native-fast-image';

// ✅ 추가
import {useDispatch, useSelector} from 'react-redux';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'white'},
  slide: {
    width: SCREEN_WIDTH,
    height: getResponsiveHeight(500),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  backgroundImage: {
    position: 'absolute',
    width: '200%',
    height: '100%',
    bottom: -100,
  },
  slideText: {
    position: 'absolute',
    bottom:
      Platform.OS === 'android'
        ? getResponsiveHeight(-50)
        : getResponsiveHeight(0),
    fontFamily: 'Pretendard-Bold',
    color: '#333',
  },
  slideImage: {
    position: 'absolute',
    width: '100%',
    height: '80%',
    top: getResponsiveHeight(50),
    zIndex: 999,
  },
  highlight: {
    color: '#FF8D29',
    fontFamily: 'Pretendard-Bold',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom:
      Platform.OS === 'ios' ? getResponsiveHeight(70) : getResponsiveHeight(20),
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

const slides = [
  {
    key: '1',
    image: require('../../../assets/onboarding/slide1.png'),
    textSize: 25,
    textSize_ios: 26,
    text: (
      <>
        우리 가족, {'\n'}오늘은
        <Text style={styles.highlight}> 어떤 기분</Text>일까?
      </>
    ),
  },
  {
    key: '2',
    image: require('../../../assets/onboarding/slide2.png'),
    textSize: 23,
    textSize_ios: 24.5,
    text: (
      <>
        소소한 대화부터 고민 상담까지 {'\n'}채팅으로
        <Text style={styles.highlight}> 더 자주, 더 깊게</Text> 소통해요.
      </>
    ),
  },
  {
    key: '3',
    image: require('../../../assets/onboarding/slide3.png'),
    textSize: 25,
    textSize_ios: 26,
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
    image: require('../../../assets/onboarding/slide4.png'),
    textSize: 23,
    textSize_ios: 24.5,
    text: (
      <>
        <Text style={styles.highlight}>소중한 순간들</Text>을 {'\n'}
        사진으로 남기고, 마음으로 간직해요.
      </>
    ),
  },
];

export default function OnboardingScreen() {
  useAutoLogin();

  const dispatch = useDispatch();
  const userId = useSelector(state => state.user?.userId);

  // ✅ userId 잡힌 이후 "1번만" unread 체크
  const didFetchUnreadOnceRef = useRef(false);
  useEffect(() => {
    if (!userId) return;
    if (didFetchUnreadOnceRef.current) return;

    didFetchUnreadOnceRef.current = true;
  }, [dispatch, userId]);

  const {login} = useKakaoLogin();
  const {currentPage, handleScroll} = useOnboardingPager(SCREEN_WIDTH);

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom', 'right', 'left']}>
      <FlatList
        data={slides}
        keyExtractor={item => item.key}
        removeClippedSubviews={false}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({item}) => {
          const effectiveSize =
            Platform.OS === 'ios'
              ? item.textSize_ios ?? item.textSize
              : item.textSize;

          return (
            <View style={styles.slide}>
              {/* 배경 이미지 */}
              <FastImage
                source={require('../../../assets/onboarding/background.png')}
                style={styles.backgroundImage}
                resizeMode={FastImage.resizeMode.contain}
              />

              {/* 슬라이드 메인 이미지 */}
              <FastImage
                source={item.image}
                style={[
                  styles.slideImage,
                  item.key === '1' && {
                    width: '70%',
                    top: getResponsiveHeight(80),
                  },
                  item.key === '2' && {
                    width: '70%',
                    top: getResponsiveHeight(70),
                  },
                  item.key === '3' && {width: '70%'},
                  item.key === '4' && {
                    width: '100%',
                    zIndex: 999,
                  },
                ]}
                resizeMode={FastImage.resizeMode.contain}
              />

              {/* 텍스트 */}
              <Text
                style={[
                  styles.slideText,
                  {fontSize: getResponsiveFontSize(effectiveSize)},
                  item.key === '1' && {
                    alignSelf: 'baseline',
                    left: getResponsiveWidth(50),
                  },
                ]}>
                {item.text}
              </Text>
            </View>
          );
        }}
      />

      {/* 인디케이터 */}
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

      {/* 카카오 로그인 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={login}>
          <Image
            style={styles.loginButton}
            source={require('../../../assets/images/kakao-login-button.jpg')}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
