// src/features/home/components/HeaderSection.jsx
import React, {useMemo, useEffect, useRef, useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';
import DropShadow from 'react-native-drop-shadow';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

import {hapticLight} from 'utils/haptic';
import {safeNavigate} from 'app/navigation/navigationService';
import {
  getEmotionImage,
  getEmotionPickerImage,
  getEmotionColor,
  getEmotionLabel,
} from '../utils/emotionUtils';
import {COLORS, DEFAULT_STYLE, LAYOUT_STYLE} from 'styles/style';

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
import {FONTS} from 'styles/typography';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const AVATAR = getResponsiveIconSize(92);
const _CARD_RADIUS = getResponsiveIconSize(16);

// ===== base sizes =====
const BASE_DISPLAY = AVATAR * 1.3;
const BASE_RING = BASE_DISPLAY * 1.2;
const BASE_AREA = BASE_DISPLAY * 1.05;
const BASE_OVERLAP = -BASE_DISPLAY * 0.499;

// ===== safety guards =====
const RING_MIN = getResponsiveIconSize(124);
const RING_MAX = getResponsiveIconSize(148);

const AREA_MIN = getResponsiveIconSize(126);
const AREA_MAX = getResponsiveIconSize(160);

const OVERLAP_MIN = -getResponsiveIconSize(86);
const OVERLAP_MAX = -getResponsiveIconSize(56);

export default function HeaderSection({
  user,
  onUserPress,
  onInvitePress: _onInvitePress,
  guideRefs,
}) {
  const styles = useScaledStyleSheet(_rf => ({
    smileIcon: {
      width: '68%',
      height: '68%',
      resizeMode: 'contain',
    },
    moodBadgePlusIcon: {
      width: '42%',
      height: '42%',
      resizeMode: 'contain',
      tintColor: '#9CA3AF',
    },

    inviteIcon: {
      width: '62%',
      height: '62%',
      resizeMode: 'contain',
      tintColor: '#6B7280', // MemberGridSection 톤 참고
    },

    smileFab: {
      position: 'absolute',
      right: getResponsiveWidth(4),
      bottom: getResponsiveHeight(8),
      zIndex: 6,
    },
    smileBtn: {
      width: getResponsiveIconSize(38),
      height: getResponsiveIconSize(38),
      borderRadius: getResponsiveIconSize(19),
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    smileBtnUnset: {
      backgroundColor: '#FAFAFA',
    },

    // 초대 버튼은 같은 톤으로(살짝만 키워도 됨)
    inviteBtn: {
      width: getResponsiveIconSize(30),
      height: getResponsiveIconSize(30),
      borderRadius: getResponsiveIconSize(10),
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#ECEFF3',
    },

    bubbleBox: {
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingHorizontal: getResponsiveWidth(10),
      paddingVertical: getResponsiveHeight(5),
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: {width: 0, height: 2},
      elevation: 5,
      overflow: 'visible',
    },
    bubbleText: {
      fontSize: getResponsiveHeight(13),
      fontFamily: FONTS.MEDIUM,
      color: '#1F2937',
      letterSpacing: -0.1,
    },
    bubbleTailWrapper: {
      position: 'absolute',
      bottom: -7,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    bubbleTail: {
      width: 0,
      height: 0,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderTopWidth: 7,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#FFFFFF',
    },

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
      overflow: 'hidden',
    },
    avatarPress: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shadowBox: {
      width: '100%',
      borderRadius: getResponsiveIconSize(16),
      backgroundColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.12,
      shadowRadius: 2,
      elevation: 3,
    },
    headerCard: {
      width: '100%',
      alignItems: 'center',
      paddingTop: getResponsiveHeight(66),
      paddingBottom: getResponsiveHeight(22),
      paddingHorizontal: getResponsiveWidth(8),
      backgroundColor: '#FFFFFF',
      borderRadius: getResponsiveIconSize(16),
    },

    userNameHeader: {
      fontFamily: FONTS.SEMI_BOLD,
      fontSize: DEFAULT_STYLE().sectionTitle.fontSize,
      color: COLORS.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    userNamePlaceholder: {
      color: DEFAULT_STYLE().sectionSubtitle.color,
    },
    trait: {
      fontFamily: DEFAULT_STYLE().sectionSubtitle.fontFamily,
      fontSize: getResponsiveHeight(13),
      marginTop: getResponsiveHeight(4),
      color: DEFAULT_STYLE().sectionSubtitle.color,
      textAlign: 'center',
      lineHeight: DEFAULT_STYLE().sectionSubtitle.fontSize + 1,
    },
  }));
  const {width: screenWidth} = useWindowDimensions();

  const containerWidth =
    screenWidth - LAYOUT_STYLE().screenPaddingHorizontal * 2;

  /**
   * =========================
   * Emotion
   * =========================
   */
  const emotionKey = useMemo(() => {
    if (!user?.emotion) return null;
    return String(user.emotion).toUpperCase();
  }, [user?.emotion]);

  const emotionImage = useMemo(() => {
    return emotionKey ? getEmotionImage(emotionKey) : null;
  }, [emotionKey]);

  const emotionLabel = useMemo(() => {
    return emotionKey ? getEmotionLabel(emotionKey) : null;
  }, [emotionKey]);

  const moodBadgeSource = useMemo(() => {
    return emotionKey ? getEmotionPickerImage(emotionKey) : null;
  }, [emotionKey]);

  const hasEmotion = !!emotionKey;

  const emotionColor = useMemo(() => {
    return emotionKey ? getEmotionColor(emotionKey) : null;
  }, [emotionKey]);

  const ringBorderColor = useMemo(() => {
    if (emotionColor) return emotionColor;
    return '#EEF2F7';
  }, [emotionColor]);

  const profileSource = useMemo(() => {
    const img = user?.image;
    if (!img) return require('../../../assets/images/default.png');
    const s = String(img);
    const isFullUri =
      s.startsWith('https') || s.startsWith('http') || s.startsWith('file');
    return {uri: isFullUri ? img : CLOUD_FRONT + img};
  }, [user?.image]);

  const headerDisplayName = useMemo(() => {
    const n = user?.name;
    const nick = user?.nickname;
    const fromName = typeof n === 'string' ? n.trim() : '';
    if (fromName) return fromName;
    const fromNick = typeof nick === 'string' ? nick.trim() : '';
    return fromNick;
  }, [user?.name, user?.nickname]);

  /**
   * =========================
   * Sizes (clamped)
   * =========================
   */
  const ringSize = clamp(BASE_RING, RING_MIN, RING_MAX);
  const areaSize = clamp(BASE_AREA, AREA_MIN, AREA_MAX);
  const overlap = clamp(BASE_OVERLAP, OVERLAP_MIN, OVERLAP_MAX);

  const PROFILE_SCALE = 0.95;
  const profileSize = Math.round(ringSize * PROFILE_SCALE);
  const profileRadius = profileSize / 2;

  /**
   * =========================================================
   * Emotion Peek (튀어나오는 연출)
   * =========================================================
   */
  const popY = useSharedValue(0); // 0~1
  const tilt = useSharedValue(0);
  const pivotX = useSharedValue(0);
  const peekScale = useSharedValue(1);

  const bubbleOpacity = useSharedValue(0);
  const bubbleTranslateY = useSharedValue(6);

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{translateY: bubbleTranslateY.value}],
  }), [bubbleOpacity, bubbleTranslateY]);

  const HIDDEN_Y = profileSize * 1.3;
  const RISE_Y = profileSize * 1.05;

  const tiltDeg = 12;
  const pivotShift = profileSize * 0.18;

  const emotionPeekStyle = useAnimatedStyle(() => {
    const px = pivotX.value * pivotShift;
    const deg = `${tilt.value * tiltDeg}deg`;
    const ty = HIDDEN_Y - popY.value * RISE_Y;

    return {
      transform: [
        {translateY: ty},
        {translateX: px},
        {rotate: deg},
        {translateX: -px},
        {scale: peekScale.value},
      ],
    };
  }, [HIDDEN_Y, RISE_Y, pivotShift, tiltDeg]);

  /**
   * =========================================================
   * Press feedback
   * =========================================================
   */
  const pressScale = useSharedValue(1);
  const ringPulse = useSharedValue(0);
  const glow = useSharedValue(0);

  const avatarPressStyle = useAnimatedStyle(() => {
    return {transform: [{scale: pressScale.value}]};
  }, []);

  const ringPulseStyle = useAnimatedStyle(() => {
    const s = 1 + ringPulse.value * 0.045;
    return {transform: [{scale: s}]};
  }, []);

  const glowStyle = useAnimatedStyle(() => {
    return {opacity: glow.value};
  }, []);

  const longPressedRef = useRef(false);

  /**
   * =========================================================
   * Random peek loop (only when emotion exists)
   * =========================================================
   */
  useEffect(() => {
    if (!hasEmotion) return;

    let mounted = true;
    let t1 = null;

    const runTiltPeek = () => {
      cancelAnimation(popY);
      cancelAnimation(tilt);
      cancelAnimation(pivotX);
      cancelAnimation(peekScale);

      const dir = Math.random() > 0.5 ? 1 : -1;

      popY.value = withTiming(1, {
        duration: 130,
        easing: Easing.out(Easing.cubic),
      });
      pivotX.value = withTiming(dir, {duration: 120});

      tilt.value = withSequence(
        withTiming(dir, {duration: 120, easing: Easing.out(Easing.cubic)}),
        withTiming(-dir * 0.25, {
          duration: 140,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(0, {duration: 120, easing: Easing.out(Easing.cubic)}),
      );

      peekScale.value = withSequence(
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
      cancelAnimation(peekScale);
    };
  }, [hasEmotion, popY, tilt, pivotX, peekScale]);

  /**
   * =========================================================
   * Tap peek once (프로필 탭 시 살짝 장난만)
   * =========================================================
   */
  const tapTimerRef = useRef(null);
  const dismissTimerRef = useRef(null);

  const clearTapTimer = useCallback(() => {
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
  }, []);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const hideBubble = useCallback(() => {
    bubbleOpacity.value = withTiming(0, {duration: 160});
    bubbleTranslateY.value = withTiming(6, {duration: 160});
  }, [bubbleOpacity, bubbleTranslateY]);

  useEffect(() => {
    return () => {
      clearTapTimer();
      clearDismissTimer();
    };
  }, [clearTapTimer, clearDismissTimer]);

  const runTapTiltPeekOnce = useCallback(() => {
    if (!hasEmotion) return;

    clearTapTimer();

    cancelAnimation(popY);
    cancelAnimation(tilt);
    cancelAnimation(pivotX);
    cancelAnimation(peekScale);

    const dir = Math.random() > 0.5 ? 1 : -1;

    popY.value = withTiming(1, {
      duration: 120,
      easing: Easing.out(Easing.cubic),
    });
    pivotX.value = withTiming(dir, {duration: 110});

    tilt.value = withSequence(
      withTiming(dir, {duration: 120, easing: Easing.out(Easing.cubic)}),
      withTiming(-dir * 0.22, {
        duration: 140,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(0, {duration: 120, easing: Easing.out(Easing.cubic)}),
    );

    peekScale.value = withSequence(
      withTiming(1.08, {duration: 110}),
      withTiming(1.0, {duration: 170}),
    );

    tapTimerRef.current = setTimeout(() => {
      cancelAnimation(popY);
      popY.value = withSpring(0, {damping: 11, stiffness: 215, mass: 0.7});

      cancelAnimation(pivotX);
      pivotX.value = withTiming(0, {duration: 180});
    }, 520);
  }, [hasEmotion, clearTapTimer, popY, tilt, pivotX, peekScale]);

  /**
   * =========================================================
   * Navigation
   * =========================================================
   */
  const goEmotionSetting = useCallback(() => {
    hapticLight();
    // HomeStack의 감정상태화면은 탭·루트 아래에 중첩됨. 직접 navigate('감정상태화면')은
    // 컨텍스트에 따라 미처리 액션이 되어 튕김(빨간 화면)이 날 수 있음.
    safeNavigate('Tabs', {
      screen: '홈',
      params: {screen: '감정상태화면'},
    });
  }, []);

  /**
   * =========================================================
   * BottomSheet open (프로필 탭)
   * =========================================================
   */
  const openUserBottomSheet = useCallback(() => {
    hapticLight();
    onUserPress?.(user);
  }, [onUserPress, user]);

  /**
   * =========================================================
   * Press Handlers
   * =========================================================
   */
  const handleAvatarPressIn = useCallback(() => {
    if (longPressedRef.current) return;

    cancelAnimation(pressScale);
    cancelAnimation(ringPulse);
    cancelAnimation(glow);

    pressScale.value = withTiming(0.965, {
      duration: 90,
      easing: Easing.out(Easing.cubic),
    });

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
    pressScale.value = withSpring(1, {damping: 12, stiffness: 260, mass: 0.6});
  }, [pressScale]);

  const handleAvatarPress = useCallback(() => {
    if (longPressedRef.current) return;

    cancelAnimation(pressScale);
    pressScale.value = withSequence(
      withTiming(1.02, {duration: 80, easing: Easing.out(Easing.cubic)}),
      withTiming(1.0, {duration: 120, easing: Easing.out(Easing.cubic)}),
    );

    runTapTiltPeekOnce();

    if (emotionLabel) {
      clearDismissTimer();
      bubbleOpacity.value = withTiming(1, {duration: 180});
      bubbleTranslateY.value = withTiming(0, {duration: 180, easing: Easing.out(Easing.cubic)});
      dismissTimerRef.current = setTimeout(() => {
        hideBubble();
        dismissTimerRef.current = null;
      }, 1800);
    }
  }, [runTapTiltPeekOnce, pressScale, emotionLabel, clearDismissTimer, hideBubble, bubbleOpacity, bubbleTranslateY]);

  const handleAvatarLongPress = useCallback(() => {
    longPressedRef.current = true;
    hapticLight();

    cancelAnimation(pressScale);
    pressScale.value = withTiming(0.96, {
      duration: 90,
      easing: Easing.out(Easing.cubic),
    });

    clearDismissTimer();
    hideBubble();

    openUserBottomSheet();
  }, [pressScale, clearDismissTimer, hideBubble, openUserBottomSheet]);

  const handleAvatarPressOut = useCallback(() => {
    longPressedRef.current = false;
  }, []);

  const emotionRenderSize = Math.round(profileSize * 1.1);

  return (
    <View style={[styles.headerContainer, {width: containerWidth}]}>
      <TouchableOpacity
        ref={guideRefs?.family_status}
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
            backgroundColor: '#FFFFFF',
          },
        ]}>
        <Animated.View style={avatarPressStyle}>
          <Animated.View style={ringPulseStyle}>
            <View
              style={[
                styles.avatarPress,
                {width: ringSize, height: ringSize, borderRadius: ringSize / 2},
              ]}>
              <View
                style={[
                  styles.avatarRing,
                  {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    borderWidth: 6,
                    borderColor: ringBorderColor,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <View
                  style={{
                    width: profileSize,
                    height: profileSize,
                    borderRadius: profileRadius,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Image
                    source={profileSource}
                    resizeMode="cover"
                    style={{
                      width: profileSize,
                      height: profileSize,
                      borderRadius: profileRadius,
                      position: 'absolute',
                      zIndex: 1,
                    }}
                  />

                  {!!emotionImage && (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        {
                          position: 'absolute',
                          width: emotionRenderSize,
                          height: emotionRenderSize,
                          left: (profileSize - emotionRenderSize) / 2,
                          top: (profileSize - emotionRenderSize) / 2,
                          zIndex: 2,
                        },
                        emotionPeekStyle,
                      ]}>
                      <Image
                        source={emotionImage}
                        style={{
                          width: emotionRenderSize,
                          height: emotionRenderSize,
                          resizeMode: 'contain',
                        }}
                      />
                    </Animated.View>
                  )}

                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        borderRadius: profileRadius,
                        backgroundColor: emotionColor
                          ? `${emotionColor}18`
                          : 'rgba(255, 200, 77, 0.14)',
                        zIndex: 3,
                      },
                      glowStyle,
                    ]}
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        <TouchableOpacity
          ref={guideRefs?.my_mood}
          onPress={goEmotionSetting}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={hasEmotion ? '오늘 기분' : '기분 선택'}
          accessibilityHint={
            hasEmotion
              ? '탭하면 오늘의 기분을 바꿀 수 있어요'
              : '탭하면 오늘의 기분을 선택할 수 있어요'
          }
          style={[
            styles.smileFab,
            styles.smileBtn,
            !hasEmotion && styles.smileBtnUnset,
          ]}>
          {hasEmotion && moodBadgeSource ? (
            <Image source={moodBadgeSource} style={styles.smileIcon} />
          ) : (
            <Image
              source={require('../../../assets/icons/tabs/1/plus-sign.png')}
              style={styles.moodBadgePlusIcon}
              accessibilityIgnoresInvertColors={true}
            />
          )}
        </TouchableOpacity>

        {!!emotionLabel && (
          <Animated.View
            pointerEvents="none"
            style={[
              bubbleAnimStyle,
              {
                position: 'absolute',
                top: -40,
                left: 0,
                right: 0,
                alignItems: 'center',
                zIndex: 20,
              },
            ]}>
            <View style={styles.bubbleBox}>
              <AppText allowFontScaling={false} style={styles.bubbleText}>
                {emotionLabel}
              </AppText>
              <View style={styles.bubbleTailWrapper}>
                <View style={styles.bubbleTail} />
              </View>
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>

      <DropShadow style={styles.shadowBox}>
        <View style={styles.headerCard}>
          <AppText
            allowFontScaling={false}
            style={[
              styles.userNameHeader,
              !headerDisplayName ? styles.userNamePlaceholder : null,
            ]}
            numberOfLines={1}>
            {headerDisplayName || '이름을 정해 주세요'}
          </AppText>
          <AppText
            allowFontScaling={false}
            style={styles.trait}
            numberOfLines={2}>
            {user?.trait || '우리 가족만 아는 나의 포인트는?'}
          </AppText>
        </View>
      </DropShadow>
    </View>
  );
}
