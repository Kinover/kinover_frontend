// src/screens/memory/components/AlbumTabSelector.js
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

const TABS = [
  {key: 'post', title: '게시글'},
  {key: 'album', title: '앨범'},
];

const BASE_UNDERLINE_WIDTH = 40; // 밑줄 기준 너비

export default function AnimatedAlbumTabSelector({
  selected,
  onSelect,
  onPressDateFilter, // 기간 버튼 콜백
  periodLabel,       // ✅ '2025.11.01 ~ 2025.11.30' 같은 텍스트 (옵션)
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const [positions, setPositions] = useState({});

  const handleLayout = (key, event) => {
    const {x, width} = event.nativeEvent.layout;
    setPositions(prev => ({
      ...prev,
      [key]: {x, width},
    }));
  };

  useEffect(() => {
    if (positions[selected]) {
      const {x, width} = positions[selected];
      const targetTranslateX = x + width / 2 - BASE_UNDERLINE_WIDTH / 2;
      const targetScaleX = width / BASE_UNDERLINE_WIDTH;

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
    }
  }, [selected, positions, translateX, scaleX]);

  // ✅ periodLabel 있으면 그걸 보여주고, 없으면 '기간' 유지
  const rightLabel = periodLabel || '기간';
  const isActive = !!periodLabel; // 기간 설정된 상태

  return (
    <View style={styles.container}>
      {/* 탭 + 기간 버튼 한 줄 */}
      <View style={styles.headerRow}>
        <View style={styles.tabRowContainer}>
          <View style={styles.tabRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => onSelect(tab.key)}
                style={styles.tab}
                activeOpacity={0.7}
                onLayout={e => handleLayout(tab.key, e)}>
                <Text
                  style={[
                    styles.tabText,
                    selected === tab.key && styles.selectedText,
                  ]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}

            <Animated.View
              style={[
                styles.underline,
                {
                  transform: [{translateX}, {scaleX}],
                },
              ]}
            />
          </View>
        </View>

        {/* 기간 버튼 */}
        {onPressDateFilter && (
          <TouchableOpacity
            style={[
              styles.filterButton,
            ]}
            activeOpacity={0.7}
            onPress={onPressDateFilter}>
            <Text
              style={[
                styles.filterButtonText,
                isActive && styles.filterButtonTextActive,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {rightLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingBottom: getResponsiveHeight(15),
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(5)
        : getResponsiveHeight(5),
    paddingHorizontal: getResponsiveWidth(23),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  tabRowContainer: {
    position: 'relative',
    flexShrink: 1,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    position: 'relative',
  },

  tab: {
    marginRight: getResponsiveWidth(25),
  },
  tabText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '600',
    color: '#4A4A4A',
    textAlignVertical: 'bottom',
  },
  selectedText: {
    color: 'black',
    fontWeight: 'bold',
    fontFamily: 'Pretendard-Bold',
  },

  underline: {
    height: 2,
    width: BASE_UNDERLINE_WIDTH + 5,
    backgroundColor: 'black',
    position: 'absolute',
    bottom: -11,
    left: 0,
  },

  filterButton: {
    maxWidth: getResponsiveWidth(200), // 날짜 길어질 수 있으니 최대폭 제한
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    borderColor: '#FFC84D',
    backgroundColor: '#FFF8E5',
  },
  filterButtonText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: '#4A4A4A',
  },
  filterButtonTextActive: {
    color: '#111827',
  },
});
