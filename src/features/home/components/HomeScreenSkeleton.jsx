import React from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';
import {BACKGROUND_COLORS} from 'styles/style';

const SKELETON_BG = '#E5E7EB';
const PADDING_TOP = Platform.OS === 'ios' ? '22%' : '13%';

export default function HomeScreenSkeleton() {
  return (
    <View style={styles.root}>
      <View style={styles.curve} />
      <View style={[styles.content, {paddingTop: PADDING_TOP}]}>
        <View style={styles.headerRing} />
        <View style={styles.moodPill} />
        <View style={styles.grid}>
          {[0, 1, 2, 3].map(i => (
            <View key={`m-${i}`} style={styles.memberCell}>
              <View style={styles.avatar} />
              <View style={styles.nameBar} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const AVATAR = getResponsiveIconSize(60);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BACKGROUND_COLORS.primaryBg,
    overflow: 'hidden',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(20),
  },
  curve: {
    position: 'absolute',
    bottom: '-28%',
    width: '220%',
    left: '-60%',
    height: '100%',
    backgroundColor: BACKGROUND_COLORS.secondaryBg,
    borderTopLeftRadius: getResponsiveWidth(600),
    borderTopRightRadius: getResponsiveWidth(600),
    zIndex: -1,
  },
  headerRing: {
    width: getResponsiveIconSize(148),
    height: getResponsiveIconSize(148),
    borderRadius: 999,
    backgroundColor: SKELETON_BG,
    marginBottom: getResponsiveHeight(16),
  },
  moodPill: {
    width: getResponsiveWidth(120),
    height: getResponsiveHeight(36),
    borderRadius: 999,
    backgroundColor: SKELETON_BG,
    marginBottom: getResponsiveHeight(28),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: getResponsiveWidth(340),
    justifyContent: 'space-between',
    rowGap: getResponsiveHeight(18),
  },
  memberCell: {
    width: '48%',
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: SKELETON_BG,
    marginBottom: getResponsiveHeight(8),
  },
  nameBar: {
    width: getResponsiveWidth(72),
    height: getResponsiveHeight(12),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
  },
});
