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
} from 'utils/responsive';

import {useKakaoLogin} from 'features/auth/hooks/useKakaoLogin';
import {useAppleLogin} from 'features/auth/hooks/useAppleLogin';

import {AppleButton} from '@invertase/react-native-apple-authentication';
import OnboardingHeroMotion from '../components/OnboardingHeroMotion';

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** 은은한 배경 글로우 - 가운데 진한 영역 넓게, 멀어질수록 연하게 */
const OnboardingSoftGlow = memo(function OnboardingSoftGlow({
  cy = '46%',
  rx = '55%',
  ry = '44%',
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
            <Stop offset="50%" stopColor={color} stopOpacity={opMid} />
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

/**
 * useEnterProgress (원샷 등장 시퀀스)
 * - isActive=true가 되는 순간 0→1
 * - isActive=false면 0 리셋 (다음 진입 때 다시 연출)
 */
function useEnterProgress(isActive, options = {}) {
  const {startDelay = 40, duration = 420} = options;

  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      v.stopAnimation?.();
      v.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.delay(startDelay),
      Animated.timing(v, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, v, startDelay, duration]);

  return v;
}

/**
 * useStaggerLines
 * - 줄(2~3개)을 순차로 등장시키는 값 배열(0→1)
 */
function useStaggerLines(isActive, count, options = {}) {
  const {startDelay = 140, itemDuration = 420, staggerMs = 110} = options;

  const anims = useMemo(
    () => Array.from({length: count}, () => new Animated.Value(0)),
    [count],
  );

  useEffect(() => {
    if (!isActive) {
      anims.forEach(v => v.setValue(0));
      return;
    }

    const seq = anims.map(v =>
      Animated.timing(v, {
        toValue: 1,
        duration: itemDuration,
        useNativeDriver: true,
      }),
    );

    Animated.sequence([
      Animated.delay(startDelay),
      Animated.stagger(staggerMs, seq),
    ]).start();
  }, [isActive, anims, startDelay, itemDuration, staggerMs]);

  return anims;
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFEFC'},
  slide: {flex: 1, backgroundColor: 'transparent', overflow: 'hidden'},

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

  heroArea: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  imageBox: {justifyContent: 'center', alignItems: 'center'},

  textArea: {
    paddingHorizontal: getResponsiveWidth(26),
    paddingTop: getResponsiveHeight(16),
    paddingBottom: getResponsiveHeight(16),
    zIndex: 1,
    elevation: 1,
    flexShrink: 0,
  },

  lineText: {
    fontFamily: 'Pretendard-Bold',
    color: '#333',
    letterSpacing: -0.2,
  },
  highlight: {color: '#FF8D29', fontFamily: 'Pretendard-Bold'},

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
    backgroundColor: 'transparent',
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
  appleBtn: {width: '100%', height: getResponsiveHeight(51)},

  helper: {
    marginTop: getResponsiveHeight(10),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12),
    color: '#9CA3AF',
  },
});

/**
 * CopyLines
 * - 2~3줄을 “스태거로 순차 등장”
 * - 동시에 scrollX 기반으로 좌/우 흐림/이동도 합성
 */
const CopyLines = memo(function CopyLines({
  lines,
  lineSize,
  index,
  width,
  scrollX,
  isActive,
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  // 스와이프 중 자연스러운 흐림/이동(연속)
  const swipeOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.18, 1, 0.18],
    extrapolate: 'clamp',
  });

  const swipeTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [10, 0, 10],
    extrapolate: 'clamp',
  });

  // 페이지 확정 후: 줄 순차 등장(원샷)
  const lineAnims = useStaggerLines(isActive, lines.length, {
    startDelay: 140,
    itemDuration: 420,
    staggerMs: 120,
  });

  return (
    <View>
      {lines.map((node, i) => {
        const v = lineAnims[i];

        const inOpacity = v.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });
        const inTranslateY = v.interpolate({
          inputRange: [0, 1],
          outputRange: [getResponsiveHeight(14), 0],
        });
        const inScale = v.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        });

        // 합성: swipe(연속) * in(원샷)
        const opacity = Animated.multiply(swipeOpacity, inOpacity);
        const translateY = Animated.add(swipeTranslateY, inTranslateY);

        return (
          <Animated.Text
            key={`line-${i}`}
            allowFontScaling={false}
            style={[
              styles.lineText,
              {
                fontSize: getResponsiveFontSize(lineSize),
                opacity,
                transform: [{translateY}, {scale: inScale}],
              },
            ]}>
            {node}
          </Animated.Text>
        );
      })}
    </View>
  );
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

  // 히어로(이미지) 기본: scrollX 연속 모션
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

  // 히어로 “원샷 등장” (페이지 확정 후: 살짝 더 자연스럽게)
  const enter = useEnterProgress(isActive, {startDelay: 20, duration: 420});
  const enterOpacity = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const enterTranslateY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [getResponsiveHeight(10), 0],
  });
  const enterScale = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.99, 1],
  });

  // 합성(연속 + 원샷)
  const heroOpacity = Animated.multiply(imageOpacity, enterOpacity);
  const heroTranslateY = Animated.add(imageTranslateY, enterTranslateY);

  const effectiveSize =
    Platform.OS === 'ios' ? item.textSize_ios ?? item.textSize : item.textSize;

  return (
    <View style={[styles.slide, {width}]}>
      <View
        style={[
          styles.heroArea,
          item.key === '2' && {marginTop: getResponsiveHeight(-65)},
          item.key === '3' && {marginTop: getResponsiveHeight(-30)},
        ]}>
        <Animated.View
          style={{
            opacity: heroOpacity,
            transform: [
              {translateY: heroTranslateY},
              {scale: Animated.multiply(imageScale, enterScale)},
            ],
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
        <CopyLines
          lines={item.copyLines}
          lineSize={getResponsiveFontSize(effectiveSize)}
          index={index}
          width={width}
          scrollX={scrollX}
          isActive={isActive}
        />
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

  /**
   * copyLines로 “줄 단위 순차 등장” 가능하게 데이터 구조 변경
   * - 2~3줄 추천(너무 많으면 산만)
   */
  const slides = useMemo(
    () => [
      {
        key: '1',
        image: require('../../../assets/onboarding/slide1_yellow.png'),
        textSize: 20.5,
        textSize_ios: 21.5,
        glow: {cy: '38%', color: '#EBD4A8', op0: 0.82, opMid: 0.4},
        copyLines: [
          <>우리 가족,</>,
          <>
            <>오늘은 </>
            <Text allowFontScaling={false} style={styles.highlight}>
              어떤 기분
            </Text>
            일까?
          </>,
        ],
      },
      {
        key: '2',
        image: require('../../../assets/onboarding/slide2.png'),
        textSize: 19,
        textSize_ios: 20,
        glow: {
          cy: '46%',
          rx: '68%',
          ry: '54%',
          color: '#E8D9B0',
          op0: 0.76,
          opMid: 0.42,
        },
        copyLines: [
          <>소소한 대화부터 고민 상담까지</>,
          <>
            채팅으로{' '}
            <Text allowFontScaling={false} style={styles.highlight}>
              더 자주, 더 깊게
            </Text>{' '}
            소통해요.
          </>,
        ],
      },
      {
        key: '3',
        image: require('../../../assets/onboarding/slide3.png'),
        textSize: 20.5,
        textSize_ios: 21.5,
        glow: {
          cy: '44%',
          rx: '68%',
          ry: '54%',
          color: '#EBD4A8',
          op0: 0.74,
          opMid: 0.4,
        },
        copyLines: [
          <>가족 일정,</>,
          <>
            <Text allowFontScaling={false} style={styles.highlight}>
              한눈에
            </Text>{' '}
            확인하고{' '}
            <Text allowFontScaling={false} style={styles.highlight}>
              함께
            </Text>{' '}
            챙겨요!
          </>,
        ],
      },
      {
        key: '4',
        image: require('../../../assets/onboarding/slide4.png'),
        textSize: 19,
        textSize_ios: 20,
        glow: {
          cy: '45%',
          rx: '68%',
          ry: '54%',
          color: '#EBD8B8',
          op0: 0.78,
          opMid: 0.42,
        },
        copyLines: [
          <>
            <Text allowFontScaling={false} style={styles.highlight}>
              소중한 순간들
            </Text>
            을
          </>,
          <>사진으로 남기고</>,
          <>마음으로 간직해요.</>,
        ],
      },
    ],
    [SCREEN_WIDTH],
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
        width: SCREEN_WIDTH * 0.75,
        height: getResponsiveHeight(310),
        marginTop: getResponsiveHeight(60),
      },
      3: {
        width: SCREEN_WIDTH * 0.76,
        height: getResponsiveHeight(420),
        marginTop: getResponsiveHeight(10),
      },
      4: {
        width: SCREEN_WIDTH * 1.1,
        height: getResponsiveHeight(340) * 1.1,
        marginTop: getResponsiveHeight(0),
      },
    }),
    [SCREEN_WIDTH],
  );

  // preload
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

  // width 변화 시 현재 페이지로 재정렬
  useEffect(() => {
    const idx = clamp(currentIndexRef.current, 0, total - 1);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex?.({index: idx, animated: false});
    });
  }, [SCREEN_WIDTH, total]);

  const getItemLayout = useCallback(
    (_, index) => ({length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index}),
    [SCREEN_WIDTH],
  );

  // 페이지 확정은 momentum end에서만
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
      <OnboardingSoftGlow
        cy="50%"
        rx="68%"
        ry="54%"
        color="#EBD8B8"
        op0={0.78}
        opMid={0.42}
      />

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
          {
            useNativeDriver: true,
          },
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
