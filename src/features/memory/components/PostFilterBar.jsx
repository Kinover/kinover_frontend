/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/components/PostFilterBar.jsx

import React, {useMemo, useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from 'utils/responsive';

import {BUTTON_STYLES, COLORS} from 'styles/style';

const {width: SCREEN_W} = Dimensions.get('window');
const FILTER_CONTROL_H = getResponsiveHeight(34);

const DEFAULT_SORT_OPTIONS = [
  {key: 'latest', title: '최신순'},
  {key: 'oldest', title: '오래된순'},
];

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const hashToHue = (text = '') => {
  const s = String(text).trim();
  if (!s) return 210;
  let hash = 0;
  for (const ch of s) {
    hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash % 360);
};

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

export default React.forwardRef(function PostFilterBar({
  categoryTitle = '전체',
  categoryOpen = false,
  onPressCategory,
  periodLabel,
  onPressDateFilter,
  sortKey = 'latest',
  onChangeSort,
  sortOptions = DEFAULT_SORT_OPTIONS,
}, ref) {
  const [sortModalOpen, setSortModalOpen] = useState(false);

  const sortBtnRef = useRef(null);
  const [sortAnchor, setSortAnchor] = useState({x: 0, y: 0, w: 0, h: 0});

  const isCategoryActive = !!categoryTitle && categoryTitle !== '전체';
  const isPeriodActive = !!periodLabel;
  const isSortActive = sortKey !== 'latest';

  const sortTitle = useMemo(() => {
    const found = (sortOptions || []).find(v => v.key === sortKey);
    return found?.title || '최신순';
  }, [sortKey, sortOptions]);

  const displayPeriodLabel = useMemo(() => {
    return periodLabel ? formatPeriodLabel(periodLabel) : '기간 선택';
  }, [periodLabel]);
  const categoryHue = useMemo(() => hashToHue(categoryTitle), [categoryTitle]);

  const closeSort = useCallback(() => setSortModalOpen(false), []);

  const pickSort = useCallback(
    key => {
      onChangeSort?.(key);
      setSortModalOpen(false);
    },
    [onChangeSort],
  );

  const openSort = useCallback(() => {
    const node = sortBtnRef.current;
    if (!node?.measureInWindow) {
      setSortModalOpen(true);
      return;
    }

    node.measureInWindow((x, y, w, h) => {
      setSortAnchor({x, y, w, h});
      setSortModalOpen(true);
    });
  }, []);

 // Dropdown position clamp
  const DROPDOWN_MIN_W = getResponsiveWidth(120);
  const dropdownWidth = Math.max(DROPDOWN_MIN_W, sortAnchor.w);
  const dropdownTop = sortAnchor.y + sortAnchor.h + getResponsiveHeight(6);

  const safeLeft = useMemo(() => {
    const margin = getResponsiveWidth(10);
    const maxLeft = SCREEN_W - dropdownWidth - margin;
    return clamp(sortAnchor.x, margin, maxLeft);
  }, [dropdownWidth, sortAnchor.x]);

 // caret rotate (sort open)
  const sortArrow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(sortArrow, {
      toValue: sortModalOpen ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [sortModalOpen, sortArrow]);

  const sortArrowStyle = useMemo(
    () => ({
      transform: [
        {
          rotate: sortArrow.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
        },
      ],
    }),
    [sortArrow],
  );

  const categoryArrow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(categoryArrow, {
      toValue: categoryOpen ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [categoryOpen, categoryArrow]);

  const categoryArrowStyle = useMemo(
    () => ({
      transform: [
        {
          rotate: categoryArrow.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
        },
      ],
    }),
    [categoryArrow],
  );

 // tone
  const ACTIVE_BORDER = BUTTON_STYLES().saveBg;
  const ACTIVE_BG = 'rgba(17,24,39,0.045)';
  const TEXT_MAIN = COLORS.textPrimary;
  const TEXT_SUB = COLORS.textTertiary;

  return (
    <>
      <View ref={ref} style={styles.container}>
        {/* Category: pill로 “통일”하지 말고, 드롭다운 트리거처럼 자연스럽게 */}
        <TouchableOpacity
          style={[
            styles.categoryButton,
            isCategoryActive && {
              borderColor: `hsla(${categoryHue}, 35%, 84%, 1)`,
              backgroundColor: `hsla(${categoryHue}, 36%, 97%, 1)`,
            },
          ]}
          onPress={onPressCategory}
          activeOpacity={0.75}>
          <View
            style={[
              styles.categoryDot,
              {
                backgroundColor: isCategoryActive
                  ? `hsla(${categoryHue}, 54%, 44%, 1)`
                  : COLORS.textTertiary,
              },
            ]}
          />
          <Text
            allowFontScaling={false}
            style={[
              styles.categoryText,
              isCategoryActive && styles.categoryTextActive,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {categoryTitle}
          </Text>
          <Animated.Image
            source={require('../../../assets/icons/down-arrow.png')}
              style={[
              styles.categoryCaret,
              {
                tintColor: isCategoryActive ? TEXT_MAIN : TEXT_SUB,
              },
              categoryArrowStyle,
            ]}
          />
        </TouchableOpacity>

        {/* Filters */}
        <View style={styles.rightControls}>
          {/* Period */}
          <TouchableOpacity
            style={[
              styles.pill,
              isPeriodActive && styles.pillActive,
              isPeriodActive && {borderColor: ACTIVE_BORDER, backgroundColor: ACTIVE_BG},
            ]}
            activeOpacity={0.75}
            onPress={onPressDateFilter}>
            <Image
              source={require('../../../assets/icons/calendar.png')}
              style={[
                styles.icon,
                {tintColor: isPeriodActive ? TEXT_MAIN : TEXT_SUB},
              ]}
            />
            <Text
              allowFontScaling={false}
              style={[
                styles.pillText,
                {color: isPeriodActive ? TEXT_MAIN : TEXT_SUB},
                isPeriodActive && styles.pillTextActive,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {displayPeriodLabel}
            </Text>
          </TouchableOpacity>

          {/* Sort */}
          <TouchableOpacity
            ref={sortBtnRef}
            style={[
              styles.pill,
              isSortActive && styles.pillActive,
              isSortActive && {borderColor: ACTIVE_BORDER, backgroundColor: ACTIVE_BG},
            ]}
            activeOpacity={0.75}
            onPress={openSort}>
            <Text
              allowFontScaling={false}
              style={[
                styles.pillText,
                {color: isSortActive ? TEXT_MAIN : TEXT_SUB},
                isSortActive && styles.pillTextActive,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {sortTitle}
            </Text>

            <Animated.Image
              source={require('../../../assets/icons/down-arrow.png')}
              style={[
                styles.caret,
                {tintColor: isSortActive ? TEXT_MAIN : TEXT_SUB},
                sortArrowStyle,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort dropdown */}
      <Modal
        visible={sortModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeSort}>
        <Pressable style={styles.modalBackdrop} onPress={closeSort} />

        <View
  style={[
    styles.dropdownWrap,
    {top: dropdownTop, left: safeLeft, width: dropdownWidth},
  ]}>
  {/* Android 전용: faux shadow backplate */}
  {Platform.OS === 'android' ? (
    <View pointerEvents="none" style={styles.dropdownShadowPlate} />
  ) : null}

  <View style={styles.dropdown}>
    {(sortOptions || []).map(opt => {
      const active = opt.key === sortKey;

      return (
        <TouchableOpacity
          key={opt.key}
          style={[styles.dropdownItem, active && styles.dropdownItemActive]}
          activeOpacity={0.75}
          onPress={() => pickSort(opt.key)}>
          <Text
            allowFontScaling={false}
            style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {opt.title}
          </Text>

          {active ? (
            <Image
              style={{
                tintColor: COLORS.iconPrimary,
                width: getResponsiveIconSize(9),
                height: getResponsiveIconSize(9),
                resizeMode: 'contain',
              }}
              source={require('../../../assets/icons/check-gray.png')}
            />
          ) : null}
        </TouchableOpacity>
      );
    })}
  </View>
</View>

      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveWidth(5),
    paddingTop: getResponsiveHeight(5),
    paddingBottom: getResponsiveHeight(5),
  },

 /* Category = 트리거 느낌 */
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(6),
    maxWidth: getResponsiveWidth(160),
    height: FILTER_CONTROL_H,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surfaceSecondary,
    paddingVertical: 0,
    paddingLeft: getResponsiveWidth(10),
    paddingRight: getResponsiveWidth(9),
  },
  categoryDot: {
    width: getResponsiveWidth(6),
    height: getResponsiveWidth(6),
    borderRadius: 99,
  },
  categoryText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
    lineHeight: getResponsiveHeight(17),
    color: COLORS.textTertiary,
  },
  categoryTextActive: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.textPrimary,
  },
  categoryCaret: {
    resizeMode: 'contain',
    width: getResponsiveWidth(14),
    height: getResponsiveWidth(14),
  },

  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },

 /* Filter pill = 가벼운 칩 */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(6),
    height: FILTER_CONTROL_H,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: 0,
    maxWidth: getResponsiveWidth(220),
  },

  pillText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
  },
  pillTextActive: {
    fontFamily: 'Pretendard-SemiBold',
  },
  pillActive: {
    shadowColor: COLORS.shadowBase,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  icon: {
    width: getResponsiveWidth(14),
    height: getResponsiveWidth(14),
  },

  caret: {
    resizeMode: 'contain',
    width: getResponsiveWidth(14),
    height: getResponsiveWidth(14),
  },

 /* Modal */
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },

  dropdownWrap: {
    position: 'absolute',
    zIndex: 999,
  },

  dropdown: {
    backgroundColor: COLORS.surfacePrimary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingVertical: getResponsiveHeight(6),
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowBase,
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 6},
      },
 // android: {
 // elevation: 10,
 // },
    }),
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(12),
  },

  dropdownItemActive: {
    backgroundColor: 'rgba(17,24,39,0.04)',
  },

  dropdownItemText: {
    flexShrink: 1,
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.iconSecondary,
  },

  dropdownItemTextActive: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.textPrimary,
  },

  dropdownShadowPlate: {
  position: 'absolute',
  top: getResponsiveHeight(2),              // 살짝 아래로 내려서 그림자 느낌
  left: getResponsiveWidth(1),              // 살짝 옆으로
  right: getResponsiveWidth(-1),            // 약간 더 크게(확장)
  bottom: getResponsiveHeight(-2),          // 약간 더 크게(확장)
  borderRadius: 14,
  backgroundColor: COLORS.shadowBase,
  opacity: 0.10,                            // 핵심: 너무 진하면 “검은 박스” 됨
},

  checkMark: {
    marginLeft: getResponsiveWidth(8),
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Bold',
    color: COLORS.textPrimary,
  },
});
