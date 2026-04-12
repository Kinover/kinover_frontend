/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/components/PostFilterBar.jsx

import React, {useMemo, useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';

import AppText from 'components/AppText';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from 'utils/responsive';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';

import {COLORS} from 'styles/style';

const {width: SCREEN_W} = Dimensions.get('window');
const FILTER_CONTROL_H = getResponsiveHeight(34);

const DEFAULT_SORT_OPTIONS = [
  {key: 'latest', title: '최신순'},
  {key: 'oldest', title: '오래된순'},
];

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

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

export default React.forwardRef(function PostFilterBar(
  {
    categoryTitle = '전체',
    categoryOpen = false,
    onPressCategory,
    periodLabel,
    onPressDateFilter,
    sortKey = 'latest',
    onChangeSort,
    sortOptions = DEFAULT_SORT_OPTIONS,
  },
  ref,
) {
  // fontMode가 바뀔 때 재계산 — StyleSheet.create()는 최초 1회 고정이라 사용 불가
  const fontStyles = useScaledStyleSheet(rf => ({
    categoryText: {fontSize: rf(12), lineHeight: rf(17)},
    pillText: {fontSize: rf(12)},
    dropdownItemText: {fontSize: rf(12)},
  }));

  const [sortModalOpen, setSortModalOpen] = useState(false);

  const sortBtnRef = useRef(null);
  const [sortAnchor, setSortAnchor] = useState({x: 0, y: 0, w: 0, h: 0});

  const isCategoryActive = !!categoryTitle && categoryTitle !== '전체';
  const isPeriodActive = !!periodLabel;

  const sortTitle = useMemo(() => {
    const found = (sortOptions || []).find(v => v.key === sortKey);
    return found?.title || '최신순';
  }, [sortKey, sortOptions]);

  const displayPeriodLabel = useMemo(() => {
    return periodLabel ? formatPeriodLabel(periodLabel) : '기간 선택';
  }, [periodLabel]);
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

  // tone — 흰색 배경 + 얇은 테두리로 회색 페이지 배경 위에서도 버튼이 뚜렷하게 보이도록
  const INACTIVE_BG = '#FFFFFF';
  const INACTIVE_BORDER = 'rgba(17,24,39,0.10)';
  const INACTIVE_TEXT = '#111827';
  const INACTIVE_ICON = '#6B7280';

  return (
    <>
      <View ref={ref} style={styles.container}>
        {/* Category: pill로 “통일”하지 말고, 드롭다운 트리거처럼 자연스럽게 */}
        <TouchableOpacity
          style={[
            styles.categoryButton,
            {
              backgroundColor: INACTIVE_BG,
              borderColor: INACTIVE_BORDER,
            },
          ]}
          onPress={onPressCategory}
          activeOpacity={0.75}>
          <View
            style={[
              styles.categoryDot,
              {
                backgroundColor: INACTIVE_ICON,
              },
            ]}
          />
          <AppText
            style={[
              styles.categoryText,
              fontStyles.categoryText,
              {color: INACTIVE_TEXT},
            ]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {categoryTitle}
          </AppText>
          <Animated.Image
            source={require('assets/icons/down-arrow.png')}
            style={[
              styles.categoryCaret,
              {
                tintColor: INACTIVE_ICON,
              },
              categoryArrowStyle,
            ]}
          />
          {isCategoryActive ? <View style={styles.activeDotBadge} /> : null}
        </TouchableOpacity>

        {/* Filters */}
        <View style={styles.rightControls}>
          {/* Period */}
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: INACTIVE_BG,
                borderColor: INACTIVE_BORDER,
              },
            ]}
            activeOpacity={0.75}
            onPress={onPressDateFilter}>
            <Image
              source={require('assets/icons/calendar.png')}
              style={[
                styles.icon,
                {
                  tintColor: INACTIVE_ICON,
                },
              ]}
            />
            <AppText
              style={[
                styles.pillText,
                fontStyles.pillText,
                {color: INACTIVE_TEXT},
              ]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {displayPeriodLabel}
            </AppText>
            {isPeriodActive ? <View style={styles.activeDotBadge} /> : null}
          </TouchableOpacity>

          {/* Sort */}
          <TouchableOpacity
            ref={sortBtnRef}
            style={[
              styles.pill,
              {
                backgroundColor: INACTIVE_BG,
                borderColor: INACTIVE_BORDER,
              },
            ]}
            activeOpacity={0.75}
            onPress={openSort}>
            <AppText
              style={[
                styles.pillText,
                fontStyles.pillText,
                {color: INACTIVE_TEXT},
              ]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {sortTitle}
            </AppText>

            <Animated.Image
              source={require('assets/icons/down-arrow.png')}
              style={[
                styles.caret,
                {tintColor: INACTIVE_ICON},
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
                  style={[
                    styles.dropdownItem,
                    active && styles.dropdownItemActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => pickSort(opt.key)}>
                  <AppText
                    style={[
                      styles.dropdownItemText,
                      fontStyles.dropdownItemText,
                      active && styles.dropdownItemTextActive,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {opt.title}
                  </AppText>

                  {active ? (
                    <Image
                      style={{
                        tintColor: COLORS.iconPrimary,
                        width: getResponsiveIconSize(9),
                        height: getResponsiveIconSize(9),
                        resizeMode: 'contain',
                      }}
                      source={require('assets/icons/check-gray.png')}
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
    // fontSize/lineHeight → fontStyles.categoryText (useScaledStyleSheet)
    fontFamily: 'Pretendard-Medium',
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
    // fontSize → fontStyles.pillText (useScaledStyleSheet)
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
    // fontSize → fontStyles.dropdownItemText (useScaledStyleSheet)
    flexShrink: 1,
    fontFamily: 'Pretendard-Medium',
    color: COLORS.iconSecondary,
  },

  dropdownItemTextActive: {
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.textPrimary,
  },

  dropdownShadowPlate: {
    position: 'absolute',
    top: getResponsiveHeight(2), // 살짝 아래로 내려서 그림자 느낌
    left: getResponsiveWidth(1), // 살짝 옆으로
    right: getResponsiveWidth(-1), // 약간 더 크게(확장)
    bottom: getResponsiveHeight(-2), // 약간 더 크게(확장)
    borderRadius: 14,
    backgroundColor: COLORS.shadowBase,
    opacity: 0.1, // 핵심: 너무 진하면 “검은 박스” 됨
  },

  checkMark: {
    marginLeft: getResponsiveWidth(8),
    fontFamily: 'Pretendard-Bold',
    color: COLORS.textPrimary,
  },
  activeDotBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
