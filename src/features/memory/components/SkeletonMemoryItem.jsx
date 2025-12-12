// src/screens/memory/components/SkeletonMemoryItem.js
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';

const AVATAR_RADIUS = getResponsiveWidth(8);
const CARD_RADIUS = getResponsiveIconSize(10);

export default function SkeletonMemoryItem() {
  return (
    <View style={styles.card}>
      {/* 날짜 + 뱃지 영역 */}
      <View style={styles.topRow}>
        <View style={styles.date} />
        <View style={styles.badgeRow}>
          <View style={styles.badge} />
          <View style={[styles.badge, styles.badgeShort]} />
        </View>
      </View>

      {/* 대표 이미지 자리 */}
      <View style={styles.image} />

      {/* 카테고리 */}
      <View style={styles.category} />

      {/* 내용 두 줄 */}
      <View style={styles.text1} />
      <View style={styles.text2} />
    </View>
  );
}

const SKELETON_BG = '#E5E7EB';
const CARD_BG = '#FFFFFF';

const styles = StyleSheet.create({
  card: {
    width: '94%',
    alignSelf: 'center',
    backgroundColor: CARD_BG,
    borderRadius: CARD_RADIUS,
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(16),
    marginVertical: getResponsiveHeight(8),
    overflow: 'hidden',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(8),
  },
  date: {
    width: getResponsiveWidth(70),
    height: getResponsiveHeight(12),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: getResponsiveWidth(6),
  },
  badge: {
    width: getResponsiveWidth(68),
    height: getResponsiveHeight(18),
    borderRadius: 999,
    backgroundColor: SKELETON_BG,
  },
  badgeShort: {
    width: getResponsiveWidth(58),
  },

  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: AVATAR_RADIUS,
    backgroundColor: SKELETON_BG,
    marginBottom: getResponsiveHeight(10),
  },

  category: {
    width: getResponsiveWidth(80),
    height: getResponsiveHeight(16),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
    marginBottom: getResponsiveHeight(6),
  },
  text1: {
    width: '72%',
    height: getResponsiveHeight(14),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
    marginBottom: getResponsiveHeight(4),
  },
  text2: {
    width: '52%',
    height: getResponsiveHeight(14),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
  },
});
