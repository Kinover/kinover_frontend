/* eslint-disable react-native/no-inline-styles */
// src/components/common/SlideSegment.jsx

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import {BOTTOMSHEET_STYLE} from 'styles/style';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

/**
 * SlideSegment (재사용 슬라이드 탭)
 *
 * props
 * - items: [{ key: string, label: string }]
 * - value: 현재 선택 key
 * - onChange: (key) => void
 * - containerStyle: 외부 컨테이너 스타일
 * - thumbStyle: thumb(슬라이드 바) 스타일 override
 * - tabStyle: 각 탭 스타일 override
 * - textStyle: 기본 텍스트 스타일 override
 * - activeTextStyle: 활성 텍스트 스타일 override
 * - padding: 내부 패딩(기본 SEG_PAD)
 * - gap: 탭 간격
 * - springConfig: Animated.spring 설정 오버라이드
 * - animateOnValueChange: 외부에서 value가 바뀔 때도 thumb를 따라가게 할지(기본 true)
 */
export default function SlideSegment({
  items = [],
  value,
  onChange,

  containerStyle,
  thumbStyle,
  tabStyle,
  textStyle,
  activeTextStyle,

  padding = getResponsiveHeight(4),
  gap = getResponsiveWidth(6),

  springConfig,
  animateOnValueChange = true,
}) {
  const styles = useScaledStyleSheet(rf => ({

  segment: {
    flexDirection: 'row',
    backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: getResponsiveHeight(4),
    bottom: getResponsiveHeight(4),
    borderRadius: 999,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.06)',
  },
  tab: {
    flex: 1,
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabText: {
    fontSize: rf(13),
    color: '#6B7280',
    fontFamily: 'Pretendard-Medium',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },

  }));
  const [segmentW, setSegmentW] = useState(0);
  const thumbX = useRef(new Animated.Value(0)).current;

  const count = items.length || 1;

  const tabW = useMemo(() => {
    if (!segmentW) return 0;
    return (segmentW - padding * 2) / count;
  }, [segmentW, padding, count]);

  const activeIndex = useMemo(() => {
    const idx = items.findIndex(v => v.key === value);
    return idx < 0 ? 0 : idx;
  }, [items, value]);

  const runMove = useCallback(
    idx => {
      if (!tabW) return;

      Animated.spring(thumbX, {
        toValue: tabW * idx,
        useNativeDriver: true,
        stiffness: 240,
        damping: 24,
        mass: 0.9,
        ...(springConfig || {}),
      }).start();
    },
    [tabW, thumbX, springConfig],
  );

 // 레이아웃 잡힌 뒤 처음 위치
  const onLayout = useCallback(
    e => {
      const w = e?.nativeEvent?.layout?.width ?? 0;
      if (!w) return;
      setSegmentW(w);
      requestAnimationFrame(() => runMove(activeIndex));
    },
    [runMove, activeIndex],
  );

 // 외부 value가 바뀌면 thumb도 따라가게
  useEffect(() => {
    if (!animateOnValueChange) return;
    if (!segmentW || !tabW) return;
    runMove(activeIndex);
  }, [animateOnValueChange, activeIndex, runMove, segmentW, tabW]);

  const computedThumbStyle = useMemo(() => {
    return [
      styles.thumb,
      {
        left: padding,
        width: tabW || `${100 / count}%`,
        transform: [{translateX: thumbX}],
      },
      thumbStyle,
    ];
  }, [padding, tabW, count, thumbX, thumbStyle]);

  const handlePress = useCallback(
    key => {
      if (key === value) return;
      onChange?.(key);
 // value 업데이트가 부모에서 일어나도, 체감상 바로 움직이는 게 좋음
      const idx = items.findIndex(v => v.key === key);
      runMove(idx < 0 ? 0 : idx);
    },
    [items, onChange, runMove, value],
  );

  return (
    <View
      style={[
        styles.segment,
        {padding, gap},
        containerStyle,
        items.length === 0 && {opacity: 0.6},
      ]}
      onLayout={onLayout}>
      <Animated.View pointerEvents="none" style={computedThumbStyle} />

      {items.map(it => {
        const active = it.key === value;
        return (
          <TouchableOpacity
            key={it.key}
            onPress={() => handlePress(it.key)}
            activeOpacity={0.85}
            style={[styles.tab, tabStyle]}>
            <AppText
              allowFontScaling={false}
              style={[
                styles.tabText,
                textStyle,
                active && styles.tabTextActive,
                active && activeTextStyle,
              ]}>
              {it.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

