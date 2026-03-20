/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/components/AlbumTabSelector.js

import React, {useEffect, useRef, useState, useCallback} from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {DEFAULT_STYLE, LAYOUT_STYLE} from 'styles/style';
import AppText from 'components/AppText';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

const TABS = [
  {key: 'feed', title: '피드'},
  {key: 'album', title: '앨범'},
];

const BASE_UNDERLINE_WIDTH = 40;

export default function AnimatedAlbumTabSelector({selected, onSelect}) {
  const styles = useScaledStyleSheet(rf => ({

  container: {
    backgroundColor: 'white',
    paddingBottom: getResponsiveHeight(15),
    paddingVertical: getResponsiveHeight(5),
    paddingHorizontal: LAYOUT_STYLE().screenPaddingHorizontal+3,
    paddingRight: getResponsiveWidth(18),
    height: getResponsiveHeight(50),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  tabRowContainer: {position: 'relative', flexShrink: 1},
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    position: 'relative',
  },

  tab: {marginRight: getResponsiveWidth(25), flexDirection: 'row'},
  tabText: {
    textAlign: 'center',
    fontSize: DEFAULT_STYLE().sectionTitle.fontSize,
    fontFamily: DEFAULT_STYLE().sectionTitle.fontFamily,
    color: 'gray',
    textAlignVertical: 'bottom',
  },
  selectedText: {
    color: '#111827',
    fontFamily: 'Pretendard-Bold',
  },

  underline: {
    height: 2,
    width: BASE_UNDERLINE_WIDTH + 6,
    backgroundColor: '#111827',
    position: 'absolute',
    bottom: -10,
    left: -3,
  },

  }));
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const [positions, setPositions] = useState({});

  const handleLayout = useCallback((key, event) => {
    const {x, width} = event.nativeEvent.layout;
    setPositions(prev => ({
      ...prev,
      [key]: {x, width},
    }));
  }, []);

  useEffect(() => {
    if (!positions?.[selected]) return;

    const {x, width} = positions[selected];

 // width가 0이면 애니메이션 계산이 깨질 수 있어서 가드
    if (!width || width <= 0) return;

    const targetTranslateX = x + width / 2 - BASE_UNDERLINE_WIDTH / 2;
    const targetScaleX = Math.max(width / BASE_UNDERLINE_WIDTH, 0.01);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: targetTranslateX,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleX, {
        toValue: targetScaleX,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected, positions, translateX, scaleX]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.tabRowContainer}>
          <View style={styles.tabRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => onSelect?.(tab.key)}
                style={styles.tab}
                activeOpacity={0.7}
                onLayout={e => handleLayout(tab.key, e)}>
                <AppText
                  style={[
                    styles.tabText,
                    selected === tab.key && styles.selectedText,
                  ]}>
                  {tab.title}
                </AppText>
              </TouchableOpacity>
            ))}

            <Animated.View
              pointerEvents="none"
              style={[
                styles.underline,
                {
                  transform: [{translateX}, {scaleX}],
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

