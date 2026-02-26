/* eslint-disable react-native/no-inline-styles */
// src/features/onboarding/components/OnboardingHeroMotion.jsx

import React, {memo, useEffect, useMemo, useRef} from 'react';
import {View, Text, StyleSheet, Image, Animated} from 'react-native';

import Svg, {Defs, RadialGradient, Stop, Ellipse} from 'react-native-svg';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

// Slide1 감정 아이콘 이미지 맵
const emotionIcons = {
  annoyed: require('../../../assets/icons/state_v2/annoyed.png'),
  anxious: require('../../../assets/icons/state_v2/anxious.png'),
  depressed: require('../../../assets/icons/state_v2/depressed.png'),
  excited: require('../../../assets/icons/state_v2/excited.png'),
  exhausted: require('../../../assets/icons/state_v2/exhausted.png'),
  happy: require('../../../assets/icons/state_v2/happy.png'),
  neutral: require('../../../assets/icons/state_v2/neutral.png'),
  sorry: require('../../../assets/icons/state_v2/sorry.png'),
};

// Slide2 키노 캐릭터 3종
const kinoImages = {
  blue: require('../../../assets/onboarding/slide2/blueKino.png'),
  yellow: require('../../../assets/onboarding/slide2/yellowKino.png'),
  pink: require('../../../assets/onboarding/slide2/pinkKino.png'),
};

// Slide2 말풍선(이미지) 4장
const bubbleImages = {
  1: require('../../../assets/onboarding/slide2/1_2.png'),
  2: require('../../../assets/onboarding/slide2/2_2.png'),
  3: require('../../../assets/onboarding/slide2/3_2.png'),
  4: require('../../../assets/onboarding/slide2/4_2.png'),
};

// Slide2 배경 스마트폰 이미지
const phoneBgImage = require('../../../assets/onboarding/slide2/bg.png');

// Slide3 배경 스마트폰 이미지
const slide3BgImage = require('../../../assets/onboarding/slide3/bg.png');

// Slide3 카드 이미지
const slide3CardImages = {
  1: require('../../../assets/onboarding/slide3/card1.png'),
  2: require('../../../assets/onboarding/slide3/card2.png'),
};

/** 히어로 전체 “원샷 등장” */
function useHeroEnter(isActive, options = {}) {
  const {startDelay = 40, duration = 380} = options;
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      v.stopAnimation?.();
      v.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.delay(startDelay),
      Animated.timing(v, {toValue: 1, duration, useNativeDriver: true}),
    ]).start();
  }, [isActive, v, startDelay, duration]);

  const opacity = v.interpolate({inputRange: [0, 1], outputRange: [0, 1]});
  const translateY = v.interpolate({
    inputRange: [0, 1],
    outputRange: [getResponsiveHeight(10), 0],
  });
  const scale = v.interpolate({inputRange: [0, 1], outputRange: [0.99, 1]});

  return {opacity, translateY, scale};
}

/** Slide1 그룹 “통통” */
function useOneShotBounce(isActive) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) {
      scale.setValue(1);
      return;
    }

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.58,
        duration: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.02,
        speed: 25,
        bounciness: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 18,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, scale]);

  return scale;
}

/** 살짝 떠다님 */
function useGentleFloat(isActive) {
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;

    if (isActive) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatY, {
            toValue: -getResponsiveHeight(3),
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(floatY, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      floatY.stopAnimation?.();
      floatY.setValue(0);
    }

    return () => loop?.stop?.();
  }, [isActive, floatY]);

  return floatY;
}

/** 펄스 */
function usePulse(isActive) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;

    if (isActive) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 850,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      pulse.stopAnimation?.();
      pulse.setValue(0);
    }

    return () => loop?.stop?.();
  }, [isActive, pulse]);

  const scale = pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.08]});
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.86],
  });

  return {scale, opacity};
}

/** Slide2 말풍선 스태거 */
function useStaggerIn(isActive, count) {
  const anims = useMemo(
    () => Array.from({length: count}, () => new Animated.Value(0)),
    [count],
  );

  useEffect(() => {
    if (!isActive) {
      anims.forEach(v => v.setValue(0));
      return;
    }

    const ITEM_DURATION = 520;
    const STAGGER_MS = 260;
    const START_DELAY = 220;

    const seq = anims.map(v =>
      Animated.timing(v, {
        toValue: 1,
        duration: ITEM_DURATION,
        useNativeDriver: true,
      }),
    );

    Animated.sequence([
      Animated.delay(START_DELAY),
      Animated.stagger(STAGGER_MS, seq),
    ]).start();
  }, [isActive, anims]);

  return anims;
}

/** Slide2 키노 라인 “팝” */
function useKinoPop(isActive) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      v.stopAnimation?.();
      v.setValue(0);
      return;
    }

    Animated.sequence([
      Animated.delay(320),
      Animated.spring(v, {
        toValue: 1,
        speed: 20,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, v]);

  const opacity = v.interpolate({inputRange: [0, 1], outputRange: [0, 1]});
  const translateY = v.interpolate({
    inputRange: [0, 1],
    outputRange: [getResponsiveHeight(8), 0],
  });
  const scale = v.interpolate({inputRange: [0, 1], outputRange: [0.98, 1]});

  return {opacity, translateY, scale};
}

/** 부드러운 그림자 */
const EmotionShadow = memo(function EmotionShadow({wrapSize}) {
  const w = wrapSize;
  const h = wrapSize;

  const dx = getResponsiveWidth(0.5);
  const dy = getResponsiveHeight(0.5);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="130%" height="130%">
        <Defs>
          <RadialGradient id="emoShadow" cx="70%" cy="70%" r="100%">
            <Stop offset="0%" stopColor="#000" stopOpacity="0.18" />
            <Stop offset="55%" stopColor="#000" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#000" stopOpacity="0.0" />
          </RadialGradient>
        </Defs>

        <Ellipse
          cx={w / 2 + dx}
          cy={h / 2 + dy}
          rx={w * 0.34}
          ry={h * 0.34}
          fill="url(#emoShadow)"
        />
      </Svg>
    </View>
  );
});

const EMO_SIZE = getResponsiveWidth(76);
const SHADOW_PAD = getResponsiveWidth(10);
const EMO_WRAP = EMO_SIZE + SHADOW_PAD * 3;

const s = StyleSheet.create({
 // Slide1
  emotionsWrap: {
    width: getResponsiveWidth(280),
    height: getResponsiveWidth(280),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionShadowWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: EMO_WRAP,
    height: EMO_WRAP,
  },
  emotionCircle: {
    position: 'absolute',
    left: SHADOW_PAD,
    top: SHADOW_PAD,
    width: EMO_SIZE,
    height: EMO_SIZE,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emotionImg: {width: '100%', height: '100%', resizeMode: 'contain'},

 // Slide2
  slide2Container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatWrap: {
    width: getResponsiveWidth(290),
    height: getResponsiveHeight(330),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveWidth(12),
    overflow: 'visible',
  },
  phoneBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  bubbleWrap: {position: 'absolute'},
  kinoRow: {
    position: 'absolute',
    bottom: getResponsiveHeight(-62),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: getResponsiveWidth(22),
  },
  kino: {
    width: getResponsiveWidth(66),
    height: getResponsiveWidth(66),
    resizeMode: 'contain',
  },

 // Slide3
  slide3Container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide3PhoneWrap: {
    width: getResponsiveWidth(290),
    height: getResponsiveHeight(330),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveWidth(12),
    overflow: 'visible',
  },
  slide3PhoneBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  calWrap: {
    position: 'relative',
    width: getResponsiveWidth(280),
    paddingTop: getResponsiveHeight(200),
    paddingBottom: getResponsiveHeight(4),
    alignSelf: 'center',
    zIndex: 1,
  },
  cardContainer: {
    position: 'relative',
    width: '100%',
    alignSelf: 'center',
    marginTop: getResponsiveHeight(-30),
    marginBottom: getResponsiveHeight(-30),
    zIndex: 1,
  },
  cardImage: {
    width: '100%',
    height: getResponsiveHeight(140),
    resizeMode: 'contain',
  },
  weekText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(9.5),
    color: '#333',
    textAlign: 'center',
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap'},
  dayText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(9.5),
    color: '#111',
    textAlign: 'center',
  },
  muted: {color: '#D1D5DB'},
  dot: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(9),
    color: '#111',
  },
  dotGhost: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFEFC',
  },

 // Slide4
  photo: {width: '100%', height: '105%', resizeMode: 'cover'},
});

/** Slide1 */
const Slide1Emotions = memo(function Slide1Emotions({isActive}) {
  const heroEnter = useHeroEnter(isActive, {startDelay: 30, duration: 360});
  const bounceScale = useOneShotBounce(isActive);
  const floatY = useGentleFloat(isActive);

  const layout = useMemo(() => {
    const centerKey = 'excited';
    const ringKeys = [
      'neutral',
      'anxious',
      'sorry',
      'annoyed',
      'happy',
      'depressed',
      'exhausted',
    ];

    const count = ringKeys.length;
    const step = (Math.PI * 2) / count;
    const r = getResponsiveWidth(108);
    const start = -Math.PI / 2;

    const ring = ringKeys.map((key, i) => {
      const a = start + step * i;
      return {key, x: r * Math.cos(a), y: r * Math.sin(a)};
    });

    return {centerKey, ring};
  }, []);

  const wrapHalf = EMO_WRAP / 2;

  return (
    <Animated.View
      style={[
        s.emotionsWrap,
        {
          opacity: heroEnter.opacity,
          transform: [
            {translateY: Animated.add(floatY, heroEnter.translateY)},
            {scale: Animated.multiply(bounceScale, heroEnter.scale)},
          ],
        },
      ]}>
      <View
        style={[
          s.emotionShadowWrap,
          {transform: [{translateX: -wrapHalf}, {translateY: -wrapHalf}]},
        ]}>
        <EmotionShadow wrapSize={EMO_WRAP} />
        <View style={s.emotionCircle}>
          <Image source={emotionIcons[layout.centerKey]} style={s.emotionImg} />
        </View>
      </View>

      {layout.ring.map(p => (
        <View
          key={p.key}
          style={[
            s.emotionShadowWrap,
            {
              transform: [
                {translateX: p.x - wrapHalf},
                {translateY: p.y - wrapHalf},
              ],
            },
          ]}>
          <EmotionShadow wrapSize={EMO_WRAP} />
          <View style={s.emotionCircle}>
            <Image source={emotionIcons[p.key]} style={s.emotionImg} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
});

/** Slide2 */
const Slide2Chat = memo(function Slide2Chat({isActive}) {
  const heroEnter = useHeroEnter(isActive, {startDelay: 40, duration: 360});
  const floatY = useGentleFloat(isActive);
  const items = useStaggerIn(isActive, 4);
  const kinoPop = useKinoPop(isActive);

  const bubbleAnimStyle = (v, base) => {
    const opacity = v;
    const translateY = v.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 0],
    });
    return {opacity, transform: [{translateY}], ...base};
  };

  const kinoUp = floatY.interpolate({
    inputRange: [-getResponsiveHeight(3), 0],
    outputRange: [-getResponsiveHeight(2), 0],
    extrapolate: 'clamp',
  });

  const BUBBLE_H = getResponsiveHeight(37);
  const EDGE = getResponsiveWidth(-25); // 좌우 간격 증가
  const EXTRA_INSET = getResponsiveWidth(0);
  const REF_W = getResponsiveWidth(220);
  const MAX_W_FOR_T = getResponsiveWidth(320);

 // 가져리(노치) 영역을 피하기 위해 시작 위치를 아래로 조정
  const TOP_OFFSET = getResponsiveHeight(100); // 더 아래로
  const BUBBLE_SPACING = getResponsiveHeight(52); // 말풍선 간 간격
  const bubbleTop = useMemo(
    () => [
      TOP_OFFSET,
      TOP_OFFSET + BUBBLE_SPACING,
      TOP_OFFSET + BUBBLE_SPACING * 2,
      TOP_OFFSET + BUBBLE_SPACING * 3,
    ],
    [TOP_OFFSET, BUBBLE_SPACING],
  );

  const sources = useMemo(
    () => [bubbleImages[1], bubbleImages[2], bubbleImages[3], bubbleImages[4]],
    [],
  );

  const bubbles = useMemo(() => {
    return sources.map((src, i) => {
      const resolved = Image.resolveAssetSource(src);
      const w = resolved?.width ?? 1;
      const h = resolved?.height ?? 1;
      const ratio = w / h;

      const bubbleW = Math.round(BUBBLE_H * ratio);

      const t = clamp((bubbleW - REF_W) / (MAX_W_FOR_T - REF_W), 0, 1);
      const inset = EDGE + EXTRA_INSET * t;

      const isRight = i % 2 === 0;

      return {
        key: String(i + 1),
        src,
        width: bubbleW,
        height: BUBBLE_H,
        pos: isRight
          ? {top: bubbleTop[i], right: inset}
          : {top: bubbleTop[i], left: inset},
      };
    });
  }, [sources, BUBBLE_H, EDGE, EXTRA_INSET, REF_W, MAX_W_FOR_T, bubbleTop]);

  return (
    <Animated.View
      style={[
        s.slide2Container,
        {
          opacity: heroEnter.opacity,
          transform: [
            {translateY: heroEnter.translateY},
            {scale: heroEnter.scale},
          ],
        },
      ]}>
      {/* 배경 스마트폰 이미지 + 말풍선들 + 키노 캐릭터 */}
      <View style={s.chatWrap}>
        {/* 배경 스마트폰 이미지 */}
        <Image source={phoneBgImage} style={s.phoneBg} />

        {/* 말풍선들 */}
        {bubbles.map((b, idx) => (
          <Animated.View
            key={b.key}
            style={[
              s.bubbleWrap,
              bubbleAnimStyle(items[idx], b.pos),
              {width: b.width, height: b.height},
            ]}>
            <Image
              source={b.src}
              style={{width: '100%', height: '100%'}}
              resizeMode="contain"
            />
          </Animated.View>
        ))}

        {/* 키노 캐릭터들 (휴대폰 배경 이미지 안, 말풍선 아래) */}
        <Animated.View
          style={[
            s.kinoRow,
            {
              opacity: kinoPop.opacity,
              transform: [
                {translateY: Animated.add(kinoUp, kinoPop.translateY)},
                {scale: kinoPop.scale},
              ],
            },
          ]}>
          <View style={{transform: [{translateY: getResponsiveHeight(-26)}]}}>
            <Image
              source={kinoImages.yellow}
              style={[
                s.kino,
                {width: getResponsiveWidth(52), height: getResponsiveWidth(52)},
              ]}
            />
          </View>
          <View style={{transform: [{translateY: getResponsiveHeight(-2)}]}}>
            <Image
              source={kinoImages.blue}
              style={[
                s.kino,
                {width: getResponsiveWidth(80), height: getResponsiveWidth(80)},
              ]}
            />
          </View>
          <View style={{transform: [{translateY: getResponsiveHeight(-12)}]}}>
            <Image
              source={kinoImages.pink}
              style={[
                s.kino,
                {width: getResponsiveWidth(88), height: getResponsiveWidth(88)},
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
});

/** Slide3 */
const Slide3Calendar = memo(function Slide3Calendar({isActive}) {
  const heroEnter = useHeroEnter(isActive, {startDelay: 40, duration: 360});
  const {scale, opacity} = usePulse(isActive);
  const cardAnims = useStaggerIn(isActive, 2);

 // 이미지 설명: 2일, 6일은 진한 주황색 / 17일, 23일, 25일, 27일은 연한 노란색 배경 + 주황색 테두리
  const filled = useMemo(() => new Set([2, 6]), []); // 진한 주황색
  const outlined = useMemo(() => new Set([17, 23, 25, 27]), []); // 연한 노란색 배경 + 주황색 테두리
  const mutedDays = useMemo(() => new Set([29, 30]), []);
  const week = useMemo(() => ['일', '월', '화', '수', '목', '금', '토'], []);

  const filledColorMap = useMemo(
    () => ({
      2: '#FFB50E', // 진한 주황색
      6: '#FFB50E', // 진한 주황색
    }),
    [],
  );

  const outlinedColorMap = useMemo(
    () => ({
      17: '#FFF3D2', // 연한 노란색 배경
      23: '#FFF3D2',
      25: '#FFF3D2',
      27: '#FFF3D2',
    }),
    [],
  );

  const wrapW = getResponsiveWidth(250);
  const padX = getResponsiveWidth(10);

  const cellW = useMemo(() => {
    const raw = (wrapW - padX * 2) / 7;
    return Math.floor(raw);
  }, [wrapW, padX]);

  const contentW = cellW * 7;
  const extra = wrapW - contentW;
  const adjPadX = Math.floor(extra / 2);

  const cellH = getResponsiveHeight(32);
  const days = useMemo(() => Array.from({length: 30}, (_, i) => i + 1), []);

  const cardAnimStyle = v => {
    const cardOpacity = v.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    const cardTranslateY = v.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 0],
    });
    return {
      opacity: cardOpacity,
      transform: [{translateY: cardTranslateY}, {scale: 1.15}],
    };
  };

  return (
    <Animated.View
      style={[
        s.slide3Container,
        {
          opacity: heroEnter.opacity,
          transform: [
            {translateY: heroEnter.translateY},
            {scale: heroEnter.scale},
          ],
        },
      ]}>
      {/* 배경 스마트폰 이미지 */}
      <View style={s.slide3PhoneWrap}>
        <Image source={slide3BgImage} style={s.slide3PhoneBg} />

        {/* 달력 */}
        <View style={[s.calWrap, {width: wrapW}]}>
          <View style={[{flexDirection: 'row'}, {paddingHorizontal: adjPadX}]}>
            {week.map(w => (
              <View
                key={w}
                style={{
                  width: cellW,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text allowFontScaling={false} style={s.weekText}>
                  {w}
                </Text>
              </View>
            ))}
          </View>

          <View style={[s.grid, {paddingHorizontal: adjPadX}]}>
            {days.map(d => {
              const isFilled = filled.has(d);
              const isOutlined = outlined.has(d);
              const isMuted = mutedDays.has(d);

              const baseCellStyle = {
                width: cellW,
                height: cellH,
                justifyContent: 'center',
                alignItems: 'center',
              };

              if (isFilled) {
                const bg = filledColorMap?.[d] ?? '#FFB50E';
                return (
                  <View key={d} style={baseCellStyle}>
                    <Animated.View
                      style={[
                        s.dot,
                        {backgroundColor: bg},
                        {transform: [{scale}], opacity},
                      ]}>
                      <Text allowFontScaling={false} style={s.dotText}>
                        {d}
                      </Text>
                    </Animated.View>
                  </View>
                );
              }

              if (isOutlined) {
                const bg = outlinedColorMap?.[d] ?? '#FFF3D2';
                return (
                  <View key={d} style={baseCellStyle}>
                    <View
                      style={[
                        s.dotGhost,
                        {
                          backgroundColor: bg,
                          borderColor: '#FFB50E',
                          borderWidth: 1,
                        },
                      ]}>
                      <Text allowFontScaling={false} style={s.dayText}>
                        {d}
                      </Text>
                    </View>
                  </View>
                );
              }

              return (
                <View key={d} style={baseCellStyle}>
                  <Text
                    allowFontScaling={false}
                    style={[s.dayText, isMuted ? s.muted : null]}>
                    {d}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 카드들 */}
        <View style={{width: '100%', alignItems: 'center'}}>
          <Animated.View style={[s.cardContainer, cardAnimStyle(cardAnims[0])]}>
            <Image source={slide3CardImages[1]} style={s.cardImage} />
          </Animated.View>
          <Animated.View style={[s.cardContainer, cardAnimStyle(cardAnims[1])]}>
            <Image source={slide3CardImages[2]} style={s.cardImage} />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
});

/** Slide4 */
const Slide4Photo = memo(function Slide4Photo({
  scrollX,
  index,
  width,
  imageSource,
  isActive,
}) {
  const heroEnter = useHeroEnter(isActive, {startDelay: 30, duration: 360});

  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const rotate = scrollX.interpolate({
    inputRange,
    outputRange: ['-1deg', '0deg', '1deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={{
        width: '100%',
        height: '100%',
        opacity: heroEnter.opacity,
        transform: [
          {translateY: heroEnter.translateY},
          {scale: heroEnter.scale},
          {rotateZ: rotate},
        ],
      }}>
      <Image source={imageSource} style={s.photo} />
    </Animated.View>
  );
});

export default memo(function OnboardingHeroMotion({
  slideKey,
  isActive,
  scrollX,
  index,
  width,
  imageSource,
}) {
  if (slideKey === '1') return <Slide1Emotions isActive={isActive} />;
  if (slideKey === '2') return <Slide2Chat isActive={isActive} />;
  if (slideKey === '3') return <Slide3Calendar isActive={isActive} />;

  return (
    <Slide4Photo
      isActive={isActive}
      scrollX={scrollX}
      index={index}
      width={width}
      imageSource={imageSource}
    />
  );
});
