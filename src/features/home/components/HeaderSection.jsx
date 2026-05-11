// src/features/home/components/HeaderSection.jsx
import React, {useMemo, useEffect, useRef, useCallback, useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  useWindowDimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import DropShadow from 'react-native-drop-shadow';
// eslint-disable-next-line import/no-named-as-default -- react-native-svg 기본 export
import Svg, {Defs, Mask, Rect, Circle} from 'react-native-svg';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

import {hapticLight} from 'utils/haptic';
import {safeNavigate} from 'app/navigation/navigationService';
import {headerTitleLogoMeasureRef} from 'app/navigation/helpers/tabHeaderHelpers';
import {
  getEmotionImage,
  getEmotionPickerImage,
  getEmotionColor,
  getEmotionLabel,
} from '../utils/emotionUtils';
import {getDefaultStyle, LAYOUT_STYLE} from 'styles/style';
import {useColors} from 'hooks/useColors';

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
const HEADER_CARD_RADIUS = getResponsiveIconSize(22);

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
  const colors = useColors();
  const defaultStyle = useMemo(() => getDefaultStyle(colors), [colors]);

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
      tintColor: colors.textTertiary,
    },

    inviteIcon: {
      width: '62%',
      height: '62%',
      resizeMode: 'contain',
      tintColor: colors.textSecondary,
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
      backgroundColor: colors.surfacePrimary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    smileBtnUnset: {
      backgroundColor: colors.surfaceMuted,
    },

    // 초대 버튼은 같은 톤으로(살짝만 키워도 됨)
    inviteBtn: {
      width: getResponsiveIconSize(30),
      height: getResponsiveIconSize(30),
      borderRadius: getResponsiveIconSize(10),
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },

    bubbleBox: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: 10,
      paddingHorizontal: getResponsiveWidth(10),
      paddingVertical: getResponsiveHeight(5),
      overflow: 'visible',
      ...(Platform.OS === 'android'
        ? {
            elevation: 0,
            shadowOpacity: 0,
          }
        : {
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: {width: 0, height: 1},
            elevation: 2,
          }),
    },
    bubbleText: {
      fontSize: getResponsiveHeight(13),
      fontFamily: FONTS.MEDIUM,
      color: colors.textDefault,
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
      borderTopColor: colors.surfacePrimary,
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
      backgroundColor: colors.surfacePrimary,
      overflow: 'hidden',
    },
    avatarPress: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shadowBox: {
      width: '100%',
      borderRadius: HEADER_CARD_RADIUS,
      backgroundColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    headerCard: {
      position: 'relative',
      width: '100%',
      alignItems: 'center',
      paddingTop: getResponsiveHeight(66),
      paddingBottom: getResponsiveHeight(22),
      paddingHorizontal: getResponsiveWidth(8),
      backgroundColor: colors.surfacePrimary,
      borderRadius: HEADER_CARD_RADIUS,
    },
    helpFab: {
      position: 'absolute',
      top: getResponsiveHeight(10),
      right: getResponsiveWidth(14),
      zIndex: 10,
    },
    helpBtn: {
      width: getResponsiveIconSize(26),
      height: getResponsiveIconSize(26),
      borderRadius: 999,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    helpMark: {
      fontSize: getResponsiveHeight(14),
      fontFamily: FONTS.SEMI_BOLD,
      color: colors.textSecondary,
    },
    helpBubbleContainer: {
      zIndex: 30,
    },
    helpBubbleBox: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: 12,
      paddingHorizontal: getResponsiveWidth(14),
      paddingVertical: getResponsiveHeight(12),
      maxWidth: getResponsiveWidth(280),
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: {width: 0, height: 2},
      elevation: 4,
    },
    helpBubbleText: {
      fontSize: getResponsiveHeight(14),
      fontFamily: FONTS.MEDIUM,
      color: colors.textPrimary,
      lineHeight: getResponsiveHeight(20),
      textAlign: 'center',
    },
    helpBubbleTailWrapper: {
      position: 'absolute',
      top: -7,
    },
    helpBubbleTail: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 7,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: colors.surfacePrimary,
    },

    userNameHeader: {
      fontFamily: FONTS.SEMI_BOLD,
      fontSize: defaultStyle.sectionTitle.fontSize,
      color: colors.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    userNamePlaceholder: {
      color: defaultStyle.sectionSubtitle.color,
    },
    trait: {
      fontFamily: defaultStyle.sectionSubtitle.fontFamily,
      fontSize: getResponsiveHeight(13),
      marginTop: getResponsiveHeight(4),
      color: defaultStyle.sectionSubtitle.color,
      textAlign: 'center',
      lineHeight: defaultStyle.sectionSubtitle.fontSize + 1,
    },
  }), [colors, defaultStyle]);
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
   * Header help (?): 3단계 스포트라이트 (기분 → 프로필 → 상단 로고·테마)
   * =========================
   */
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpStep, setHelpStep] = useState(1);
  const helpTimersRef = useRef([]);
  const helpBtnRef = useRef(null);
  const [helpAnchor, setHelpAnchor] = useState(null);
  const avatarTouchRef = useRef(null);
  const [avatarAnchor, setAvatarAnchor] = useState(null);
  const moodTouchRef = useRef(null);
  const [moodAnchor, setMoodAnchor] = useState(null);
  const [logoAnchor, setLogoAnchor] = useState(null);
  const [helpBubbleBoxW, setHelpBubbleBoxW] = useState(0);

  const assignFamilyGuideRef = useCallback(
    node => {
      avatarTouchRef.current = node;
      const r = guideRefs?.family_status;
      if (typeof r === 'function') {
        r(node);
      } else if (r) {
        r.current = node;
      }
    },
    [guideRefs],
  );

  const assignMoodGuideRef = useCallback(
    node => {
      moodTouchRef.current = node;
      const r = guideRefs?.my_mood;
      if (typeof r === 'function') {
        r(node);
      } else if (r) {
        r.current = node;
      }
    },
    [guideRefs],
  );

  const clearHelpTimers = useCallback(() => {
    helpTimersRef.current.forEach(tid => clearTimeout(tid));
    helpTimersRef.current = [];
  }, []);

  const measureHelpAnchor = useCallback(() => {
    const node = helpBtnRef.current;
    if (!node?.measureInWindow) return;
    node.measureInWindow((x, y, width, height) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      setHelpAnchor({x, y, width, height});
    });
  }, []);

  const measureAvatarAnchor = useCallback(() => {
    const node = avatarTouchRef.current;
    if (!node?.measureInWindow) return;
    node.measureInWindow((x, y, width, height) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      setAvatarAnchor({x, y, width, height});
    });
  }, []);

  const measureMoodAnchor = useCallback(() => {
    const node = moodTouchRef.current;
    if (!node?.measureInWindow) return;
    node.measureInWindow((x, y, width, height) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      setMoodAnchor({x, y, width, height});
    });
  }, []);

  const measureLogoAnchor = useCallback(() => {
    const node = headerTitleLogoMeasureRef?.current;
    if (!node?.measureInWindow) return;
    node.measureInWindow((x, y, width, height) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      setLogoAnchor({x, y, width, height});
    });
  }, []);

  const closeHelp = useCallback(() => {
    clearHelpTimers();
    setIsHelpOpen(false);
  }, [clearHelpTimers]);

  const advanceOrCloseHelp = useCallback(() => {
    if (helpStep === 1) {
      clearHelpTimers();
      setHelpStep(2);
      helpTimersRef.current.push(
        setTimeout(() => setIsHelpOpen(false), 2500),
      );
      requestAnimationFrame(() => {
        measureAvatarAnchor();
      });
      return;
    }
    if (helpStep === 2) {
      clearHelpTimers();
      setHelpStep(3);
      helpTimersRef.current.push(
        setTimeout(() => setIsHelpOpen(false), 2500),
      );
      requestAnimationFrame(() => {
        measureLogoAnchor();
      });
      return;
    }
    closeHelp();
  }, [
    helpStep,
    clearHelpTimers,
    closeHelp,
    measureAvatarAnchor,
    measureLogoAnchor,
  ]);

  const toggleHelp = useCallback(() => {
    setIsHelpOpen(prev => {
      const next = !prev;
      if (next) {
        clearHelpTimers();
        setHelpStep(1);
        requestAnimationFrame(() => {
          measureHelpAnchor();
          measureAvatarAnchor();
          measureMoodAnchor();
          measureLogoAnchor();
        });
        const t1 = setTimeout(() => {
          setHelpStep(2);
          requestAnimationFrame(() => measureAvatarAnchor());
        }, 2000);
        const t2 = setTimeout(() => {
          setHelpStep(3);
          requestAnimationFrame(() => measureLogoAnchor());
        }, 4000);
        const t3 = setTimeout(() => setIsHelpOpen(false), 6200);
        helpTimersRef.current = [t1, t2, t3];
      } else {
        clearHelpTimers();
      }
      return next;
    });
  }, [
    clearHelpTimers,
    measureHelpAnchor,
    measureAvatarAnchor,
    measureMoodAnchor,
    measureLogoAnchor,
  ]);

  useEffect(() => {
    if (!isHelpOpen) return;
    requestAnimationFrame(() => {
      if (helpStep === 1) measureMoodAnchor();
      if (helpStep === 2) measureAvatarAnchor();
      if (helpStep === 3) measureLogoAnchor();
    });
  }, [isHelpOpen, helpStep, measureMoodAnchor, measureAvatarAnchor, measureLogoAnchor]);

  useEffect(() => {
    if (!isHelpOpen) setHelpBubbleBoxW(0);
  }, [isHelpOpen]);

  /** `?` 도움말 말풍선 위치·꼬리: 버블이 화면에 클램프되어도 꼬리는 앵커 중심을 가리킴 */
  const helpBubblePosition = useMemo(() => {
    if (!helpAnchor) return null;
    const bubbleW = getResponsiveWidth(260);
    const margin = 12;
    const anchor =
      helpStep === 1
        ? moodAnchor || helpAnchor
        : helpStep === 2
          ? avatarAnchor || helpAnchor
          : logoAnchor || helpAnchor;
    const anchorCX = anchor.x + anchor.width / 2;
    const bubbleLeft = clamp(
      anchorCX - bubbleW / 2,
      margin,
      screenWidth - bubbleW - margin,
    );
    const bubbleTop =
      anchor.y + anchor.height + getResponsiveHeight(16);
    const measuredW =
      helpBubbleBoxW > 0 ? helpBubbleBoxW : bubbleW;
    const tailHalf = 6;
    const tailMax = Math.max(12, measuredW - 24);
    const tailLeft = clamp(
      anchorCX - bubbleLeft - tailHalf,
      12,
      tailMax,
    );
    return {bubbleLeft, bubbleTop, tailLeft};
  }, [
    helpAnchor,
    helpStep,
    moodAnchor,
    avatarAnchor,
    logoAnchor,
    helpBubbleBoxW,
    screenWidth,
  ]);

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
  }, [
    runTapTiltPeekOnce,
    pressScale,
    emotionLabel,
    clearDismissTimer,
    hideBubble,
    bubbleOpacity,
    bubbleTranslateY,
  ]);

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
        ref={assignFamilyGuideRef}
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
            backgroundColor: colors.surfacePrimary,
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
                    backgroundColor: colors.surfacePrimary,
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
          ref={assignMoodGuideRef}
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
          <TouchableOpacity
            ref={helpBtnRef}
            onPress={() => {
              hapticLight();
              toggleHelp();
            }}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel="홈 도움말"
            accessibilityHint="누르면 기분·프로필·테마 로고 안내가 순서대로 보여요"
            activeOpacity={0.85}
            style={styles.helpFab}>
            <View style={styles.helpBtn}>
              <AppText allowFontScaling={false} style={styles.helpMark}>
                ?
              </AppText>
            </View>
          </TouchableOpacity>

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

      <Modal
        visible={isHelpOpen}
        transparent
        animationType="fade"
        onRequestClose={closeHelp}>
        <TouchableWithoutFeedback onPress={advanceOrCloseHelp}>
          <View style={StyleSheet.absoluteFillObject} accessible={false}>
            <Svg width="100%" height="100%">
              <Defs>
                <Mask id="spotlightMask">
                  <Rect x="0" y="0" width="100%" height="100%" fill="#fff" />
                  {helpStep === 3 && !!logoAnchor && (
                    <Circle
                      cx={logoAnchor.x + logoAnchor.width / 2}
                      cy={logoAnchor.y + logoAnchor.height / 2}
                      r={Math.max(
                        0,
                        Math.max(logoAnchor.width, logoAnchor.height) / 2 +
                          getResponsiveIconSize(10),
                      )}
                      fill="#000"
                    />
                  )}
                  {helpStep === 2 && !!avatarAnchor && (
                    <Circle
                      cx={avatarAnchor.x + avatarAnchor.width / 2}
                      cy={avatarAnchor.y + avatarAnchor.height / 2}
                      r={Math.max(0, ringSize / 2 + getResponsiveIconSize(12))}
                      fill="#000"
                    />
                  )}
                  {helpStep === 1 && !!moodAnchor && (
                    <Circle
                      cx={moodAnchor.x + moodAnchor.width / 2}
                      cy={moodAnchor.y + moodAnchor.height / 2}
                      r={Math.max(
                        0,
                        moodAnchor.width / 2 + getResponsiveIconSize(10),
                      )}
                      fill="#000"
                    />
                  )}
                </Mask>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(17,24,39,0.45)"
                mask="url(#spotlightMask)"
              />
            </Svg>
          </View>
        </TouchableWithoutFeedback>

        {!!helpAnchor && helpBubblePosition && (
          <View
            pointerEvents="box-none"
            style={[
              styles.helpBubbleContainer,
              {
                position: 'absolute',
                left: helpBubblePosition.bubbleLeft,
                top: helpBubblePosition.bubbleTop,
              },
            ]}>
            <TouchableWithoutFeedback onPress={advanceOrCloseHelp}>
              <View
                style={styles.helpBubbleBox}
                onLayout={e => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0 && Math.abs(w - helpBubbleBoxW) > 0.5) {
                    setHelpBubbleBoxW(w);
                  }
                }}>
                <AppText allowFontScaling={false} style={styles.helpBubbleText}>
                  {helpStep === 1
                    ? '여기 눌러 오늘 기분 선택'
                    : helpStep === 2
                      ? '짧게 눌러 기분 확인, 길게 눌러 프로필 수정'
                      : '상단 로고를 누르면 다크 모드와 화이트 모드를 바꿀 수 있어요.'}
                </AppText>
                <View
                  style={[
                    styles.helpBubbleTailWrapper,
                    {left: helpBubblePosition.tailLeft},
                  ]}>
                  <View style={styles.helpBubbleTail} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
      </Modal>
    </View>
  );
}
