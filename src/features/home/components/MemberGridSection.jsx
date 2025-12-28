import React, {useMemo, useCallback, useState} from 'react';
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
import {EMPTY_STYLE} from 'styles/style';
import DropShadow from 'react-native-drop-shadow';

// ✅ HAPTIC
import {hapticLight} from '../../../utils/haptic';

const AVATAR = getResponsiveIconSize(60);

export default function MemberGridSection({
  members = [],
  onUserPress,
  onAddPress,
  onRefreshPress, // ✅ async 함수(권장): await onRefreshPress()
  onlineUserIds = [],
  lastActiveMap = {},
  chunkSize = 3,

  // ✅ 선택: 부모에서 로딩을 제어하고 싶으면 이거 넘겨줘도 됨
  isRefreshing: isRefreshingProp = null,
}) {
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();

  const marginH = getResponsiveWidth(14);
  const paddingH = getResponsiveWidth(8);

  const gapX = getResponsiveWidth(8);
  const gapY = getResponsiveHeight(14);

  // ✅ 카드(섀도우 포함) 전체 폭: Empty여도 항상 유지
  const containerWidth = screenWidth - marginH * 2;

  const innerContentWidth = screenWidth - marginH * 2 - paddingH * 2;
  const itemWidth = (innerContentWidth - gapX * (chunkSize - 1)) / chunkSize;

  const isEmptyState = !members || members.length === 0;

  const onlineSet = useMemo(() => {
    return new Set((onlineUserIds || []).map(v => String(v)));
  }, [onlineUserIds]);

  // ✅ 로컬 로딩 상태(부모에서 안 주면 여기서 제어)
  const [isRefreshingLocal, setIsRefreshingLocal] = useState(false);
  const isRefreshing =
    typeof isRefreshingProp === 'boolean'
      ? isRefreshingProp
      : isRefreshingLocal;

  // ✅ 새로고침 버튼(여기서는 외부에서 호출할 일 있을 수 있어서 보존)
  const handleRefresh = useCallback(async () => {
    if (!onRefreshPress) return;
    if (isRefreshing) return;

    try {
      setIsRefreshingLocal(true);
      hapticLight(); // ✅ 햅틱
      await onRefreshPress?.();
    } finally {
      setIsRefreshingLocal(false);
    }
  }, [onRefreshPress, isRefreshing]);

  const renderUser = useCallback(
    (member, index) => {
      const rawId = member.userId ?? member.id ?? member._id ?? index;
      const memberId = String(rawId);

      const isOnline = onlineSet.has(memberId);
      const lastRaw = lastActiveMap?.[memberId];

      const statusText = isOnline
        ? '접속중'
        : lastRaw
        ? `${formatRelativeKorean(lastRaw)} 접속`
        : null;

      let finalEmotion = member.emotion;
      if (!member.emotionUpdatedAt) {
        finalEmotion = null;
      } else {
        const updatedTime = new Date(member.emotionUpdatedAt).getTime();
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

      const ringSize = shellSize * 0.985;
      const imageSizeWithEmotion = shellSize * 0.73;
      const imageSizeNoEmotion = shellSize * 0.88;

      const dot = Math.max(8, Math.round(shellSize * 0.22));
      const dotTop = Math.max(2, Math.round(shellSize * 0.07));
      const dotRight = Math.max(2, Math.round(shellSize * 0.07));

      const handlePressUser = () => {
        hapticLight(); // ✅ 유저 카드 탭 햅틱
        onUserPress?.(member);
      };

      return (
        <TouchableOpacity
          key={memberId}
          style={[styles.user, {width: itemWidth}]}
          onPress={handlePressUser}
          activeOpacity={0.85}
          disabled={isRefreshing}>
          <View
            style={[styles.avatarShell, {width: shellSize, height: shellSize}]}>
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

            {!!emotionImage && (
              <Image
                source={emotionImage}
                style={[
                  styles.emotionImage,
                  {width: shellSize * 1.18, height: shellSize * 1.18},
                ]}
              />
            )}

            <Image
              source={
                member.image
                  ? {uri: member.image}
                  : require('../../../assets/images/kino-blue.png')
              }
              style={[
                styles.userImage,
                {
                  width: emotionImage
                    ? imageSizeWithEmotion
                    : imageSizeNoEmotion,
                  height: emotionImage
                    ? imageSizeWithEmotion
                    : imageSizeNoEmotion,
                  top: emotionImage ? 11.5 : null,
                  borderWidth: emotionImage ? 2 : null,
                  borderColor: emotionImage ? 'white' : null,
                },
              ]}
            />

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
                  top: emotionImage ? dotTop : dotTop,
                  right: dotRight,
                },
              ]}
            />
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.userName} numberOfLines={1}>
              {member.name}
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
    },
    [itemWidth, lastActiveMap, onlineSet, onUserPress, isRefreshing],
  );

  const handleAddPress = useCallback(() => {
    hapticLight(); // ✅ +버튼 햅틱
    onAddPress?.();
  }, [onAddPress]);

  return (
    <DropShadow
      style={[
        styles.shadowWrap,
        {
          width: containerWidth, // ✅ Empty여도 폭 고정
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.12,
          shadowRadius: 5,
        },
      ]}>
      <View
        style={[
          styles.bodyContainer,
          {
            width: '100%', // ✅ DropShadow 폭을 꽉 채움
            paddingHorizontal: paddingH,
            minHeight: screenHeight - getResponsiveHeight(470),
          },
        ]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>우리 가족</Text>
            <Text style={styles.sectionSubtitle}>실시간 접속 상태</Text>
          </View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={handleAddPress}
              disabled={isRefreshing}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              activeOpacity={0.85}
              style={[styles.iconButton, isRefreshing && {opacity: 0.6}]}>
              <Image
                // source={require('../../../assets/icons/add-contact.png')}
                source={require('../../../assets/icons/userPlus.png')}
                style={styles.iconButtonIcon}
              />
            </TouchableOpacity>

            {/* ✅ (선택) 새로고침 버튼이 실제로 있다면 연결만 해두기
                - 현재 UI에는 아이콘이 없어서 호출은 안 됨
                - 필요하면 여기 버튼 추가하고 onPress={handleRefresh} 쓰면 됨 */}
          </View>
        </View>

        {/* ✅ “멤버 뜨는 그곳”에 로딩중 오버레이 */}
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
              {members.map(renderUser)}
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
    alignSelf: 'center', // ✅ 가운데 정렬 유지
  },

  bodyContainer: {
    width: '100%', // ✅ Empty여도 폭 유지
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveIconSize(16),
    paddingTop: getResponsiveHeight(16),
    paddingBottom: getResponsiveHeight(22),
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(10),
    paddingTop: getResponsiveHeight(4),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    marginTop: getResponsiveHeight(3),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#9CA3AF',
  },

  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
  },

  iconButton: {
    width: getResponsiveIconSize(36),
    height: getResponsiveIconSize(36),
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  iconButtonIcon: {
    width: '60%',
    height: '60%',
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

  userImage: {
    borderRadius: 999,
    zIndex: 2,
  },

  emotionImage: {
    position: 'absolute',
    resizeMode: 'contain',
    zIndex: 1,
    bottom: getResponsiveHeight(0),
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
  emptyCta: {
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(8),
    borderRadius: 999,
    backgroundColor: '#FFE27A',
  },
  emptyCtaText: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#6B4A00',
  },
});
