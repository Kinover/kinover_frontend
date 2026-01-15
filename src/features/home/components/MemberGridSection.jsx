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

// ✅ REANIMATED (감정 peek 애니메이션)
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

const AVATAR = getResponsiveIconSize(60);

/** ---------------------------------------------------
 * ✅ 개별 멤버 아이템
 * - 프로필 사진은 항상 보임
 * - 감정 이미지만 아래에서 "반쯤 peek" 했다가 내려감
 * --------------------------------------------------- */
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
  if (!safeMember.emotionUpdatedAt) {
    finalEmotion = null;
  } else {
    const updatedTime = new Date(safeMember.emotionUpdatedAt).getTime();
    if (!Number.isNaN(updatedTime)) {
      const diff = Date.now() - updatedTime;
      if (diff > 24 * 60 * 60 * 1000) finalEmotion = null;
    } else {
      finalEmotion = null;
    }
  }

  const emotionImage = finalEmotion ? getEmotionImage(finalEmotion) : null;

  const shellMax = AVATAR * 1.36;
  const shellSize = Math.min(shellMax, itemWidth);
  const ringSize = shellSize * 1;

  // ✅ 프로필 크기(감정 유무랑 상관없이 "항상 보이는 프로필" 기준)
  const profileSize = shellSize * 0.88;

  // ✅ 감정 이미지 크기 (프로필 안에서 올라왔다 내려갔다)
  const emotionSize = shellSize * 0.98;

  // ✅ 온라인 dot
  const dot = Math.max(8, Math.round(shellSize * 0.22));
  const dotTop = Math.max(2, Math.round(shellSize * 0.07));
  const dotRight = Math.max(2, Math.round(shellSize * 0.07));

  // ✅ 프로필 소스
  const profileSource = safeMember.image
    ? {uri: safeMember.image}
    : require('../../../assets/images/kino-blue.png');

  /** --------------------------------
   * ✅ 감정 peek 애니메이션
   * - emotionPeek.value: 0(숨김) ~ 1(반쯤 올라옴)
   * -------------------------------- */
  const emotionPeek = useSharedValue(0);
  const pressedRef = useRef(false);

  const PEEK_IN = 140;
  const PEEK_OUT = 180;

  // ✅ "반만 보이기" 위한 이동 거리
  const peekDistance = emotionSize * 0.72;

  const emotionPeekStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: -emotionPeek.value * peekDistance}],
    };
  }, [peekDistance]);

  // ✅ 랜덤 peek (감정이 있을 때만)
  useEffect(() => {
    if (!emotionImage) return;

    let mounted = true;
    let timer1 = null;
    let timer2 = null;

    const scheduleNext = () => {
      if (!mounted) return;

      const delayMs = 3000 + Math.floor(Math.random() * 4000);
      timer1 = setTimeout(() => {
        if (!mounted) return;

        if (isRefreshing || pressedRef.current) {
          scheduleNext();
          return;
        }

        const shouldPeek = Math.random() < 0.25;
        if (!shouldPeek) {
          scheduleNext();
          return;
        }

        cancelAnimation(emotionPeek);
        emotionPeek.value = withTiming(1, {duration: PEEK_IN});

        timer2 = setTimeout(() => {
          if (!mounted) return;
          cancelAnimation(emotionPeek);
          emotionPeek.value = withTiming(0, {duration: PEEK_OUT});
          scheduleNext();
        }, 700);
      }, delayMs);
    };

    scheduleNext();

    return () => {
      mounted = false;
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      cancelAnimation(emotionPeek);
    };
  }, [emotionImage, isRefreshing, emotionPeek]);

  const handlePressIn = useCallback(() => {
    if (isRefreshing) return;
    if (!emotionImage) return;

    pressedRef.current = true;
    cancelAnimation(emotionPeek);
    emotionPeek.value = withTiming(1, {duration: PEEK_IN});
  }, [isRefreshing, emotionImage, emotionPeek]);

  const handlePressOut = useCallback(() => {
    pressedRef.current = false;
    if (!emotionImage) return;

    cancelAnimation(emotionPeek);
    emotionPeek.value = withTiming(0, {duration: PEEK_OUT});
  }, [emotionImage, emotionPeek]);

  const handlePressUser = useCallback(() => {
    hapticLight();
    onUserPress?.(safeMember);
  }, [onUserPress, safeMember]);

  return (
    <TouchableOpacity
      style={[styles.user, {width: itemWidth}]}
      onPress={handlePressUser}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
      disabled={isRefreshing}>
      <View style={[styles.avatarShell, {width: shellSize, height: shellSize}]}>
        {/* ✅ 링 */}
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

        {/* ✅ 프로필 사진은 "항상" 보이게 */}
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

        {/* ✅ 감정 이미지만 peek (감정이 있을 때만) */}
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
                  left: -10,
                  right: 0,
                  bottom: -profileSize-20, // ✅ 기준 통일
                },
                emotionPeekStyle,
              ]}>
              <Image
                source={emotionImage}
                style={[
                  styles.emotionImage,
                  {width: profileSize+20, height: profileSize+20},
                ]}
              />
            </Animated.View>
          </View>
        )}

        {/* ✅ online/offline dot */}
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

  // ✅ 프로필 사진
  profileImage: {
    borderRadius: 999,
    zIndex: 1,
  },

  // ✅ 감정 이미지 peek 마스크 (감정만 올라오게)
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
