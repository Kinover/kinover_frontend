import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
// import FastImage from 'react-native-fast-image';

export default function MemberGridSection({
  members = [],
  onUserPress,
  onAddPress,
  onlineUserIds = [], // ['4206584470', ...] (문자열 배열 권장)
  lastActiveMap = {}, // { '4206584470': null | '2025-08-28T16:08:03', ... }
  chunkSize = 3, // 한 줄에 몇 개
}) {
  const {width: screenWidth} = useWindowDimensions();

  const addButtonMember = {isAddButton: true};
  const membersWithAdd = [...members, addButtonMember];

  // 레이아웃 계산
  const marginH = getResponsiveWidth(25);
  const paddingH = getResponsiveWidth(16);
  const gapX = getResponsiveWidth(0);
  const gapY = getResponsiveHeight(26);
  const innerContentWidth = screenWidth - marginH * 2 - paddingH * 2;
  const itemWidth = (innerContentWidth - gapX * (chunkSize - 1)) / chunkSize;

  const getEmotionImage = emotion => {
    switch (emotion) {
      case 'ANNOYED':
        return require('../../../assets/state/1.png');
      case 'WORRIED':
        return require('../../../assets/state/2.png');
      case 'DEPRESSED':
        return require('../../../assets/state/3.png');
      case 'SORRY':
        return require('../../../assets/state/4.png');
      case 'TIRED':
        return require('../../../assets/state/5.png');
      case 'NEUTRAL':
        return require('../../../assets/state/6.png');
      case 'HAPPY':
        return require('../../../assets/state/7.png');
      case 'EXCITED':
        return require('../../../assets/state/8.png');
      default:
        return require('../../../assets/state/6.png');
    }
  };

  const renderUser = (member, index) => {
    if (member.isAddButton) return null;

    // ID 문자열 통일
    const memberId = String(member.userId ?? member.id ?? member._id);

    // 온라인 여부: onlineUserIds 또는 lastActiveMap 기준(null이면 온라인)
    const isOnlineByList = onlineUserIds?.includes?.(member.userId);
    const lastRaw = lastActiveMap?.[memberId]; // null | string | undefined
    const isOnline = isOnlineByList;

    // 상태 텍스트
    const statusText = isOnline
      ? '지금 접속중'
      : lastRaw
      ? `${formatRelativeKorean(lastRaw)} 접속`
      : null;

    const emotionImage = getEmotionImage(member.emotion);

    return (
      <TouchableOpacity
        key={memberId ?? index}
        style={[
          styles.user,
          {width: itemWidth, marginRight: gapX, marginBottom: gapY},
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
                : require('../../../assets/images/kino-blue.png') // 기본 아바타 이미지
            }
            style={styles.userImage}
          />
          {isOnline ? (
            <View style={styles.onlineDot} />
          ) : (
            <View style={styles.offlineDot} />
          )}
        </View>

        {/* 오른쪽: 이름 + 상태텍스트 (이미지 옆) */}
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
      {/* 한 컨테이너에 전부 렌더 → 좌→우로 채우고 줄바꿈 */}
      <View style={[styles.wrapRow, {width: innerContentWidth}]}>
        {membersWithAdd.map(renderUser)}
      </View>

      <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
        <Text style={styles.addButtonText}>가족 추가하기</Text>
      </TouchableOpacity>
    </View>
  );
}

/** '2025-08-28T16:08:03' → 'n분 전' 등 */
function formatRelativeKorean(isoLike) {
  const t = new Date(isoLike).getTime();
  if (Number.isNaN(t)) return '시간 정보 없음';
  let diff = Math.max(0, Math.floor((Date.now() - t) / 1000)); // sec

  if (diff < 5) return '방금 전';
  if (diff < 60) return `${diff}초 전`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d === 1) return '어제';
  if (d < 7) return `${d}일 전`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}주 전`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}개월 전`;
  const y = Math.floor(d / 365);
  return `${y}년 전`;
}

const AVATAR = getResponsiveIconSize(62);
const DOT = Math.max(10, Math.round(AVATAR * 0.28));

const styles = StyleSheet.create({
  bodyContainer: {
    backgroundColor: 'white',
    borderRadius: getResponsiveIconSize(10),
    paddingTop: getResponsiveHeight(25),
    paddingBottom: getResponsiveHeight(65),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignSelf: 'center',
  },

  /** 셀: 이미지(좌) + 텍스트(우) 배치 */
  user: {
    position: 'relative',
    flexDirection: 'column', // ← 이미지 옆에 텍스트
    alignItems: 'center',
    paddingTop: getResponsiveHeight(22.5),
    paddingBottom: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(8),
    borderRadius: getResponsiveIconSize(8),
  },

  imageWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveWidth(8),
  },
  userImage: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
  },
  emotionImage: {
    position: 'absolute',
    width: AVATAR * 1.6,
    height: AVATAR * 1.6,
    resizeMode: 'contain',
    top: -AVATAR * 0.6,
    zIndex: -1,
  },

  infoCol: {
    width: '100%', // ✅ 폭을 명확히 줘서 줄바꿈/센터 정렬이 먹도록
    alignItems: 'center', // ✅ 중앙 정렬
    justifyContent: 'center',
    gap: getResponsiveHeight(2),
  },
  userName: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-medium',
    color: 'black',
  },
  statusText: {
    marginTop: getResponsiveHeight(2),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
  },
  statusOnline: {color: '#2CC22E'},
  statusOffline: {color: '#8C8C8C'},

  onlineDot: {
    position: 'absolute',
    top: 0,
    right: getResponsiveWidth(0),
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
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
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: '#D9D9D9',
  },

  addButton: {
    position: 'absolute',
    left: getResponsiveWidth(15),
    right: getResponsiveWidth(15),
    bottom: getResponsiveHeight(15),
    height: getResponsiveHeight(50),
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveIconSize(10),
    justifyContent: 'center',
  },
  addButtonText: {
    alignSelf: 'center',
    color: 'white',
    fontFamily: 'Pretendard-Regular',
    fontWeight:'700',
    fontSize: getResponsiveFontSize(15),
    lineHeight:20,
  },
});
