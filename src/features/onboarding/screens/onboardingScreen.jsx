/* eslint-disable react-native/no-inline-styles */
// src/features/onboarding/screens/OnboardingScreen.jsx

import React, {useMemo, useCallback, memo, useEffect, useRef, useState} from 'react';
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

  // ✅ FlatList item 전체
  slide: {
    flex: 1,
    backgroundColor: '#FFFEFC',
    overflow: 'hidden',
  },

  // ✅ 상단 Skip (높이/위치 안정화)
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

  // ✅ 위: 이미지 영역은 flex로
  heroArea: {
    flex: 4 / 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ✅ 아래: 텍스트 영역
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

  // ✅ 인디케이터
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

  // ✅ 하단 CTA
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
            {/* ✅ 여기서부터 슬라이드별 커스텀 모션 렌더 */}
            <OnboardingHeroMotion
              slideKey={item.key}
              isActive={isActive}
              scrollX={scrollX}
              index={index}
              width={width}
              imageSource={item.image} // ✅ 4번은 이 이미지 사용
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
  const {login} = useKakaoLogin();

  const listRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const currentIndexRef = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);

  const slides = useMemo(
    () => [
      {
        key: '1',
        // ✅ 1~3번은 사실상 이미지가 필요 없지만, 남겨도 무방
        image: require('../../../assets/onboarding/slide1_yellow.png'),
        textSize: 25,
        textSize_ios: 26,
        glow: {cy: '48%', color: '#F6E3B6', op0: 0.55, opMid: 0.22},
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
        // ✅ 4번은 “기존 이미지 사용”이므로 반드시 필요
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

  // ✅ iOS 음수 padding 제거 (안정성)
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

  /**
   * ✅ 슬라이드별 이미지 박스 스타일
   * - 지금은 기존값 유지 (네 스크린샷 기준 맞춰둔 느낌)
   */
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

  const updateIndex = useCallback(
    x => {
      const next = clamp(Math.round(x / SCREEN_WIDTH), 0, total - 1);
      if (currentIndexRef.current !== next) {
        currentIndexRef.current = next;
        setCurrentPage(next);
      }
    },
    [SCREEN_WIDTH, total],
  );

  const onMomentumEnd = useCallback(
    e => {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      updateIndex(x);
    },
    [updateIndex],
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [SCREEN_WIDTH],
  );

  const handleNext = useCallback(() => {
    const next = clamp(currentPage + 1, 0, total - 1);
    listRef.current?.scrollToIndex?.({index: next, animated: true});
    currentIndexRef.current = next;
    setCurrentPage(next);
  }, [currentPage, total]);

  const handleSkip = useCallback(() => {
    const last = total - 1;
    listRef.current?.scrollToIndex?.({index: last, animated: true});
    currentIndexRef.current = last;
    setCurrentPage(last);
  }, [total]);

  const handleLoginPress = useCallback(async () => {
    try {
      await login();
    } catch (e) {
      null;
    }
  }, [login]);

  const renderItem = useCallback(
    ({item, index}) => (
      <SlideItem
        item={item}
        index={index}
        width={SCREEN_WIDTH}
        scrollX={scrollX}
        imageBoxStyle={imageBoxByKey[item.key]}
        isActive={currentPage === index} // ✅ 활성 슬라이드 여부 전달
      />
    ),
    [SCREEN_WIDTH, scrollX, imageBoxByKey, currentPage],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 Skip */}
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
        scrollEventThrottle={16}
        style={{flex: 1}}
        onScroll={Animated.event([{nativeEvent: {contentOffset: {x: scrollX}}}], {
          useNativeDriver: true,
          listener: e => {
            const x = e?.nativeEvent?.contentOffset?.x ?? 0;
            const approx = clamp(Math.round(x / SCREEN_WIDTH), 0, total - 1);
            if (approx !== currentIndexRef.current) {
              currentIndexRef.current = approx;
              setCurrentPage(approx);
            }
          },
        })}
      />

      {/* 하단 CTA + 인디케이터 */}
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
            <TouchableOpacity activeOpacity={0.9} onPress={handleLoginPress}>
              <Image
                style={styles.kakaoBtnImage}
                source={require('../../../assets/images/kakao-login-button.jpg')}
              />
            </TouchableOpacity>
            <Text allowFontScaling={false} style={styles.helper}>
              카카오로 3초 만에 시작해요
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
