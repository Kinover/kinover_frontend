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

const AVATAR = getResponsiveIconSize(62);
const DOT = Math.max(10, Math.round(AVATAR * 0.28));

export default function MemberGridSection({
  members = [],
  onUserPress,
  onAddPress,
  onlineUserIds = [],
  lastActiveMap = {},
  chunkSize = 3,
}) {
  const {width: screenWidth} = useWindowDimensions();

  const marginH = getResponsiveWidth(25);
  const paddingH = getResponsiveWidth(16);
  const gapX = getResponsiveWidth(0);
  const gapY = getResponsiveHeight(15);

  const innerContentWidth = screenWidth - marginH * 2 - paddingH * 2;
  const itemWidth = (innerContentWidth - gapX * (chunkSize - 1)) / chunkSize;

  const renderUser = (member, index) => {
    const memberId = String(member.userId ?? member.id ?? member._id ?? index);
    const isOnline = onlineUserIds?.includes?.(member.userId);
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

  return (
    <View
      style={[
        styles.bodyContainer,
        {paddingHorizontal: paddingH, marginHorizontal: marginH},
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
          {/* <Text style={styles.sectionAction}>+ 가족 추가</Text> */}
          <Image
            source={require('../../../assets/icons/add-contact.png')}
            style={{
              width: '100%',
              height: '100%',
              tintColor: '#616161', // ← 회색으로 바뀜
            }}
          />
        </TouchableOpacity>
      </View>

      {/* 멤버 그리드 */}
      <View style={[styles.wrapRow, {width: innerContentWidth}]}>
        {members.map(renderUser)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveIconSize(10),
    paddingTop: getResponsiveHeight(16),
    paddingBottom: getResponsiveHeight(24),
    elevation: 2, // 🔹 그림자 약하게
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
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
    color: '#FFA726', // 🔹 조금 톤 다운된 포인트 컬러
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
});
