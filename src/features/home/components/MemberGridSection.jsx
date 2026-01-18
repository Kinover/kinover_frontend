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
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {formatRelativeKorean} from '../utils/dateUtils';
import {getEmotionImage} from '../utils/emotionUtils';
import {DEFAULT_STYLE, EMPTY_STYLE, LAYOUT_STYLE} from 'styles/style';
import DropShadow from 'react-native-drop-shadow';

// ✅ HAPTIC
import {hapticLight} from '../../../utils/haptic';

// ✅ REANIMATED
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

// ✅ clamp 유틸
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// ✅ 사이즈 가드 (핵심)
// - 기기별 responsive 폭주/디스플레이 확대 방지용
const SHELL_MIN = getResponsiveIconSize(54);
const SHELL_MAX = getResponsiveIconSize(78);

const PROFILE_MIN = getResponsiveIconSize(46);
const PROFILE_MAX = getResponsiveIconSize(70);

// dot은 너무 커지면 촌스러워져서 상한
const DOT_MIN = 8;
const DOT_MAX = 14;

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

  // ✅ 감정: 24시간 지나면 null 처리
  let finalEmotion = safeMember.emotion;
  let finalEmotionUpdatedAt = safeMember.emotionUpdatedAt;

  if (!isEmotionValid(finalEmotion, finalEmotionUpdatedAt)) {
    finalEmotion = null;
    finalEmotionUpdatedAt = null;
  }

  const emotionImage = finalEmotion ? getEmotionImage(finalEmotion) : null;
  const hasEmotion = !!emotionImage;

  // =========================================================
  // ✅ 사이즈 계산 (여기서 폭주 방지)
  // =========================================================
  const shellMax = AVATAR * 1.36;

  // 원래: Math.min(shellMax, itemWidth)
  // 수정: clamp로 하한/상한 걸고, itemWidth랑도 비교
  const shellSizeRaw = Math.min(shellMax, itemWidth);
  const shellSize = clamp(
    shellSizeRaw,
    SHELL_MIN,
    Math.min(SHELL_MAX, itemWidth),
  );

  const ringSize = shellSize * 1;

  // 프로필/감정 사이즈도 안정화
  const profileSizeRaw = shellSize * 0.88;
  const profileSize = clamp(profileSizeRaw, PROFILE_MIN, PROFILE_MAX);

  const emotionSize = clamp(shellSize * 0.98, PROFILE_MIN, PROFILE_MAX + 12);

  // dot도 상한
  const dot = clamp(Math.round(shellSize * 0.22), DOT_MIN, DOT_MAX);
  const dotTop = Math.max(2, Math.round(shellSize * 0.07));
  const dotRight = Math.max(2, Math.round(shellSize * 0.07));

  const profileSource = safeMember.image
    ? {uri: safeMember.image}
    : require('../../../assets/images/kino-blue.png');

  // =========================================================
  // ✅ "고개 갸웃" Peek 애니메이션
  // =========================================================
  const popY = useSharedValue(0);
  const tilt = useSharedValue(0);
  const pivotX = useSharedValue(0);
  const scale = useSharedValue(1);

  const peekDistance = profileSize * 0.74;
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
  }, [peekDistance, tiltDeg, pivotShift]);

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
    runTiltPeekOnce();
  }, [runTiltPeekOnce]);

  const handleLongPress = useCallback(() => {
    if (isRefreshing) return;

    longPressedRef.current = true;
    hapticLight();

    clearTapPeekTimer();
    resetAnim();

    onUserPress?.(safeMember);
  }, [isRefreshing, onUserPress, safeMember, clearTapPeekTimer, resetAnim]);

  const handlePressOut = useCallback(() => {
    longPressedRef.current = false;
  }, []);

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

  return (
    <TouchableOpacity
      style={[styles.user, {width: itemWidth}]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={320}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
      disabled={isRefreshing}>
      <View style={[styles.avatarShell, {width: shellSize, height: shellSize}]}>
        <View
          style={[
            styles.avatarRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
            },
            isOnline && styles.avatarRingOnline,
          ]}
        />

        <Image
          source={profileSource}
          style={[
            styles.profileImage,
            {
              width: profileSize,
              height: profileSize,
            },
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
              },
            ]}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: -5,
                  right: 0,
                  // ✅ 폭주 방지: profileSize가 커져도 튀어나옴이 과해지지 않게 살짝 완화
                  bottom: -(profileSize * 1.05),
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
      </View>

      <View style={styles.infoCol}>
        <Text style={styles.userName} numberOfLines={1}>
          {safeMember.name ?? ''}
        </Text>

        {!!statusText && (
          <View
            style={[
              styles.statusPill,
              isOnline ? styles.statusPillOnline : styles.statusPillOffline,
            ]}>
            <Text
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

  const marginH = getResponsiveWidth(14);
  const paddingH = getResponsiveWidth(8);

  const gapX = getResponsiveWidth(8);
  const gapY = getResponsiveHeight(14);

  const containerWidth = screenWidth - LAYOUT_STYLE.screenPaddingHorizontal * 2;
  const innerContentWidth = screenWidth - marginH * 2 - paddingH * 2;
  const itemWidth = (innerContentWidth - gapX * (chunkSize - 1)) / chunkSize;

  const isEmptyState = !members || members.length === 0;

  const onlineSet = useMemo(() => {
    return new Set((onlineUserIds || []).map(v => String(v)));
  }, [onlineUserIds]);

  const [isRefreshingLocal, setIsRefreshingLocal] = useState(false);
  const isRefreshing =
    typeof isRefreshingProp === 'boolean'
      ? isRefreshingProp
      : isRefreshingLocal;

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
            minHeight: screenHeight - getResponsiveHeight(470),
          },
        ]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text
              style={{
                fontSize: getResponsiveFontSize(16),
                fontFamily: DEFAULT_STYLE.sectionTitle.fontFamily,
                color: DEFAULT_STYLE.sectionTitle.color,
              }}>
              우리 가족
            </Text>
            <Text
              style={{
                fontSize: getResponsiveFontSize(11.5),
                fontFamily: DEFAULT_STYLE.sectionSubtitle.fontFamily,
                color: DEFAULT_STYLE.sectionSubtitle.color,
              }}>
              실시간 접속 상태
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={handleAddPress}
              disabled={isRefreshing}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              activeOpacity={0.85}
              style={[styles.iconButton, isRefreshing && {opacity: 0.6}]}>
              <Image
                source={require('../../../assets/icons/sub/one.png')}
                style={styles.iconButtonIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.gridArea}>
          {isEmptyState ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyDesc}>
                {
                  '아직 가족 모임이 완성되지 않았어요\n가족을 초대해서 모임을 완성해보세요!'
                }
              </Text>
            </View>
          ) : (
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
          )}

          {isRefreshing && (
            <View style={styles.loadingOverlay} pointerEvents="auto">
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#111827" />
                <Text style={styles.loadingText}>로딩중…</Text>
              </View>
            </View>
          )}
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
    paddingTop: getResponsiveHeight(16),
    paddingBottom: getResponsiveHeight(22),
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(10),
    paddingTop: getResponsiveHeight(4),
  },

  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
  },

  iconButton: {
    width: getResponsiveIconSize(34),
    height: getResponsiveIconSize(34),
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  iconButtonIcon: {
    width: '62%',
    height: '62%',
    tintColor: '#6B7280',
    resizeMode: 'contain',
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
  avatarRingOnline: {
    borderColor: 'rgba(34,197,94,0.20)',
  },

  profileImage: {
    borderRadius: 999,
    zIndex: 1,
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
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '25%',
    paddingHorizontal: getResponsiveWidth(18),
  },
  emptyDesc: {
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontFamily: EMPTY_STYLE.emptyFontFamily,
    color: EMPTY_STYLE.emptyColor,
    textAlign: 'center',
  },
});
