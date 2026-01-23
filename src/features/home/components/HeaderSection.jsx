// src/features/home/components/HeaderSection.jsx
import React, {useMemo, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';

import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useNavigation} from '@react-navigation/native';
import DropShadow from 'react-native-drop-shadow';
import {hapticLight} from '../../../utils/haptic';
import {getEmotionImage} from '../utils/emotionUtils';
import {COLORS, DEFAULT_STYLE, LAYOUT_STYLE} from 'styles/style';

// ✅ reanimated
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';
const EMOTION_EXPIRE_MS = 24 * 60 * 60 * 1000;

function isEmotionValid(emotion, emotionUpdatedAt) {
  if (!emotion || !emotionUpdatedAt) return false;
  const t = new Date(emotionUpdatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= EMOTION_EXPIRE_MS;
}

// ✅ clamp 유틸
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// ✅ base
const AVATAR = getResponsiveIconSize(92);
const CARD_RADIUS = getResponsiveIconSize(16);

// ===== base sizes =====
const BASE_DISPLAY = AVATAR * 1.3;
const BASE_RING = BASE_DISPLAY * 1.2;
const BASE_AREA = BASE_DISPLAY * 1.05;
const BASE_OVERLAP = -BASE_DISPLAY * 0.499;

// ✅ 안전 가드(상/하한)
// - ring이 너무 크면 전체가 폭주하니까 ring 기준으로 clamp
const RING_MIN = getResponsiveIconSize(124);
const RING_MAX = getResponsiveIconSize(148);

// - area는 ring 대비 살짝 작게(기존 비율 유지) + 안전 범위
const AREA_MIN = getResponsiveIconSize(126);
const AREA_MAX = getResponsiveIconSize(160);

// - overlap이 과하면 카드와 겹침이 터짐 (절대값 너무 커지는 거 방지)
const OVERLAP_MIN = -getResponsiveIconSize(86);
const OVERLAP_MAX = -getResponsiveIconSize(56);

export default function HeaderSection({user, onUserPress}) {
  const navigation = useNavigation();
  const {width: screenWidth} = useWindowDimensions();

  const containerWidth = screenWidth - LAYOUT_STYLE().screenPaddingHorizontal * 2;

  /** =========================
   * ✅ 감정 판단
   * ========================= */
  const emotionKey = useMemo(() => {
    if (!isEmotionValid(user?.emotion, user?.emotionUpdatedAt)) return null;
    return String(user.emotion).toUpperCase();
  }, [user?.emotion, user?.emotionUpdatedAt]);

  const emotionImage = emotionKey ? getEmotionImage(emotionKey) : null;
  const hasEmotion = !!emotionImage;

  const profileSource = useMemo(() => {
    return user?.image
      ? {
          uri: user.image.startsWith('https')
            ? user.image
            : CLOUD_FRONT + user.image,
        }
      : require('../../../assets/images/default.png');
  }, [user?.image]);

  /** =========================
   * ✅ 사이즈 (여기서 폭주 방지)
   * ========================= */
  const ringSize = clamp(BASE_RING, RING_MIN, RING_MAX);
  const areaSize = clamp(BASE_AREA, AREA_MIN, AREA_MAX);
  const overlap = clamp(BASE_OVERLAP, OVERLAP_MIN, OVERLAP_MAX);

  /**
   * =========================================================
   * ✅ "고개 갸웃" Peek
   * =========================================================
   */
  const popY = useSharedValue(0); // 0~1
  const tilt = useSharedValue(0); // -1~1
  const pivotX = useSharedValue(0); // -1~1
  const scale = useSharedValue(1);

  const peekDistance = ringSize * 0.7;
  const tiltDeg = 12;
  const pivotShift = ringSize * 0.18;

  const emotionPeekStyle = useAnimatedStyle(() => {
    const px = pivotX.value * pivotShift;
    const deg = `${tilt.value * tiltDeg}deg`;

    return {
      transform: [
        {translateY: -popY.value * peekDistance},
        {translateX: px},
        {rotate: deg},
        {translateX: -px},
        {scale: scale.value},
      ],
    };
  }, [peekDistance, tiltDeg, pivotShift]);

  /**
   * =========================================================
   * ✅ 프로필 "눌림" 손맛
   * =========================================================
   */
  const pressScale = useSharedValue(1);
  const ringPulse = useSharedValue(0);
  const glow = useSharedValue(0);

  const avatarPressStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: pressScale.value}],
    };
  }, []);

  const ringPulseStyle = useAnimatedStyle(() => {
    const s = 1 + ringPulse.value * 0.045;
    return {
      transform: [{scale: s}],
    };
  }, []);

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glow.value,
    };
  }, []);

  const longPressedRef = useRef(false);

  // =========================================================
  // ✅ 랜덤 peek (감정 있을 때만)
  // =========================================================
  useEffect(() => {
    if (!hasEmotion) return;

    let mounted = true;
    let t1 = null;

    const runTiltPeek = () => {
      cancelAnimation(popY);
      cancelAnimation(tilt);
      cancelAnimation(pivotX);
      cancelAnimation(scale);

      const dir = Math.random() > 0.5 ? 1 : -1;

      popY.value = withTiming(1, {
        duration: 130,
        easing: Easing.out(Easing.cubic),
      });

      pivotX.value = withTiming(dir, {duration: 120});

      tilt.value = withSequence(
        withTiming(dir, {duration: 120, easing: Easing.out(Easing.cubic)}),
        withTiming(-dir * 0.25, {duration: 140, easing: Easing.out(Easing.cubic)}),
        withTiming(0, {duration: 120, easing: Easing.out(Easing.cubic)}),
      );

      scale.value = withSequence(
        withTiming(1.07, {duration: 110}),
        withTiming(1.0, {duration: 160}),
      );

      popY.value = withDelay(
        520,
        withSpring(0, {damping: 11, stiffness: 220, mass: 0.65}),
      );

      pivotX.value = withDelay(520, withTiming(0, {duration: 180}));
    };

    const loop = () => {
      if (!mounted) return;

      const delay = 3200 + Math.random() * 4200;
      t1 = setTimeout(() => {
        if (!mounted || longPressedRef.current) {
          loop();
          return;
        }

        if (Math.random() > 0.25) {
          loop();
          return;
        }

        runTiltPeek();
        loop();
      }, delay);
    };

    loop();

    return () => {
      mounted = false;
      if (t1) clearTimeout(t1);
      cancelAnimation(popY);
      cancelAnimation(tilt);
      cancelAnimation(pivotX);
      cancelAnimation(scale);
    };
  }, [hasEmotion, popY, tilt, pivotX, scale]);

  // =========================================================
  // ✅ 탭/롱프레스 제어
  // =========================================================
  const tapTimerRef = useRef(null);

  const clearTapTimer = useCallback(() => {
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTapTimer();
  }, [clearTapTimer]);

  const runTapTiltPeekOnce = useCallback(() => {
    if (!hasEmotion) return;

    clearTapTimer();

    cancelAnimation(popY);
    cancelAnimation(tilt);
    cancelAnimation(pivotX);
    cancelAnimation(scale);

    const dir = Math.random() > 0.5 ? 1 : -1;

    popY.value = withTiming(1, {duration: 120, easing: Easing.out(Easing.cubic)});
    pivotX.value = withTiming(dir, {duration: 110});

    tilt.value = withSequence(
      withTiming(dir, {duration: 120, easing: Easing.out(Easing.cubic)}),
      withTiming(-dir * 0.22, {duration: 140, easing: Easing.out(Easing.cubic)}),
      withTiming(0, {duration: 120, easing: Easing.out(Easing.cubic)}),
    );

    scale.value = withSequence(
      withTiming(1.08, {duration: 110}),
      withTiming(1.0, {duration: 170}),
    );

    tapTimerRef.current = setTimeout(() => {
      cancelAnimation(popY);
      popY.value = withSpring(0, {damping: 11, stiffness: 215, mass: 0.7});

      cancelAnimation(pivotX);
      pivotX.value = withTiming(0, {duration: 180});
    }, 520);
  }, [hasEmotion, clearTapTimer, popY, tilt, pivotX, scale]);

  const goEmotionSetting = useCallback(() => {
    hapticLight();
    navigation.navigate('감정상태화면');
  }, [navigation]);

  const handleAvatarPressIn = useCallback(() => {
    if (longPressedRef.current) return;

    cancelAnimation(pressScale);
    cancelAnimation(ringPulse);
    cancelAnimation(glow);

    pressScale.value = withTiming(0.965, {duration: 90, easing: Easing.out(Easing.cubic)});

    ringPulse.value = 0;
    ringPulse.value = withSequence(
      withTiming(1, {duration: 120, easing: Easing.out(Easing.cubic)}),
      withTiming(0, {duration: 160, easing: Easing.out(Easing.cubic)}),
    );

    glow.value = 0;
    glow.value = withSequence(
      withTiming(1, {duration: 90, easing: Easing.out(Easing.cubic)}),
      withTiming(0, {duration: 220, easing: Easing.out(Easing.cubic)}),
    );
  }, [pressScale, ringPulse, glow]);

  const handleAvatarPressOutAnim = useCallback(() => {
    cancelAnimation(pressScale);
    pressScale.value = withTiming(1, {duration: 140, easing: Easing.out(Easing.cubic)});
  }, [pressScale]);

  const handleAvatarPress = useCallback(() => {
    if (longPressedRef.current) return;
    runTapTiltPeekOnce();
  }, [runTapTiltPeekOnce]);

  const handleAvatarLongPress = useCallback(() => {
    longPressedRef.current = true;
    goEmotionSetting();
  }, [goEmotionSetting]);

  const handleAvatarPressOut = useCallback(() => {
    longPressedRef.current = false;
  }, []);

  const handleCardPress = () => {
    hapticLight();
    onUserPress?.(user);
  };

  return (
    <View style={[styles.headerContainer, {width: containerWidth}]}>
      {/* 프로필 영역 */}
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handleAvatarPressIn}
        onPress={handleAvatarPress}
        onLongPress={handleAvatarLongPress}
        delayLongPress={320}
        onPressOut={() => {
          handleAvatarPressOutAnim();
          handleAvatarPressOut();
        }}
        style={[
          styles.avatarArea,
          {
            width: areaSize + 35,
            height: areaSize + 35,
            marginBottom: overlap,
            borderRadius: 999,
            backgroundColor: 'white',
          },
        ]}>
        {/* ✅ 아바타 전체 눌림 스케일 */}
        <Animated.View style={avatarPressStyle}>
          {/* ✅ 감정 peek 마스크 */}
          {hasEmotion && (
            <View
              style={[
                styles.emotionPeekMask,
                {
                  width: ringSize,
                  height: ringSize,
                  borderRadius: ringSize / 2,
                },
              ]}>
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -ringSize,
                  },
                  emotionPeekStyle,
                ]}>
                <Image
                  source={emotionImage}
                  style={[styles.emotionImage, {width: ringSize, height: ringSize}]}
                />
              </Animated.View>
            </View>
          )}

          {/* ✅ 링 펄스 */}
          <Animated.View style={ringPulseStyle}>
            <View
              style={[
                styles.avatarPress,
                {
                  width: ringSize,
                  height: ringSize,
                  borderRadius: ringSize / 2,
                },
              ]}>
              <View
                style={[
                  styles.avatarRing,
                  {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    borderColor: 'white',
                    borderWidth: 4,
                  },
                ]}>
                <Image
                  source={profileSource}
                  resizeMode="cover"
                  style={[
                    styles.profileImage,
                    {
                      width: ringSize,
                      height: ringSize,
                      borderRadius: ringSize / 2,
                    },
                  ]}
                />

                {/* ✅ 노란 글로우 살짝 번쩍 */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      borderRadius: ringSize / 2,
                      backgroundColor: 'rgba(255, 200, 77, 0.18)',
                    },
                    glowStyle,
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      {/* 카드 */}
      <DropShadow style={styles.shadowBox}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handleCardPress}
          style={styles.headerCard}>
          <Text allowFontScaling={false} style={styles.userNameHeader} numberOfLines={1}>
            {user?.name || '이름'}
          </Text>
          <Text allowFontScaling={false} style={styles.trait} numberOfLines={2}>
            {user?.trait || '이 사람을 한마디로 표현한다면?'}
          </Text>
        </TouchableOpacity>
      </DropShadow>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: getResponsiveHeight(34),
    marginBottom: getResponsiveHeight(16),
  },

  avatarArea: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },

  avatarRing: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarPress: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileImage: {
    zIndex: 1,
  },

  emotionPeekMask: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: -3,
  },

  emotionImage: {
    resizeMode: 'contain',
  },

  shadowBox: {
    width: '100%',
    borderRadius: CARD_RADIUS,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  headerCard: {
    width: '100%',
    alignItems: 'center',
    paddingTop: getResponsiveHeight(66),
    paddingBottom: getResponsiveHeight(22),
    paddingHorizontal: getResponsiveWidth(8),
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
  },

  userNameHeader: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: DEFAULT_STYLE().sectionTitle.fontSize,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },

  trait: {
    fontFamily: DEFAULT_STYLE().sectionSubtitle.fontFamily,
    fontSize: getResponsiveHeight(13),
    marginTop: getResponsiveHeight(4),
    color: DEFAULT_STYLE().sectionSubtitle.color,
    textAlign: 'center',
    lineHeight: DEFAULT_STYLE().sectionSubtitle.fontSize + 1,
  },
});
