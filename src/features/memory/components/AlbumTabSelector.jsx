// src/screens/memory/components/AlbumTabSelector.js
import React, {useEffect, useRef, useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Image,
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

const BASE_UNDERLINE_WIDTH = 40;

// "2025.01.31 ~ 2025.02.01" → "25.01.31 ~ 25.02.01"
const formatPeriodLabel = raw => {
  if (!raw) return '';

  const formatDate = d => {
    const parts = (d || '').split('.');
    if (parts.length !== 3) return d;
    const [year, month, day] = parts;
    const yy = (year || '').slice(-2);
    return `${yy}.${month}.${day}`;
  };

  const segments = raw.split('~').map(s => s.trim());

  if (segments.length === 2) {
    return `${formatDate(segments[0])} ~ ${formatDate(segments[1])}`;
  }
  return formatDate(segments[0]);
};

export default function AnimatedAlbumTabSelector({
  selected,
  onSelect,
  onPressDateFilter,
  periodLabel,
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

  const displayLabel = useMemo(
    () => (periodLabel ? formatPeriodLabel(periodLabel) : '기간 선택'),
    [periodLabel],
  );
  const isActive = !!periodLabel;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* 탭 */}
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
              isActive && styles.filterButtonActive,
            ]}
            activeOpacity={0.7}
            onPress={onPressDateFilter}>
            <Image
              resizeMode="contain"
              style={[
                styles.calendarIcon,
                isActive && styles.calendarIconActive,
              ]}
              source={require('../../../assets/icons/calendar.png')}
            />
            <Text
              style={[
                styles.filterButtonText,
                isActive && styles.filterButtonTextActive,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {displayLabel}
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
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '600',
    color: '#4A4A4A',
    textAlignVertical: 'bottom',
  },
  selectedText: {
    color: '#111827',
    fontWeight: 'bold',
    fontFamily: 'Pretendard-Bold',
  },

  underline: {
    height: 2,
    width: BASE_UNDERLINE_WIDTH + 5,
    backgroundColor: '#111827',
    position: 'absolute',
    bottom: -11,
    left: 0,
  },

  // 기간 버튼
  filterButton: {
    maxWidth: getResponsiveWidth(220),
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: getResponsiveWidth(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  filterButtonText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: '#9CA3AF',
  },
  filterButtonTextActive: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  calendarIcon: {
    width: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
    tintColor: '#9CA3AF',
  },
  calendarIconActive: {
    tintColor: '#FFFFFF',
  },
});
