// src/features/home/components/MemberGridSection.jsx (or .tsx)

import React, {
  useMemo,
  useCallback,
  useState,
  memo,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {formatRelativeKorean} from '../utils/dateUtils';
import {getEmotionImage, getEmotionColor} from '../utils/emotionUtils';
import {EMPTY_STYLE, LAYOUT_STYLE} from 'styles/style';
import DropShadow from 'react-native-drop-shadow';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {hapticLight} from '../../../utils/haptic';

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

const AVATAR = getResponsiveIconSize(60);
const EMOTION_EXPIRE_MS = 24 * 60 * 60 * 1000;

function isEmotionValid(emotion, emotionUpdatedAt) {
  if (!emotion || !emotionUpdatedAt) return false;
  const t = new Date(emotionUpdatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= EMOTION_EXPIRE_MS;
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const SHELL_MIN = getResponsiveIconSize(54);
const SHELL_MAX = getResponsiveIconSize(78);

const PROFILE_MIN = getResponsiveIconSize(46);
const PROFILE_MAX = getResponsiveIconSize(70);

const DOT_MIN = 8;
const DOT_MAX = 14;

// ✅ 6명 초과면 “그리드 영역만” 내부 스크롤
const INTERNAL_SCROLL_THRESHOLD = 6;

const MemberGridItem = memo(function MemberGridItem({
  member,
  index,
  itemWidth,
  onlineSet,
  lastActiveMap,
  onUserPress,
  isRefreshing,
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

  let finalEmotion = safeMember.emotion;
  let finalEmotionUpdatedAt = safeMember.emotionUpdatedAt;

  if (!isEmotionValid(finalEmotion, finalEmotionUpdatedAt)) {
    finalEmotion = null;
    finalEmotionUpdatedAt = null;
  }

  const emotionImage = finalEmotion ? getEmotionImage(finalEmotion) : null;
  const hasEmotion = !!emotionImage;

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

  const longPressedRef = useRef(false);
  const tapPeekTimerRef = useRef(null);

  const clearTapPeekTimer = useCallback(() => {
    if (tapPeekTimerRef.current) {
      clearTimeout(tapPeekTimerRef.current);
      tapPeekTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTapPeekTimer();
  }, [clearTapPeekTimer]);

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
  }, [isRefreshing, hasEmotion, clearTapPeekTimer, popY, tilt, pivotX, scale]);

  const handlePress = useCallback(() => {
    if (longPressedRef.current) return;

    cancelAnimation(pressScale);
    pressScale.value = withSequence(
      withTiming(1.1, {duration: 90, easing: Easing.out(Easing.cubic)}),
      withTiming(1.0, {duration: 140, easing: Easing.out(Easing.cubic)}),
    );

    runTiltPeekOnce();
  }, [runTiltPeekOnce, pressScale]);

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
    resetAnim();

    onUserPress?.(safeMember);
  }, [
    isRefreshing,
    onUserPress,
    safeMember,
    clearTapPeekTimer,
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
  }, [hasEmotion, isRefreshing, popY, tilt, pivotX, scale]);

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
        <Text
          allowFontScaling={false}
          style={styles.userName}
          numberOfLines={1}>
          {safeMember.name ?? ''}
        </Text>

        {!!statusText && (
          <View
            style={[
              styles.statusPill,
              isOnline ? styles.statusPillOnline : styles.statusPillOffline,
            ]}>
            <Text
              allowFontScaling={false}
              style={[
                styles.statusText,
                isOnline ? styles.statusOnline : styles.statusOffline,
              ]}
              numberOfLines={1}>
              {statusText}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function MemberGridSection({
  members = [],
  onUserPress,
  onAddPress,
  onRefreshPress,
  onlineUserIds = [],
  lastActiveMap = {},
  chunkSize = 3,
  isRefreshing: isRefreshingProp = null,
}) {
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

  const isEmptyState = !members || members.length === 0;

  const onlineSet = useMemo(() => {
    return new Set((onlineUserIds || []).map(v => String(v)));
  }, [onlineUserIds]);

  const [isRefreshingLocal, setIsRefreshingLocal] = useState(false);
  const isRefreshing =
    typeof isRefreshingProp === 'boolean' ? isRefreshingProp : isRefreshingLocal;

  const handleRefresh = useCallback(async () => {
    if (!onRefreshPress) return;
    if (isRefreshing) return;

    try {
      setIsRefreshingLocal(true);
      hapticLight();
      await onRefreshPress?.();
    } finally {
      setIsRefreshingLocal(false);
    }
  }, [onRefreshPress, isRefreshing]);

  const handleAddPress = useCallback(() => {
    hapticLight();
    onAddPress?.();
  }, [onAddPress]);

  // ✅ 버튼 아래 여백 확보 (absolute 버튼)
  const safeBottom = Math.max(insets.bottom, getResponsiveHeight(10));
  const footerPaddingBottom = safeBottom + getResponsiveHeight(8);

  const ADD_BUTTON_H = getResponsiveHeight(48);
  const ADD_BUTTON_GAP = getResponsiveHeight(14);
  const bottomSpace = footerPaddingBottom + ADD_BUTTON_H + ADD_BUTTON_GAP;

  // ✅ “6명 초과” 기준으로 내부 스크롤 ON
  const enableInnerScroll = !isEmptyState && members.length > INTERNAL_SCROLL_THRESHOLD;

  // ✅ 내부 스크롤 최대 높이 (원하면 값만 조절)
  // - 화면 높이의 일부를 쓰되, 너무 작아지지 않게 min/max로 방어
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
        />
      ))}
    </View>
  );

  return (
    <DropShadow
      style={[
        styles.shadowWrap,
        {
          width: containerWidth,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.08,
          shadowRadius: 3,
        },
      ]}>
      <View
        style={[
          styles.bodyContainer,
          {
            width: '100%',
            paddingHorizontal: paddingH,
            minHeight: screenHeight - getResponsiveHeight(490),
            paddingBottom: bottomSpace,
          },
        ]}>
        <View style={styles.gridArea}>
          {isEmptyState ? (
            <View style={styles.emptyStateContainer}>
              <Text allowFontScaling={false} style={styles.emptyDesc}>
                {'아직 가족 모임이 완성되지 않았어요.\n가족을 초대해서 모임을 완성해보세요!'}
              </Text>
            </View>
          ) : enableInnerScroll ? (
            // ✅✅✅ 여기: 6명 초과면 “이 영역만” 스크롤
            <View style={[styles.innerScrollWrap, {maxHeight: gridMaxH}]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={styles.innerScrollContent}
                scrollEventThrottle={16}
                // ✅ iOS에서 스크롤 위/아래 바운스 느낌(싫으면 false)
                bounces={true}>
                {GridContent}
              </ScrollView>
            </View>
          ) : (
            // ✅ 6명 이하: 기존처럼 그냥 렌더
            GridContent
          )}

          {isRefreshing && (
            <View style={styles.loadingOverlay} pointerEvents="auto">
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#111827" />
                <Text allowFontScaling={false} style={styles.loadingText}>
                  로딩중…
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ✅ 하단 버튼: 카드 바닥 고정 */}
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
            activeOpacity={0.9}
            onPress={handleAddPress}
            disabled={isRefreshing}
            style={[styles.addButton, isRefreshing && {opacity: 0.5}]}>
            <Text allowFontScaling={false} style={styles.addButtonText}>
              가족 추가하기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </DropShadow>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    position: 'relative',
    alignItems: 'center',
    alignSelf: 'center',
  },

  bodyContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveIconSize(16),
    paddingTop: getResponsiveHeight(22),
  },

  gridArea: {
    position: 'relative',
  },

  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignSelf: 'center',
  },

  // ✅ 6명 초과 시 내부 스크롤 래퍼
  innerScrollWrap: {
    alignSelf: 'center',
    width: '100%',
  },
  innerScrollContent: {
    // ✅ ScrollView 안에서 wrapRow가 중앙에 오도록
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
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    letterSpacing: -0.2,
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
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Medium',
  },
  statusOnline: {color: '#16A34A'},
  statusOffline: {color: '#6B7280'},

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
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    letterSpacing: -0.1,
  },

  emptyStateContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(18),
    paddingTop: getResponsiveHeight(140),
    paddingBottom: getResponsiveHeight(140),
  },
  emptyDesc: {
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
    textAlign: 'center',
  },

  footerFixed: {
    position: 'absolute',
  },

  addButton: {
    width: '100%',
    height: getResponsiveHeight(48),
    borderRadius: getResponsiveIconSize(12),
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
