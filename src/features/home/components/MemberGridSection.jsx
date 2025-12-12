import React from 'react';
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
import {Shadow} from 'react-native-shadow-2';

const AVATAR = getResponsiveIconSize(60);
const DOT = Math.max(10, Math.round(AVATAR * 0.28));

export default function MemberGridSection({
  members = [],
  onUserPress,
  onAddPress,
  onlineUserIds = [],
  lastActiveMap = {},
  chunkSize = 3,
}) {
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();

  const marginH = getResponsiveWidth(25);
  const paddingH = getResponsiveWidth(16);
  const gapX = getResponsiveWidth(0);
  const gapY = getResponsiveHeight(15);

  const innerContentWidth = screenWidth - marginH * 2 - paddingH * 2;
  const itemWidth = (innerContentWidth - gapX * (chunkSize - 1)) / chunkSize;

  const renderUser = (member, index) => {
    const rawId = member.userId ?? member.id ?? member._id ?? index;
    const memberId = String(rawId);

    console.log('🌐 memberId:', memberId);
    console.log('🌐 onlineUserIds:', onlineUserIds);
    console.log(
      '🌐 isOnline:',
      onlineUserIds?.some?.(id => String(id) === memberId),
    );

    const isOnline = onlineUserIds?.some?.(id => String(id) === memberId);
    const lastRaw = lastActiveMap?.[memberId];

    const statusText = isOnline
      ? '지금 접속중'
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
        const now = Date.now();
        const diff = now - updatedTime;
        if (diff > 24 * 60 * 60 * 1000) {
          finalEmotion = null;
        }
      } else {
        finalEmotion = null;
      }
    }

    const emotionImage = finalEmotion ? getEmotionImage(finalEmotion) : null;

    return (
      <TouchableOpacity
        key={memberId}
        style={[
          styles.user,
          {
            width: itemWidth,
            marginRight: gapX,
            marginBottom: gapY,
            marginTop: getResponsiveHeight(12),
          },
        ]}
        onPress={() => onUserPress?.(member)}
        activeOpacity={0.8}>
        <View style={styles.imageWrapper}>
          {!!emotionImage && (
            <Image source={emotionImage} style={styles.emotionImage} />
          )}
          <Image
            source={
              member.image
                ? {uri: member.image}
                : require('../../../assets/images/kino-blue.png')
            }
            style={[
              styles.userImage,
              emotionImage
                ? styles.userImageWithEmotion
                : styles.userImageWithoutEmotion,
            ]}
          />

          {isOnline ? (
            <View style={styles.onlineDot} />
          ) : (
            <View style={styles.offlineDot} />
          )}
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.userName} numberOfLines={1}>
            {member.name}
          </Text>
          {statusText && (
            <Text
              style={[
                styles.statusText,
                isOnline ? styles.statusOnline : styles.statusOffline,
              ]}
              numberOfLines={1}>
              {statusText}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // 🔹 나만 있거나 아무도 없을 때 → 빈 상태 UI
  const isEmptyState = !members || members.length ===0;

  return (
    <Shadow
      distance={7} // 그림자 퍼짐 정도
      offset={[0, 0]} // x, y 오프셋
      startColor="rgba(0,0,0,0.1)"
      endColor="rgba(15, 23, 42, 0.01)" // 바깥쪽으로 갈수록 옅어지게
      radius={getResponsiveIconSize(10)} // 모서리 둥글기
      style={{
        position: 'relative',
        alignItems: 'center',
      }}>
      <View
        style={[
          styles.bodyContainer,
          {
            minWidth: '87%',
            paddingHorizontal: paddingH,
            // marginHorizontal: marginH,
            position: 'relative',
            // 🔽 여기 추가
            minHeight: screenHeight - getResponsiveHeight(470),
          },
        ]}>
        {/* 🔹 섹션 헤더 */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>우리 가족</Text>
            <Text style={styles.sectionSubtitle}>실시간 접속 상태</Text>
          </View>
          <TouchableOpacity
            onPress={onAddPress}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            style={{
              width: getResponsiveIconSize(25),
              height: getResponsiveIconSize(25),
            }}>
            <Image
              source={require('../../../assets/icons/add-contact.png')}
              style={{
                width: '100%',
                height: '100%',
                tintColor: '#787878',
              }}
            />
          </TouchableOpacity>
        </View>

        {/* 🔹 멤버 그리드 / 빈 상태 */}
        {isEmptyState ? (
          <View style={styles.emptyStateContainer}>
            {/* <Text style={styles.emptyTitle}>
            아직 가족 모임이 완성되지 않았어요
          </Text> */}
            <Text style={styles.emptyDesc}>
              {
                '아직 가족 모임이 완성되지 않았어요\n가족을 초대하여 가족 모임을 완성해보세요!'
              }
            </Text>
          </View>
        ) : (
          <View style={[styles.wrapRow, {width: innerContentWidth}]}>
            {members.map(renderUser)}
          </View>
        )}
      </View>
    </Shadow>
  );
}

const styles = StyleSheet.create({
  bodyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveIconSize(10),
    paddingTop: getResponsiveHeight(16),
    paddingBottom: getResponsiveHeight(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
    // paddingHorizontal: getResponsiveWidth(6),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    color: '#222222',
  },
  sectionSubtitle: {
    marginTop: getResponsiveHeight(2),
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: '#888888',
  },
  sectionAction: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#FFA726',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignSelf: 'center',
  },
  user: {
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: 999,
  },
  imageWrapper: {
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: getResponsiveWidth(8),
    width: AVATAR * 1.25,
    height: AVATAR * 1.25,
  },
  userImage: {
    borderRadius: 999,
  },
  userImageWithEmotion: {
    width: AVATAR,
    height: AVATAR,
    zIndex: 1,
  },
  userImageWithoutEmotion: {
    width: AVATAR * 1.3,
    height: AVATAR * 1.3,
  },
  emotionImage: {
    position: 'absolute',
    width: AVATAR * 1.5,
    height: AVATAR * 1.5,
    resizeMode: 'contain',
    zIndex: 0,
  },
  infoCol: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveHeight(2),
  },
  userName: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Medium',
    color: '#111111',
  },
  statusText: {
    marginTop: getResponsiveHeight(2),
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
  },
  statusOnline: {color: '#2CC22E'},
  statusOffline: {color: '#8C8C8C'},
  onlineDot: {
    position: 'absolute',
    top: 1,
    right: -2,
    width: DOT + 1,
    height: DOT + 1,
    borderRadius: DOT / 2,
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: '#2CC22E',
  },
  offlineDot: {
    position: 'absolute',
    top: 0,
    right: getResponsiveWidth(0),
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 1.5,
    borderColor: 'white',
    backgroundColor: '#D9D9D9',
  },

  // 🔹 빈 상태 UI
  emptyStateContainer: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: getResponsiveHeight(50),
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    marginBottom: getResponsiveHeight(4),
  },
  emptyDesc: {
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontFamily: EMPTY_STYLE.emptyFontFamily,
    color: EMPTY_STYLE.emptyColor,
    textAlign: 'center',
    marginBottom: getResponsiveHeight(10),
  },
  emptyButton: {
    marginTop: getResponsiveHeight(4),
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: 999,
    backgroundColor: '#FFE27A',
  },
  emptyButtonText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: '#6B4A00',
  },
});
