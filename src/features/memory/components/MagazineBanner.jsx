/* eslint-disable react-native/no-inline-styles */
// src/features/magazine/components/MagazineBanner.jsx

import React, {memo} from 'react';
import {Pressable, View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {BACKGROUND_COLORS} from 'styles/style';

const MagazineBanner = ({
  onPress,
  durationText = '1월 1주차',

  // title = '이번 주 가족 매거진이 발행되었어요!',
  // subtitle = '키노와 함께 추억을 떠올려 볼까요?',
  title = '새로운 일정이 추가됐어요!',
  subtitle = '클릭시 새로운 일정으로 이동합니다.',
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({pressed}) => [
        styles.pressable,
        style,
        pressed && onPress ? {opacity: 0.95} : null,
      ]}>
      <View style={styles.container}>
        {/* ✅ 배경 그라데이션(배너 사진 느낌) */}
        <LinearGradient
          colors={['#F9D8C8', '#FBE7A1', '#DDE9DD']}
          locations={[0, 0.5, 1]}
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={styles.gradientBg}
        />

        {/* ✅ 은은한 하이라이트 레이어(부드러운 느낌) */}
        <View style={styles.softOverlay} />

        {/* 우측 상단 시간 */}
        {/* <View style={styles.badge}>
          <Text style={styles.badgeText}>{durationText}</Text>
        </View> */}

        {/* 텍스트 */}
        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>

        {/* 장식(필요하면 아이콘/이미지로 교체 가능) */}
        <Text style={[styles.deco, styles.decoLeft]}> </Text>
        <Text style={[styles.deco, styles.decoRight]}> </Text>
      </View>
    </Pressable>
  );
};

export default memo(MagazineBanner);

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    height: getResponsiveHeight(70),
    backgroundColor: BACKGROUND_COLORS.secondaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '90%',
    borderRadius: getResponsiveWidth(10),
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(16),
    backgroundColor: '#F3E8E4',
  },

  /* ✅ 그라데이션 배경 */
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },

  /* ✅ 아주 은은한 흰빛 오버레이로 부드럽게 */
  softOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  textWrap: {
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(40),
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13),
    paddingTop: getResponsiveHeight(5),
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 13,
  },
  subtitle: {
    fontFamily: 'Pretendard-Light',
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(10),
    // color: 'gray',
    color: 'black',
    lineHeight: 11,
  },

  badge: {
    position: 'absolute',
    top: getResponsiveHeight(5),
    right: getResponsiveWidth(6),
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999,
    paddingHorizontal: getResponsiveWidth(8),
    paddingVertical: getResponsiveHeight(4),
  },
  badgeText: {
    fontSize: getResponsiveFontSize(9),
    fontWeight: '600',
    // color: '#111827',
    color: 'white',
  },

  deco: {
    position: 'absolute',
    fontSize: getResponsiveFontSize(42),
    opacity: 0.22,
  },
  decoLeft: {
    left: getResponsiveWidth(10),
    top: getResponsiveHeight(10),
  },
  decoRight: {
    right: getResponsiveWidth(10),
    bottom: getResponsiveHeight(6),
  },
});
