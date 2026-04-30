// src/features/home/components/MemberGridSection.jsx (or .tsx)

import React, {
  useMemo,
  useCallback,
  memo,
  useEffect,
  useRef,
} from 'react';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import DropShadow from 'react-native-drop-shadow';

import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';
import {STORE_MOCK_ENABLED} from '../utils/storeMockData';
import {formatRelativeKorean} from '../utils/dateUtils';
import {getEmotionImage, getEmotionColor, getEmotionLabel} from '../utils/emotionUtils';
import {COLORS, EMPTY_STYLE, LAYOUT_STYLE} from 'styles/style';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {hapticLight} from 'utils/haptic';

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

const AVATAR = getResponsiveIconSize(60);

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const SHELL_MIN = getResponsiveIconSize(54);
const SHELL_MAX = getResponsiveIconSize(78);

const PROFILE_MIN = getResponsiveIconSize(46);
const PROFILE_MAX = getResponsiveIconSize(70);

const DOT_MIN = 8;
const DOT_MAX = 14;

// 6명 초과면 "그리드 영역만" 내부 스크롤
const INTERNAL_SCROLL_THRESHOLD = 6;

const MemberGridItem = memo(function MemberGridItem({
  member,
  index,
  itemWidth,
  onlineSet,
  lastActiveMap,
  onUserPress,
  isRefreshing,
  styles,
}) {
  const safeMember = member ?? {};
  const rawId = safeMember.userId ?? safeMember.id ?? safeMember._id ?? index;
  const memberId = String(rawId);

  const isOnline = onlineSet.has(memberId);
  const lastRaw = lastActiveMap?.[memberId];

  const statusText = isOnline
    ? '접속중'
    : lastRaw
    ? `${formatRelativeKorean(lastRaw)} 접속`
    : null;

  const finalEmotion = safeMember.emotion ?? null;

  const emotionImage = finalEmotion ? getEmotionImage(finalEmotion) : null;
  const hasEmotion = !!emotionImage;
  const emotionLabel = finalEmotion ? getEmotionLabel(finalEmotion) : null;
  const forceMomEmotionPeek =
    STORE_MOCK_ENABLED && memberId === 'mock-mom' && hasEmotion;

  const shellMax = AVATAR * 1.36;

  const shellSizeRaw = Math.min(shellMax, itemWidth);
  const shellSize = clamp(
    shellSizeRaw,
    SHELL_MIN,
    Math.min(SHELL_MAX, itemWidth),
  );

  const ringSize = shellSize * 1;

  const profileSizeRaw = shellSize * 0.88;
  const profileSize = clamp(profileSizeRaw, PROFILE_MIN, PROFILE_MAX);

  const emotionSize = clamp(shellSize * 0.98, PROFILE_MIN, PROFILE_MAX + 12);

  const dot = clamp(Math.round(shellSize * 0.22), DOT_MIN, DOT_MAX);
  const dotTop = Math.max(2, Math.round(shellSize * 0.07));
  const dotRight = Math.max(2, Math.round(shellSize * 0.07));

  const profileSource = safeMember.image
    ? {uri: safeMember.image}
    : require('../../../assets/images/kino-blue.png');

  const rawMemberName = String(
    safeMember.name ?? safeMember.nickname ?? '',
  ).trim();
  const memberNameLabel = rawMemberName || '미설정';

  const emotionColor = finalEmotion ? getEmotionColor(finalEmotion) : null;

  const ringBorderColor = useMemo(() => {
    if (emotionColor) return emotionColor;
    if (isOnline) return 'rgba(34,197,94,0.20)';
    return null;
  }, [emotionColor, isOnline]);

  const pressScale = useSharedValue(1);

  const avatarPressStyle = useAnimatedStyle(() => {
    return {transform: [{scale: pressScale.value}]};
  }, [pressScale]);

  const popY = useSharedValue(0);
  const tilt = useSharedValue(0);
  const pivotX = useSharedValue(0);
  const scale = useSharedValue(1);

  const peekDistance = profileSize * 1.14;
  const tiltDeg = 12;
  const pivotShift = profileSize * 0.18;

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
  }, [peekDistance, tiltDeg, pivotShift, popY, pivotX, tilt, scale]);

  const bubbleOpacity = useSharedValue(0);
  const bubbleTranslateY = useSharedValue(6);

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{translateY: bubbleTranslateY.value}],
  }), [bubbleOpacity, bubbleTranslateY]);

  const longPressedRef = useRef(false);
  const tapPeekTimerRef = useRef(null);
  const dismissTimerRef = useRef(null);

  const clearTapPeekTimer = useCallback(() => {
    if (tapPeekTimerRef.current) {
      clearTimeout(tapPeekTimerRef.current);
      tapPeekTimerRef.current = null;
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
      clearTapPeekTimer();
      clearDismissTimer();
    };
  }, [clearTapPeekTimer, clearDismissTimer]);

  const resetAnim = useCallback(() => {
    cancelAnimation(popY);
    cancelAnimation(tilt);
    cancelAnimation(pivotX);
    cancelAnimation(scale);

    popY.value = 0;
    tilt.value = 0;
    pivotX.value = 0;
    scale.value = 1;
  }, [popY, tilt, pivotX, scale]);

  const runTiltPeekOnce = useCallback(() => {
    if (isRefreshing) return;
    if (!hasEmotion) return;
    if (forceMomEmotionPeek) return;

    clearTapPeekTimer();

    cancelAnimation(popY);
    cancelAnimation(tilt);
    cancelAnimation(pivotX);
    cancelAnimation(scale);

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

    scale.value = withSequence(
      withTiming(1.08, {duration: 110}),
      withTiming(1.0, {duration: 170}),
    );

    tapPeekTimerRef.current = setTimeout(() => {
      cancelAnimation(popY);
      popY.value = withSpring(0, {damping: 11, stiffness: 215, mass: 0.7});

      cancelAnimation(pivotX);
      pivotX.value = withTiming(0, {duration: 180});
    }, 520);
  }, [
    isRefreshing,
    hasEmotion,
    forceMomEmotionPeek,
    clearTapPeekTimer,
    popY,
    tilt,
    pivotX,
    scale,
  ]);

  const handlePress = useCallback(() => {
    if (longPressedRef.current) return;

    hapticLight();

    cancelAnimation(pressScale);
    pressScale.value = withSequence(
      withTiming(1.1, {duration: 90, easing: Easing.out(Easing.cubic)}),
      withTiming(1.0, {duration: 140, easing: Easing.out(Easing.cubic)}),
    );

    runTiltPeekOnce();

    if (emotionLabel) {
      clearDismissTimer();
      bubbleOpacity.value = withTiming(1, {duration: 180});
      bubbleTranslateY.value = withTiming(0, {duration: 180, easing: Easing.out(Easing.cubic)});
      dismissTimerRef.current = setTimeout(() => {
        hideBubble();
        dismissTimerRef.current = null;
      }, 1800);
    }
  }, [runTiltPeekOnce, pressScale, emotionLabel, clearDismissTimer, hideBubble, bubbleOpacity, bubbleTranslateY]);

  const handleLongPress = useCallback(() => {
    if (isRefreshing) return;

    longPressedRef.current = true;
    hapticLight();

    cancelAnimation(pressScale);
    pressScale.value = withTiming(0.94, {
      duration: 90,
      easing: Easing.out(Easing.cubic),
    });

    clearTapPeekTimer();
    clearDismissTimer();
    hideBubble();
    resetAnim();

    onUserPress?.(safeMember);
  }, [
    isRefreshing,
    onUserPress,
    safeMember,
    clearTapPeekTimer,
    clearDismissTimer,
    hideBubble,
    resetAnim,
    pressScale,
  ]);

  const handlePressOut = useCallback(() => {
    longPressedRef.current = false;

    cancelAnimation(pressScale);
    pressScale.value = withSpring(1, {damping: 12, stiffness: 260, mass: 0.6});
  }, [pressScale]);

  useEffect(() => {
    if (!hasEmotion) return;
    if (forceMomEmotionPeek) {
      clearTapPeekTimer();
      cancelAnimation(popY);
      cancelAnimation(tilt);
      cancelAnimation(pivotX);
      cancelAnimation(scale);
      popY.value = 1;
      tilt.value = 0;
      pivotX.value = 0;
      scale.value = 1;
      return;
    }

    let mounted = true;
    let timer1 = null;

    const runRandomTiltPeek = () => {
      if (!mounted) return;
      if (isRefreshing || longPressedRef.current) return;

      const dir = Math.random() > 0.5 ? 1 : -1;

      cancelAnimation(popY);
      cancelAnimation(tilt);
      cancelAnimation(pivotX);
      cancelAnimation(scale);

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

    const scheduleNext = () => {
      if (!mounted) return;

      const delayMs = 3000 + Math.floor(Math.random() * 4000);
      timer1 = setTimeout(() => {
        if (!mounted) return;

        if (isRefreshing || longPressedRef.current) {
          scheduleNext();
          return;
        }

        const shouldPeek = Math.random() < 0.25;
        if (!shouldPeek) {
          scheduleNext();
          return;
        }

        runRandomTiltPeek();
        scheduleNext();
      }, delayMs);
    };

    scheduleNext();

    return () => {
      mounted = false;
      if (timer1) clearTimeout(timer1);
      cancelAnimation(popY);
      cancelAnimation(tilt);
      cancelAnimation(pivotX);
      cancelAnimation(scale);
    };
  }, [
    hasEmotion,
    forceMomEmotionPeek,
    isRefreshing,
    clearTapPeekTimer,
    popY,
    tilt,
    pivotX,
    scale,
  ]);

  const EMOTION_HIDE_PUSH = Math.round(profileSize * 0.2) + 6;

  return (
    <TouchableOpacity
      style={[styles.user, {width: itemWidth}]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={320}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
      disabled={isRefreshing}>
      <Animated.View
        style={[
          styles.avatarShell,
          {width: shellSize, height: shellSize},
          avatarPressStyle,
        ]}>
        <View
          style={[
            styles.avatarRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              backgroundColor: ringBorderColor,
              borderColor:
                ringBorderColor == null ? '#EEF2F7' : ringBorderColor,
            },
          ]}
        />

        <Image
          source={profileSource}
          style={[
            styles.profileImage,
            {width: profileSize, height: profileSize},
          ]}
        />

        {!!emotionImage && (
          <View
            style={[
              styles.emotionPeekMask,
              {
                width: profileSize,
                height: profileSize,
                borderRadius: profileSize / 2,
                borderColor: 'transparent',
              },
            ]}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: -5,
                  right: 0,
                  bottom: -(profileSize * 1.2) - EMOTION_HIDE_PUSH,
                },
                emotionPeekStyle,
              ]}>
              <Image
                source={emotionImage}
                style={[
                  styles.emotionImage,
                  {width: emotionSize, height: emotionSize},
                ]}
              />
            </Animated.View>
          </View>
        )}

        {!!emotionLabel && (
          <Animated.View
            pointerEvents="none"
            style={[
              bubbleAnimStyle,
              {
                position: 'absolute',
                bottom: shellSize + 6,
                left: -36,
                right: -36,
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

        <View
          style={[
            styles.dotBorder,
            {
              width: dot + 2,
              height: dot + 2,
              borderRadius: (dot + 2) / 2,
              top: dotTop - 1,
              right: dotRight - 1,
            },
          ]}
        />
        <View
          style={[
            styles.dotBase,
            isOnline ? styles.onlineDot : styles.offlineDot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              top: dotTop,
              right: dotRight,
            },
          ]}
        />
      </Animated.View>

      <View style={styles.infoCol}>
        <AppText
          allowFontScaling={false}
          style={[
            styles.userName,
            !rawMemberName ? styles.userNamePlaceholder : null,
          ]}
          numberOfLines={1}>
          {memberNameLabel}
        </AppText>

        {!!statusText && (
          <View
            style={[
              styles.statusPill,
              isOnline ? styles.statusPillOnline : styles.statusPillOffline,
            ]}>
            <AppText
              allowFontScaling={false}
              style={[
                styles.statusText,
                isOnline ? styles.statusOnline : styles.statusOffline,
              ]}
              numberOfLines={1}>
              {statusText}
            </AppText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function MemberGridSection({
  members = [],
  hasFamily,
  onUserPress,
  onAddPress,
  /** 빈 그리드: 「초대코드로 참여」 — 없으면 onAddPress */
  onEmptyJoinByCodePress,
  /** 빈 그리드: 「새 모임 만들기」 — 없으면 onAddPress */
  onEmptyCreateFamilyPress,
  onlineUserIds = [],
  lastActiveMap = {},
  chunkSize = 3,
  isRefreshing: isRefreshingProp = null,
  guideInviteRef,
}) {
  const styles = useScaledStyleSheet(rf => ({
    shadowWrap: {
      position: 'relative',
      alignItems: 'center',
      alignSelf: 'center',
    },
    /** 홈 스크롤 flexGrow + 빈 그리드: 카드가 남은 높이 채움 */
    shadowWrapFill: {
      flex: 1,
    },
    dropShadow: {
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.12,
      shadowRadius: 2,
      elevation: 3,
    },
    dropShadowFill: {
      flex: 1,
    },

    bodyContainer: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: getResponsiveIconSize(16),
      paddingTop: getResponsiveHeight(22),
    },
    bodyContainerFill: {
      flex: 1,
    },

    gridArea: {
      position: 'relative',
    },
    gridAreaFill: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 0,
    },

    wrapRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      alignSelf: 'center',
    },

    // 6명 초과 시 내부 스크롤 래퍼
    innerScrollWrap: {
      alignSelf: 'center',
      width: '100%',
    },
    innerScrollContent: {
      // ScrollView 안에서 wrapRow가 중앙에 오도록
      paddingBottom: getResponsiveHeight(6),
    },

    user: {
      alignItems: 'center',
      paddingVertical: getResponsiveHeight(6),
      borderRadius: getResponsiveIconSize(18),
    },

    avatarShell: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: getResponsiveHeight(8),
      position: 'relative',
      overflow: 'visible',
    },

    avatarRing: {
      position: 'absolute',
      borderWidth: 1,
      borderColor: '#EEF2F7',
    },

    profileImage: {
      borderRadius: 999,
      zIndex: 1,
      borderWidth: 0,
    },

    emotionPeekMask: {
      position: 'absolute',
      overflow: 'hidden',
      zIndex: 2,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },

    emotionImage: {
      position: 'absolute',
      resizeMode: 'contain',
      bottom: 0,
    },

    dotBase: {
      position: 'absolute',
      zIndex: 5,
    },
    dotBorder: {
      position: 'absolute',
      backgroundColor: '#FFFFFF',
      zIndex: 4,
    },
    onlineDot: {
      backgroundColor: '#22C55E',
    },
    offlineDot: {
      backgroundColor: '#D1D5DB',
    },

    infoCol: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: getResponsiveHeight(5),
    },
    userName: {
      fontSize: rf(14),
      fontFamily: FONTS.SEMI_BOLD,
      color: '#111827',
      letterSpacing: -0.2,
    },
    userNamePlaceholder: {
      color: '#9CA3AF',
    },

    statusPill: {
      paddingHorizontal: getResponsiveWidth(8),
      paddingVertical: getResponsiveHeight(3),
      borderRadius: 999,
      borderWidth: 1,
      maxWidth: '100%',
    },
    statusPillOnline: {
      backgroundColor: 'rgba(34,197,94,0.08)',
      borderColor: 'rgba(34,197,94,0.15)',
    },
    statusPillOffline: {
      backgroundColor: '#F8FAFC',
      borderColor: '#EEF2F7',
    },

    statusText: {
      fontSize: rf(11),
      fontFamily: FONTS.MEDIUM,
    },
    statusOnline: {color: '#16A34A'},
    statusOffline: {color: '#6B7280'},

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
      fontSize: rf(11.5),
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

    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: getResponsiveIconSize(16),
    },
    loadingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveWidth(8),
      paddingHorizontal: getResponsiveWidth(12),
      paddingVertical: getResponsiveHeight(8),
      borderRadius: 999,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(17,24,39,0.08)',
    },
    loadingText: {
      fontSize: rf(12.5),
      fontFamily: FONTS.SEMI_BOLD,
      color: '#111827',
      letterSpacing: -0.1,
    },

    emptyStateOuter: {
      width: '100%',
      alignItems: 'center',
      paddingVertical: getResponsiveHeight(8),
      paddingHorizontal: getResponsiveWidth(4),
    },
    emptyStateGroup: {
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: getResponsiveWidth(16),
      maxWidth: '100%',
    },
    emptyCtaStack: {
      alignSelf: 'center',
      width: '58%',
      maxWidth: getResponsiveWidth(188),
      marginTop: getResponsiveHeight(18),
      gap: getResponsiveHeight(10),
    },
    /** 빈 상태 전용 — 풀폭 고정 높이 CTA가 아닌 유도 버튼 */
    emptyStateCta: {
      alignSelf: 'stretch',
      width: '100%',
      paddingVertical: getResponsiveHeight(10),
      paddingHorizontal: getResponsiveWidth(16),
      minHeight: getResponsiveHeight(40),
      borderRadius: getResponsiveIconSize(12),
      backgroundColor: '#FFC84D',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateCtaOutline: {
      alignSelf: 'stretch',
      width: '100%',
      paddingVertical: getResponsiveHeight(10),
      paddingHorizontal: getResponsiveWidth(16),
      minHeight: getResponsiveHeight(40),
      borderRadius: getResponsiveIconSize(12),
      backgroundColor: COLORS.surfacePrimary,
      borderWidth: 1,
      borderColor: COLORS.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateCtaText: {
      fontSize: rf(13),
      fontFamily: FONTS.SEMI_BOLD,
      color: '#111827',
      letterSpacing: -0.18,
    },
    emptyStateCtaTextOutline: {
      fontSize: rf(13),
      fontFamily: FONTS.SEMI_BOLD,
      color: COLORS.textStrong,
      letterSpacing: -0.18,
    },
    emptyDesc: {
      fontSize: EMPTY_STYLE().emptyFontSize,
      fontFamily: EMPTY_STYLE().emptyFontFamily,
      color: EMPTY_STYLE().emptyColor,
      textAlign: 'center',
      lineHeight: rf(18),
    },

    footerFixed: {
      position: 'absolute',
    },

    addButton: {
      alignSelf: 'center',
      paddingHorizontal: getResponsiveWidth(32),
      height: getResponsiveHeight(46),
      borderRadius: getResponsiveIconSize(12),
      backgroundColor: '#FFC84D',
      alignItems: 'center',
      justifyContent: 'center',
    },

    addButtonText: {
      fontSize: rf(13.5),
      fontFamily: FONTS.SEMI_BOLD,
      color: '#111827',
      letterSpacing: -0.2,
    },
  }));
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const marginH = getResponsiveWidth(14);
  const paddingH = getResponsiveWidth(8);

  const gapX = getResponsiveWidth(8);
  const gapY = getResponsiveHeight(14);

  const containerWidth =
    screenWidth - LAYOUT_STYLE().screenPaddingHorizontal * 2;
  const innerContentWidth = screenWidth - marginH * 2 - paddingH * 2;
  const itemWidth = (innerContentWidth - gapX * (chunkSize - 1)) / chunkSize;

  // hasFamily가 전달된 경우: 가족 존재 여부로 빈 상태 판단 (혼자만 있을 때도 정상 표시)
  const isEmptyState = hasFamily != null ? !hasFamily : (!members || members.length === 0);
  // 가족은 있지만 아직 나 혼자인 상태 (멤버 필터 후 0명)
  const hasFamilyNoMembers = !isEmptyState && (!members || members.length === 0);

  const onlineSet = useMemo(() => {
    return new Set((onlineUserIds || []).map(v => String(v)));
  }, [onlineUserIds]);

  const isRefreshing =
    typeof isRefreshingProp === 'boolean'
      ? isRefreshingProp
      : false;

  const handleAddPress = useCallback(() => {
    hapticLight();
    onAddPress?.();
  }, [onAddPress]);

  const handleEmptyJoinByCode = useCallback(() => {
    hapticLight();
    (onEmptyJoinByCodePress ?? onAddPress)?.();
  }, [onEmptyJoinByCodePress, onAddPress]);

  const handleEmptyCreateFamily = useCallback(() => {
    hapticLight();
    (onEmptyCreateFamilyPress ?? onAddPress)?.();
  }, [onEmptyCreateFamilyPress, onAddPress]);

  // 버튼 아래 여백 확보 (absolute 버튼)
  const safeBottom = Math.max(insets.bottom, getResponsiveHeight(10));
  const footerPaddingBottom = safeBottom + getResponsiveHeight(8);

  const ADD_BUTTON_H = getResponsiveHeight(40);
  const ADD_BUTTON_GAP = getResponsiveHeight(14);
  const bottomSpaceNonEmpty =
    footerPaddingBottom + ADD_BUTTON_H + ADD_BUTTON_GAP;
  const bottomSpace = isEmptyState || hasFamilyNoMembers
    ? getResponsiveHeight(22)
    : bottomSpaceNonEmpty;

  // 6명 초과" 기준으로 내부 스크롤 ON
  const enableInnerScroll =
    !isEmptyState && !hasFamilyNoMembers && members.length > INTERNAL_SCROLL_THRESHOLD;

  const gridMaxHRaw = screenHeight * 0.33; // 대충 카드 안에서 1/3 정도만 스크롤 영역
  const gridMaxH = clamp(
    gridMaxHRaw,
    getResponsiveHeight(240),
    getResponsiveHeight(360),
  );

  const GridContent = (
    <View
      style={[
        styles.wrapRow,
        {
          width: innerContentWidth,
          columnGap: gapX,
          rowGap: gapY,
        },
      ]}>
      {members.map((m, i) => (
        <MemberGridItem
          key={String(m?.userId ?? m?.id ?? m?._id ?? i)}
          member={m}
          index={i}
          itemWidth={itemWidth}
          onlineSet={onlineSet}
          lastActiveMap={lastActiveMap}
          onUserPress={onUserPress}
          isRefreshing={isRefreshing}
          styles={styles}
        />
      ))}
    </View>
  );

  return (
    <View
      style={[
        styles.shadowWrap,
        styles.shadowWrapFill,
        {width: containerWidth},
      ]}>
      <DropShadow
        style={[styles.dropShadow, styles.dropShadowFill]}>
      <View
        style={[
          styles.bodyContainer,
          styles.bodyContainerFill,
          {
            width: '100%',
            paddingHorizontal: paddingH,
            paddingBottom: bottomSpace,
          },
        ]}>
        <View style={[styles.gridArea, styles.gridAreaFill]}>
          {isEmptyState ? (
            <View style={styles.emptyStateOuter}>
              <View style={styles.emptyStateGroup}>
                <Image
                  style={{
                    width: getResponsiveWidth(34),
                    height: getResponsiveWidth(34),
                    resizeMode: 'contain',
                    tintColor: EMPTY_STYLE().emptyColor,
                    marginBottom: getResponsiveHeight(10),
                  }}
                  source={require('../../../assets/icons/tabs/1/family.png')}
                />
                <AppText allowFontScaling={false} style={styles.emptyDesc}>
                  {
                    '아직 가족 모임이 완성되지 않았어요.\n초대 코드로 참여하거나 새 모임을 만들어 보세요!'
                  }
                </AppText>
                <View style={styles.emptyCtaStack}>
                  <TouchableOpacity
                    ref={guideInviteRef}
                    activeOpacity={0.88}
                    onPress={handleEmptyJoinByCode}
                    disabled={isRefreshing}
                    style={[
                      styles.emptyStateCta,
                      isRefreshing && {opacity: 0.5},
                    ]}>
                    <AppText
                      allowFontScaling={false}
                      style={styles.emptyStateCtaText}>
                      초대코드로 참여
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={handleEmptyCreateFamily}
                    disabled={isRefreshing}
                    style={[
                      styles.emptyStateCtaOutline,
                      isRefreshing && {opacity: 0.5},
                    ]}>
                    <AppText
                      allowFontScaling={false}
                      style={styles.emptyStateCtaTextOutline}>
                      새 모임 만들기
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : hasFamilyNoMembers ? (
            // 가족 생성 후 나 혼자인 상태: 아이콘 + 안내 텍스트 + 초대 버튼 인라인
            <View style={styles.emptyStateOuter}>
              <View style={styles.emptyStateGroup}>
                <Image
                  style={{
                    width: getResponsiveWidth(34),
                    height: getResponsiveWidth(34),
                    resizeMode: 'contain',
                    tintColor: EMPTY_STYLE().emptyColor,
                    marginBottom: getResponsiveHeight(10),
                  }}
                  source={require('../../../assets/icons/tabs/1/family.png')}
                />
                <AppText allowFontScaling={false} style={styles.emptyDesc}>
                  {'아직 가족 모임이 완성되지 않았어요.\n가족을 초대해서 모임을 완성해보세요!'}
                </AppText>
                <TouchableOpacity
                  ref={guideInviteRef}
                  activeOpacity={0.9}
                  onPress={handleAddPress}
                  disabled={isRefreshing}
                  style={[styles.addButton, {marginTop: getResponsiveHeight(16)}, isRefreshing && {opacity: 0.5}]}>
                  <AppText allowFontScaling={false} style={styles.addButtonText}>
                    가족 초대하기
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          ) : enableInnerScroll ? (
            // 여기: 6명 초과면 "이 영역만" 스크롤
            <View style={[styles.innerScrollWrap, {maxHeight: gridMaxH}]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={styles.innerScrollContent}
                scrollEventThrottle={16}
                // iOS에서 스크롤 위/아래 바운스 느낌(싫으면 false)
                bounces={true}>
                {GridContent}
              </ScrollView>
            </View>
          ) : (
            GridContent
          )}

          {isRefreshing && (
            <View style={styles.loadingOverlay} pointerEvents="auto">
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#111827" />
                <AppText allowFontScaling={false} style={styles.loadingText}>
                  로딩중…
                </AppText>
              </View>
            </View>
          )}
        </View>

        {!isEmptyState && !hasFamilyNoMembers && (
          <View
            style={[
              styles.footerFixed,
              {
                left: paddingH * 2,
                right: paddingH * 2,
                bottom: paddingH * 2,
              },
            ]}>
            <TouchableOpacity
              ref={guideInviteRef}
              activeOpacity={0.9}
              onPress={handleAddPress}
              disabled={isRefreshing}
              style={[styles.addButton, {alignSelf: 'stretch', paddingHorizontal: 0}, isRefreshing && {opacity: 0.5}]}>
              <AppText allowFontScaling={false} style={styles.addButtonText}>
                가족 초대하기
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
      </DropShadow>
    </View>
  );
}
