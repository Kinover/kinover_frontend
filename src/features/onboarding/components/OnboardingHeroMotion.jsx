/* eslint-disable react-native/no-inline-styles */
// src/features/onboarding/components/OnboardingHeroMotion.jsx

import React, {memo, useEffect, useMemo, useRef} from 'react';
import {View, Text, StyleSheet, Image, Animated, Platform} from 'react-native';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../utils/responsive';

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

const kinoImages = {
  blue: require('../../../assets/onboarding/slide2/kino-b.png'),
  yellow: require('../../../assets/onboarding/slide2/kino-y.png'),
  pink: require('../../../assets/onboarding/slide2/kino-p.png'),
};

// ✅ 말풍선 이미지(1~4)
const bubbleImages = {
  1: require('../../../assets/onboarding/slide2/1.png'),
  2: require('../../../assets/onboarding/slide2/2.png'),
  3: require('../../../assets/onboarding/slide2/3.png'),
  4: require('../../../assets/onboarding/slide2/4.png'),
};

function useOneShotBounce(isActive) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) {
      scale.setValue(1);
      return;
    }

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.02,
        speed: 18,
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

    const seq = anims.map((v, idx) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 260,
        delay: idx * 110,
        useNativeDriver: true,
      }),
    );

    Animated.stagger(90, seq).start();
  }, [isActive, anims]);

  return anims;
}

const s = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Slide 1
  emotionsWrap: {
    width: getResponsiveWidth(280),
    height: getResponsiveWidth(280),
    justifyContent: 'center',
    alignItems: 'center',
  },

  emotionCircle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: getResponsiveWidth(76),
    height: getResponsiveWidth(76),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',

    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 999,
    shadowOffset: {width: 3, height: 3.5},
    elevation: 10,
  },

  emotionImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  // Slide 2
  chatWrap: {
    width: getResponsiveWidth(300),
    height: getResponsiveHeight(320),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveWidth(12),
  },

  bubbleWrap: {
    position: 'absolute',
  },

  // ✅ 여기 핵심: stretch로 박스를 꽉 채워서 “크기 통일”
  bubbleImg: {
    resizeMode: 'contain',
  },

  kinoRow: {
    position: 'absolute',
    bottom:
      Platform.OS === 'ios'
        ? getResponsiveHeight(-35)
        : getResponsiveHeight(-45),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: getResponsiveWidth(30),
  },
  kino: {
    width: getResponsiveWidth(66),
    height: getResponsiveWidth(66),
    resizeMode: 'contain',
  },

  // Slide 3
  calWrap: {
    width: getResponsiveWidth(320),
    paddingTop: getResponsiveHeight(10),
    paddingBottom: getResponsiveHeight(10),
    alignSelf: 'center',
  },
  weekText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13),
    color: '#333',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13),
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
    fontSize: getResponsiveFontSize(12.5),
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

  // Slide 4
  photo: {
    width: '100%',
    height: '105%',
    resizeMode: 'cover',
  },
});

const Slide1Emotions = memo(function Slide1Emotions({isActive}) {
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

  const circleSize = getResponsiveWidth(76);

  return (
    <Animated.View
      style={[
        s.emotionsWrap,
        {transform: [{translateY: floatY}, {scale: bounceScale}]},
      ]}>
      <View
        style={[
          s.emotionCircle,
          {
            transform: [
              {translateX: -circleSize / 2},
              {translateY: -circleSize / 2},
            ],
          },
        ]}>
        <Image source={emotionIcons[layout.centerKey]} style={s.emotionImg} />
      </View>

      {layout.ring.map(p => (
        <View
          key={p.key}
          style={[
            s.emotionCircle,
            {
              transform: [
                {translateX: p.x - circleSize / 2},
                {translateY: p.y - circleSize / 2},
              ],
            },
          ]}>
          <Image source={emotionIcons[p.key]} style={s.emotionImg} />
        </View>
      ))}
    </Animated.View>
  );
});

const Slide2Chat = memo(function Slide2Chat({isActive}) {
  const floatY = useGentleFloat(isActive);
  const items = useStaggerIn(isActive, 4);

  const bubbleAnimStyle = (v, base) => {
    const opacity = v;
    const translateY = v.interpolate({inputRange: [0, 1], outputRange: [8, 0]});
    return {opacity, transform: [{translateY}], ...base};
  };

  const kinoUp = floatY.interpolate({
    inputRange: [-getResponsiveHeight(3), 0],
    outputRange: [-getResponsiveHeight(2), 0],
    extrapolate: 'clamp',
  });

  // ✅ “보이는 크기” 통일: 4개 모두 동일 박스
  // - 너 chatWrap이 300px이니까 너무 꽉 차지 않게 살짝 여유 둔 폭 추천
  const BUBBLE_W = getResponsiveWidth(235);
  const BUBBLE_H = getResponsiveHeight(46);

  const bubblePos = useMemo(
    () => [
      {top: getResponsiveHeight(10), right: getResponsiveWidth(10)},
      {top: getResponsiveHeight(62), left: getResponsiveWidth(12)},
      {top: getResponsiveHeight(132), right: getResponsiveWidth(18)},
      {top: getResponsiveHeight(192), left: getResponsiveWidth(14)},
    ],
    [],
  );

  return (
    <View style={s.chatWrap}>
      <Animated.View
        style={[s.bubbleWrap, bubbleAnimStyle(items[0], bubblePos[0])]}>
        <Image
          source={bubbleImages[1]}
          style={[s.bubbleImg, {width: BUBBLE_W, height: BUBBLE_H}]}
        />
      </Animated.View>

      <Animated.View
        style={[s.bubbleWrap, bubbleAnimStyle(items[1], bubblePos[1])]}>
        <Image
          source={bubbleImages[2]}
          style={[s.bubbleImg, {width: BUBBLE_W, height: BUBBLE_H}]}
        />
      </Animated.View>

      <Animated.View
        style={[s.bubbleWrap, bubbleAnimStyle(items[2], bubblePos[2])]}>
        <Image
          source={bubbleImages[3]}
          style={[s.bubbleImg, {width: BUBBLE_W, height: BUBBLE_H}]}
        />
      </Animated.View>

      <Animated.View
        style={[s.bubbleWrap, bubbleAnimStyle(items[3], bubblePos[3])]}>
        <Image
          source={bubbleImages[4]}
          style={[s.bubbleImg, {width: BUBBLE_W, height: BUBBLE_H}]}
        />
      </Animated.View>

      <Animated.View style={[s.kinoRow, {transform: [{translateY: kinoUp}]}]}>
        <Image
          source={kinoImages.yellow}
          style={[
            s.kino,
            {width: getResponsiveWidth(56), height: getResponsiveWidth(56)},
          ]}
        />
        <Image
          source={kinoImages.blue}
          style={[
            s.kino,
            {width: getResponsiveWidth(87), height: getResponsiveWidth(87)},
          ]}
        />
        <Image
          source={kinoImages.pink}
          style={[
            s.kino,
            {width: getResponsiveWidth(101), height: getResponsiveWidth(101)},
          ]}
        />
      </Animated.View>
    </View>
  );
});

const Slide3Calendar = memo(function Slide3Calendar({isActive}) {
  const {scale, opacity} = usePulse(isActive);

  const filled = useMemo(() => new Set([2, 6, 17, 23]), []);
  const outlined = useMemo(() => new Set([25, 27]), []);
  const mutedDays = useMemo(() => new Set([29, 30]), []);
  const week = useMemo(() => ['일', '월', '화', '수', '목', '금', '토'], []);

  const filledColorMap = useMemo(
    () => ({
      2: '#FFB50E',
      6: '#FFD370',
      17: '#FFF3D2',
      23: '#FFD370',
    }),
    [],
  );

  const wrapW = getResponsiveWidth(320);
  const padX = getResponsiveWidth(10);
  const cellW = useMemo(() => {
    const raw = (wrapW - padX * 2) / 7;
    return Math.floor(raw);
  }, [wrapW, padX]);

  const contentW = cellW * 7;
  const extra = wrapW - contentW;
  const adjPadX = Math.floor(extra / 2);

  const cellH = getResponsiveHeight(38);
  const days = useMemo(() => Array.from({length: 30}, (_, i) => i + 1), []);

  return (
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
            return (
              <View key={d} style={baseCellStyle}>
                <View style={s.dotGhost}>
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
  );
});

const Slide4Photo = memo(function Slide4Photo({
  scrollX,
  index,
  width,
  imageSource,
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const rotate = scrollX.interpolate({
    inputRange,
    outputRange: ['-1deg', '0deg', '1deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={{width: '100%', height: '100%', transform: [{rotateZ: rotate}]}}>
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
      scrollX={scrollX}
      index={index}
      width={width}
      imageSource={imageSource}
    />
  );
});
