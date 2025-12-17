import React, {useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
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

const AVATAR = getResponsiveIconSize(60);
const DOT_BASE = Math.max(10, Math.round(AVATAR * 0.28));

export default function MemberGridSection({
  members = [],
  onUserPress,
  onAddPress,
  onlineUserIds = [],
  lastActiveMap = {},
  chunkSize = 3,
}) {
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();

  const marginH = getResponsiveWidth(14);
  const paddingH = getResponsiveWidth(8);

  // ✅ “진짜” 간격은 wrapRow에서 관리 (아이템에 marginRight 주지 않기)
  const gapX = getResponsiveWidth(8);
  const gapY = getResponsiveHeight(14);

  const innerContentWidth = screenWidth - marginH * 2 - paddingH * 2;
  const itemWidth = (innerContentWidth - gapX * (chunkSize - 1)) / chunkSize;

  const isEmptyState = !members || members.length === 0;

  const onlineSet = useMemo(() => {
    return new Set((onlineUserIds || []).map(v => String(v)));
  }, [onlineUserIds]);

  const renderUser = (member, index) => {
    const rawId = member.userId ?? member.id ?? member._id ?? index;
    const memberId = String(rawId);

    const isOnline = onlineSet.has(memberId);
    const lastRaw = lastActiveMap?.[memberId];

    const statusText = isOnline
      ? '접속중'
      : lastRaw
      ? `${formatRelativeKorean(lastRaw)} 접속`
      : null;

    // emotion 처리 (24시간 이내만 표시)
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

    // ✅ itemWidth에 맞춰 아바타 영역이 줄어들도록 (최대는 기존 크기 유지)
    const shellMax = AVATAR * 1.36;
    const shellSize = Math.min(shellMax, itemWidth); // 칸이 작으면 칸에 맞춤

    const ringSize = shellSize * 0.985;
    const imageSizeWithEmotion = shellSize * 0.74;
    const imageSizeNoEmotion = shellSize * 0.88;

    const dot = Math.max(8, Math.round(shellSize * 0.22));
    const dotTop = Math.max(2, Math.round(shellSize * 0.07));
    const dotRight = Math.max(2, Math.round(shellSize * 0.07));

    return (
      <TouchableOpacity
        key={memberId}
        style={[styles.user, {width: itemWidth}]}
        onPress={() => onUserPress?.(member)}
        activeOpacity={0.85}>
        <View
          style={[styles.avatarShell, {width: shellSize, height: shellSize}]}>
          <View
            style={[
              styles.avatarRing,
              {width: ringSize, height: ringSize, borderRadius: ringSize / 2},
              isOnline && styles.avatarRingOnline,
            ]}
          />

          {!!emotionImage && (
            <Image
              source={emotionImage}
              style={[
                styles.emotionImage,
                {
                  width: shellSize * 1.18,
                  height: shellSize * 1.18,
                },
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
                width: emotionImage ? imageSizeWithEmotion : imageSizeNoEmotion,
                height: emotionImage
                  ? imageSizeWithEmotion
                  : imageSizeNoEmotion,
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
                top: dotTop,
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
  };

  return (
    <DropShadow
      style={[
        styles.shadowWrap,
        {
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
            minWidth: '87%',
            paddingHorizontal: paddingH,
            minHeight: screenHeight - getResponsiveHeight(470),
          },
        ]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>우리 가족</Text>
            <Text style={styles.sectionSubtitle}>실시간 접속 상태</Text>
          </View>

          <TouchableOpacity
            onPress={onAddPress}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            activeOpacity={0.85}
            style={styles.addButton}>
            <Image
              source={require('../../../assets/icons/add-contact.png')}
              style={styles.addIcon}
            />
          </TouchableOpacity>
        </View>

        {isEmptyState ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyDesc}>
              {
                '아직 가족 모임이 완성되지 않았어요\n가족을 초대해서 모임을 완성해보세요!'
              }
            </Text>

            {!!onAddPress && (
              <TouchableOpacity
                onPress={onAddPress}
                activeOpacity={0.9}
                style={styles.emptyCta}>
                <Text style={styles.emptyCtaText}>가족 초대하기</Text>
              </TouchableOpacity>
            )}
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
      </View>
    </DropShadow>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    position: 'relative',
    alignItems: 'center',
  },

  bodyContainer: {
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

  addButton: {
    width: getResponsiveIconSize(36),
    height: getResponsiveIconSize(36),
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  addIcon: {
    width: '50%',
    height: '50%',
    tintColor: '#6B7280',
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

  emptyStateContainer: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: getResponsiveHeight(18),
    paddingBottom: getResponsiveHeight(44),
    paddingHorizontal: getResponsiveWidth(18),
  },
  emptyDesc: {
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontFamily: EMPTY_STYLE.emptyFontFamily,
    color: EMPTY_STYLE.emptyColor,
    textAlign: 'center',
    marginBottom: getResponsiveHeight(14),
    lineHeight: getResponsiveHeight(20),
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
