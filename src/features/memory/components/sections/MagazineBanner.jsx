/* eslint-disable react-native/no-inline-styles */
// src/features/magazine/components/MagazineBanner.jsx

import React, {memo, useMemo, useCallback} from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import AppText from 'components/AppText';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {BACKGROUND_COLORS} from 'styles/style';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

const MagazineBanner = ({
  onPress,
  durationText = '1월 1주차',

 // title = '이번 주 가족 매거진이 발행되었어요!',
 // subtitle = '키노와 함께 추억을 떠올려 볼까요?',
  title,
  subtitle,
  style,
}) => {
  const navigation = useNavigation();
  const scheduleList = useSelector(state => state?.schedule?.scheduleList || []);
  const scheduleCountPerDay = useSelector(
    state => state?.schedule?.scheduleCountPerDay || {},
  );
  const notifications = useSelector(
    state => state?.notification?.notifications || [],
  );
  const lastCheckedAt = useSelector(state => state?.notification?.lastCheckedAt);

  const todayYMD = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    const d = `${now.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const toYMD = useCallback(dateLike => {
    if (!dateLike) return '';
    if (typeof dateLike === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateLike)) {
      return dateLike.slice(0, 10);
    }
    const dt = new Date(dateLike);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = `${dt.getMonth() + 1}`.padStart(2, '0');
    const d = `${dt.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const todayCount = useMemo(() => {
    const mapCount = Number(scheduleCountPerDay?.[todayYMD] || 0);
    if (mapCount > 0) return mapCount;

    const list = Array.isArray(scheduleList) ? scheduleList : [];
    return list.filter(item => toYMD(item?.date) === todayYMD).length;
  }, [scheduleCountPerDay, todayYMD, scheduleList, toYMD]);

  const hasNewScheduleAlert = useMemo(() => {
    const list = Array.isArray(notifications) ? notifications : [];
    const checkedTs = lastCheckedAt ? new Date(lastCheckedAt).getTime() : null;

    return list.some(n => {
      const type =
        String(n?.pushType || n?.notificationType || n?.type || '').toUpperCase();
      if (type !== 'SCHEDULE') return false;

      if (!checkedTs) return true;
      const createdTs = new Date(n?.createdAt).getTime();
      return Number.isFinite(createdTs) && createdTs > checkedTs;
    });
  }, [notifications, lastCheckedAt]);

  const bannerState = useMemo(() => {
    if (hasNewScheduleAlert) {
      return {
        title: title || '새로운 일정이 추가됐어요!',
        subtitle: subtitle || '클릭 시 일정 탭으로 이동합니다.',
        mode: 'schedule_new',
      };
    }

    if (todayCount > 0) {
      return {
        title: title || `오늘 일정 ${todayCount}개가 있어요`,
        subtitle: subtitle || '지금 확인하고 하루를 정리해볼까요?',
        mode: 'schedule_today',
      };
    }

    return {
      title: title || '오늘의 추억 한 줄 남겨볼까요?',
      subtitle: subtitle || '사진과 함께 오늘을 기록해보세요.',
      mode: 'memory_default',
    };
  }, [hasNewScheduleAlert, subtitle, title, todayCount]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }

    if (
      bannerState.mode === 'schedule_new' ||
      bannerState.mode === 'schedule_today'
    ) {
      navigation.navigate('일정');
      return;
    }

    navigation.navigate('이미지선택화면');
  }, [bannerState.mode, navigation, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({pressed}) => [
        styles.pressable,
        style,
        pressed ? {opacity: 0.95} : null,
      ]}>
      <View style={styles.container}>
        {/* 배경 그라데이션(배너 사진 느낌) */}
        <LinearGradient
          colors={['#F9D8C8', '#FBE7A1', '#DDE9DD']}
          locations={[0, 0.5, 1]}
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={styles.gradientBg}
        />

        {/* 은은한 하이라이트 레이어(부드러운 느낌) */}
        <View style={styles.softOverlay} />

        {/* 우측 상단 시간 */}
        {/* <View style={styles.badge}>
          <AppText style={styles.badgeText}>{durationText}</AppText>
        </View> */}

        {/* 텍스트 */}
        <View style={styles.textWrap}>
          <AppText numberOfLines={1} style={styles.title}>
            {bannerState.title}
          </AppText>
          <AppText numberOfLines={1} style={styles.subtitle}>
            {bannerState.subtitle}
          </AppText>
        </View>

        {/* 장식(필요하면 아이콘/이미지로 교체 가능) */}
        <AppText style={[styles.deco, styles.decoLeft]}> </AppText>
        <AppText style={[styles.deco, styles.decoRight]}> </AppText>
      </View>
    </Pressable>
  );
};

export default memo(MagazineBanner);

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    height: getResponsiveHeight(70),
    backgroundColor: BACKGROUND_COLORS().secondaryBg,
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

 /* 그라데이션 배경 */
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },

 /* 아주 은은한 흰빛 오버레이로 부드럽게 */
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
    lineHeight: getResponsiveFontSize(13),
  },
  subtitle: {
    fontFamily: 'Pretendard-Light',
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(10),
 // color: 'gray',
    color: 'black',
    lineHeight: getResponsiveFontSize(10),
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
