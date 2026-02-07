/* eslint-disable react-native/no-inline-styles */
// src/features/onboarding/screens/OnboardingScreen.jsx

import React, {
  useMemo,
  useCallback,
  memo,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Animated,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';
import Svg, {Defs, Rect, RadialGradient, Stop} from 'react-native-svg';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useKakaoLogin} from 'features/auth/hooks/useKakaoLogin';
import {useAppleLogin} from 'features/auth/hooks/useAppleLogin';

// ✅ Apple Button
import {AppleButton} from '@invertase/react-native-apple-authentication';

// ✅ 추가: 슬라이드별 모션 히어로 컴포넌트
import OnboardingHeroMotion from '../components/OnboardingHeroMotion';

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/**
 * ✅ 은은한 배경 글로우
 */
const OnboardingSoftGlow = memo(function OnboardingSoftGlow({
  cy = '46%',
  rx = '62%',
  ry = '46%',
  color = '#F6E3B6',
  op0 = 0.55,
  opMid = 0.2,
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient
            id="onboardingGlow"
            cx="50%"
            cy={cy}
            rx={rx}
            ry={ry}
            fx="50%"
            fy={cy}>
            <Stop offset="0%" stopColor={color} stopOpacity={op0} />
            <Stop offset="45%" stopColor={color} stopOpacity={opMid} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </RadialGradient>
        </Defs>

        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#onboardingGlow)"
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFEFC'},

  slide: {
    flex: 1,
    backgroundColor: '#FFFEFC',
    overflow: 'hidden',
  },

  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'flex-end',
    paddingHorizontal: getResponsiveWidth(16),
  },
  skipHit: {
    height: getResponsiveHeight(36),
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13),
    color: '#9CA3AF',
  },

  heroArea: {
    flex: 4 / 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  textArea: {
    paddingHorizontal: getResponsiveWidth(26),
    paddingTop: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(10),
  },
  titleText: {
    fontFamily: 'Pretendard-Bold',
    color: '#333',
    letterSpacing: -0.2,
  },
  highlight: {
    color: '#FF8D29',
    fontFamily: 'Pretendard-Bold',
  },

  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    marginBottom: getResponsiveHeight(14),
    marginTop: getResponsiveHeight(2),
  },
  indicatorDot: {
    width: getResponsiveWidth(7),
    height: getResponsiveWidth(7),
    borderRadius: 999,
    backgroundColor: '#DDD0B1',
  },
  activeDot: {
    backgroundColor: '#FFB000',
    width: getResponsiveWidth(18),
    height: getResponsiveWidth(7),
    borderRadius: 999,
  },

  bottomArea: {
    backgroundColor: '#FFFEFC',
    paddingHorizontal: getResponsiveWidth(18),
    paddingTop: getResponsiveHeight(6),
  },

  nextBtn: {
    height: getResponsiveHeight(51),
    borderRadius: getResponsiveWidth(10),
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14.5),
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  kakaoBtnImage: {
    width: '100%',
    height: getResponsiveHeight(51),
    borderRadius: getResponsiveWidth(10),
    resizeMode: 'cover',
  },

  appleBtnWrap: {
    marginTop: getResponsiveHeight(10),
    borderRadius: getResponsiveWidth(10),
    overflow: 'hidden',
  },
  appleBtn: {
    width: '100%',
    height: getResponsiveHeight(51),
  },

  helper: {
    marginTop: getResponsiveHeight(10),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12),
    color: '#9CA3AF',
  },
});

const SlideItem = memo(function SlideItem({
  item,
  index,
  width,
  scrollX,
  imageBoxStyle,
  isActive,
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const imageOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.25, 1, 0.25],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [14, 0, 14],
    extrapolate: 'clamp',
  });

  const imageScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.985, 1, 0.985],
    extrapolate: 'clamp',
  });

  const textOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.2, 1, 0.2],
    extrapolate: 'clamp',
  });

  const textTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [10, 0, 10],
    extrapolate: 'clamp',
  });

  const effectiveSize =
    Platform.OS === 'ios' ? item.textSize_ios ?? item.textSize : item.textSize;

  return (
    <View style={[styles.slide, {width}]}>
      <OnboardingSoftGlow {...item.glow} />

      <View style={styles.heroArea}>
        <Animated.View
          style={{
            opacity: imageOpacity,
            transform: [{translateY: imageTranslateY}, {scale: imageScale}],
          }}>
          <View style={[styles.imageBox, imageBoxStyle]}>
            <OnboardingHeroMotion
              slideKey={item.key}
              isActive={isActive}
              scrollX={scrollX}
              index={index}
              width={width}
              imageSource={item.image}
            />
          </View>
        </Animated.View>
      </View>

      <View style={styles.textArea}>
        <Animated.Text
          allowFontScaling={false}
          style={[
            styles.titleText,
            {
              fontSize: getResponsiveFontSize(effectiveSize),
              opacity: textOpacity,
              transform: [{translateY: textTranslateY}],
            },
          ]}>
          {item.text}
        </Animated.Text>
      </View>
    </View>
  );
});

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const {width: SCREEN_WIDTH} = useWindowDimensions();

  const {login: kakaoLogin} = useKakaoLogin();
  const {login: appleLogin} = useAppleLogin();

  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const currentIndexRef = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);

  const slides = useMemo(
    () => [
      {
        key: '1',
        image: require('../../../assets/onboarding/slide1_yellow.png'),
        textSize: 25,
        textSize_ios: 26,
        glow: {cy: '38%', color: '#F6E3B6', op0: 0.65, opMid: 0.32},
        text: (
          <>
            우리 가족, {'\n'}오늘은
            <Text allowFontScaling={false} style={styles.highlight}>
              {' '}
              어떤 기분
            </Text>
            일까?
          </>
        ),
      },
      {
        key: '2',
        image: require('../../../assets/onboarding/slide2.png'),
        textSize: 23,
        textSize_ios: 24.5,
        glow: {cy: '46%', color: '#F5E7C6', op0: 0.5, opMid: 0.18},
        text: (
          <>
            소소한 대화부터 고민 상담까지 {'\n'}채팅으로
            <Text allowFontScaling={false} style={styles.highlight}>
              {' '}
              더 자주, 더 깊게
            </Text>{' '}
            소통해요.
          </>
        ),
      },
      {
        key: '3',
        image: require('../../../assets/onboarding/slide3.png'),
        textSize: 25,
        textSize_ios: 26,
        glow: {cy: '44%', color: '#F6E3B6', op0: 0.48, opMid: 0.16},
        text: (
          <>
            가족 일정, {'\n'}
            <Text allowFontScaling={false} style={styles.highlight}>
              한눈에{' '}
            </Text>
            확인하고
            <Text allowFontScaling={false} style={styles.highlight}>
              {' '}
              함께{' '}
            </Text>
            챙겨요!
          </>
        ),
      },
      {
        key: '4',
        image: require('../../../assets/onboarding/slide4.png'),
        textSize: 23,
        textSize_ios: 24.5,
        glow: {cy: '45%', color: '#F6EBD3', op0: 0.52, opMid: 0.2},
        text: (
          <>
            <Text allowFontScaling={false} style={styles.highlight}>
              소중한 순간들
            </Text>
            을 {'\n'}
            사진으로 남기고 마음으로 간직해요.
          </>
        ),
      },
    ],
    [],
  );

  const total = slides.length;
  const isLast = currentPage === total - 1;

  const bottomPadding = useMemo(() => {
    const base = Platform.OS === 'ios' ? 0 : getResponsiveHeight(14);
    return Math.max(insets.bottom, 0) + base;
  }, [insets.bottom]);

  const topBarPaddingTop = useMemo(() => {
    return (
      insets.top +
      (Platform.OS === 'ios' ? getResponsiveHeight(4) : getResponsiveHeight(2))
    );
  }, [insets.top]);

  const imageBoxByKey = useMemo(
    () => ({
      1: {
        width: SCREEN_WIDTH * 0.74,
        height: getResponsiveHeight(360),
        marginTop: getResponsiveHeight(18),
      },
      2: {
        width: SCREEN_WIDTH * 0.78,
        height: getResponsiveHeight(300),
        marginTop: getResponsiveHeight(8),
      },
      3: {
        width: SCREEN_WIDTH * 0.76,
        height: getResponsiveHeight(340),
        marginTop: getResponsiveHeight(10),
      },
      4: {
        width: SCREEN_WIDTH * 1,
        height: getResponsiveHeight(340),
        marginTop: getResponsiveHeight(0),
      },
    }),
    [SCREEN_WIDTH],
  );

  // ✅ preload (image가 있을 때만)
  useEffect(() => {
    try {
      const sources = slides
        .map(s => {
          if (!s?.image) return null;
          const resolved = Image.resolveAssetSource(s.image);
          const uri = resolved?.uri;
          if (!uri) return null;
          return {uri};
        })
        .filter(Boolean);

      if (sources.length > 0) FastImage.preload(sources);
    } catch (e) {
      null;
    }
  }, [slides]);

  // ✅ width 변화(리사이즈/회전) 시 현재 페이지로 재정렬
  useEffect(() => {
    const idx = clamp(currentIndexRef.current, 0, total - 1);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex?.({index: idx, animated: false});
    });
  }, [SCREEN_WIDTH, total]);

  const getItemLayout = useCallback(
    (_, index) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [SCREEN_WIDTH],
  );

  // ✅ 페이지 확정은 "스크롤 끝"에서만
  const onMomentumEnd = useCallback(
    e => {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      const next = clamp(Math.round(x / SCREEN_WIDTH), 0, total - 1);
      if (currentIndexRef.current !== next) currentIndexRef.current = next;
      setCurrentPage(next);
    },
    [SCREEN_WIDTH, total],
  );

  const handleNext = useCallback(() => {
    const next = clamp(currentIndexRef.current + 1, 0, total - 1);
    listRef.current?.scrollToIndex?.({index: next, animated: true});
    // ✅ 여기서 setCurrentPage를 "미리" 바꾸지 않음 (스크롤 끝나면 onMomentumEnd에서 확정)
  }, [total]);

  const handleSkip = useCallback(() => {
    const last = total - 1;
    listRef.current?.scrollToIndex?.({index: last, animated: true});
  }, [total]);

  const handleKakaoLoginPress = useCallback(async () => {
    try {
      await kakaoLogin();
    } catch (e) {
      null;
    }
  }, [kakaoLogin]);

  const handleAppleLoginPress = useCallback(async () => {
    try {
      await appleLogin();
    } catch (e) {
      null;
    }
  }, [appleLogin]);

  const onScrollToIndexFailed = useCallback(
    info => {
      // ✅ 안드에서 가끔 레이아웃 측정 전 실패 -> 잠깐 뒤 재시도
      const index = clamp(info?.index ?? 0, 0, total - 1);
      setTimeout(() => {
        listRef.current?.scrollToIndex?.({index, animated: true});
      }, 80);
    },
    [total],
  );

  const renderItem = useCallback(
    ({item, index}) => (
      <SlideItem
        item={item}
        index={index}
        width={SCREEN_WIDTH}
        scrollX={scrollX}
        imageBoxStyle={imageBoxByKey[item.key]}
        isActive={currentPage === index}
      />
    ),
    [SCREEN_WIDTH, scrollX, imageBoxByKey, currentPage],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={[styles.topBar, {paddingTop: topBarPaddingTop}]}>
        <View style={styles.skipHit}>
          {!isLast ? (
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.8}>
              <Text allowFontScaling={false} style={styles.skipText}>
                건너뛰기
              </Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
        </View>
      </View>

      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        getItemLayout={getItemLayout}
        renderItem={renderItem}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollToIndexFailed={onScrollToIndexFailed}
        scrollEventThrottle={16}
        style={{flex: 1}}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {useNativeDriver: true},
        )}
      />

      <View style={[styles.bottomArea, {paddingBottom: bottomPadding}]}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, idx) => (
            <View
              key={String(idx)}
              style={[
                styles.indicatorDot,
                currentPage === idx && styles.activeDot,
              ]}
            />
          ))}
        </View>

        {!isLast ? (
          <>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleNext}
              style={styles.nextBtn}>
              <Text allowFontScaling={false} style={styles.nextText}>
                다음
              </Text>
            </TouchableOpacity>
            <Text allowFontScaling={false} style={styles.helper}>
              스와이프해서 넘길 수 있어요
            </Text>
          </>
        ) : (
          <>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleKakaoLoginPress}>
              <Image
                style={styles.kakaoBtnImage}
                source={require('../../../assets/images/kakao-login-button.jpg')}
              />
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <View style={styles.appleBtnWrap}>
                <AppleButton
                  buttonStyle={AppleButton.Style.BLACK}
                  buttonType={AppleButton.Type.SIGN_IN}
                  style={styles.appleBtn}
                  onPress={handleAppleLoginPress}
                />
              </View>
            )}

            {Platform.OS === 'ios' ? (
              <Text allowFontScaling={false} style={styles.helper}>
                간편 로그인으로 3초 만에 시작해요
              </Text>
            ) : (
              <Text allowFontScaling={false} style={styles.helper}>
                카카오로 3초 만에 시작해요
              </Text>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
