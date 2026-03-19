// 스켈레톤: 채팅방 목록 한 행 (아바타 + 제목/설명 영역)
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';

const SKELETON_BG = '#E5E7EB';

export default function SkeletonChatRoomItem() {
  const avatarSize = getResponsiveIconSize(50);
  return (
    <View style={[styles.container, {minHeight: getResponsiveHeight(70)}]}>
      <View style={[styles.avatar, {width: avatarSize, height: avatarSize}]} />
      <View style={styles.textArea}>
        <View style={styles.titleBar} />
        <View style={styles.descBar} />
      </View>
      <View style={styles.timeBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(13),
    overflow: 'hidden',
  },
  avatar: {
    borderRadius: 999,
    backgroundColor: SKELETON_BG,
  },
  textArea: {
    flex: 1,
    gap: getResponsiveHeight(6),
    justifyContent: 'center',
  },
  titleBar: {
    width: '60%',
    height: getResponsiveHeight(14),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
  },
  descBar: {
    width: '85%',
    height: getResponsiveHeight(12),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
  },
  timeBar: {
    width: getResponsiveWidth(36),
    height: getResponsiveHeight(10),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
  },
});
