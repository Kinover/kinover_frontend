/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/components/PostFilterBar.jsx

import React, {useCallback, useEffect, useMemo, memo, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  Modal,
  Pressable,
  BackHandler,
  Dimensions,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import SpringPressable from 'components/SpringPressable';

import AppText from 'components/AppText';
import {getResponsiveWidth, getResponsiveHeight} from 'utils/responsive';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {useColors, useIsDark} from 'hooks/useColors';
import {FONTS} from 'styles/typography';
import {hapticLight} from 'utils/haptic';

const PRESS_HIT_SLOP = {top: 10, bottom: 10, left: 2, right: 2};
const CHIP_ANIM_MS = 200;

const CHIP_MIN_H = getResponsiveHeight(36);
/** 정렬 트리거 최소 너비 (칩 스크롤 영역과 균형) */
const SORT_ANCHOR_W = getResponsiveWidth(80);
/** 정렬 드롭다운 최소 너비 (트리거보다 좁게만 말리지 않도록) */
const SORT_DROPDOWN_MIN_W = getResponsiveWidth(118);

// IDLE_CHIP_BG and SELECTED_CHIP_BG are now computed inside components via useColors()

const SORT_OPTIONS = [
  {key: 'latest', label: '최신순'},
  {key: 'oldest', label: '오래된순'},
];

const getCatId = cat => {
  const v = cat?.categoryId ?? cat?.id ?? null;
  return v != null ? String(v) : null;
};

const CategoryChip = memo(function CategoryChip({
  label,
  selected,
  onPress,
  onLongPress,
  chipLabelStyle,
  delayLongPress,
}) {
  const colors = useColors();
  const IDLE_CHIP_BG = colors.surfaceMuted;
  const SELECTED_CHIP_BG = colors.brandPrimary;

  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {duration: CHIP_ANIM_MS});
  }, [selected, progress]);

  const shellStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [IDLE_CHIP_BG, SELECTED_CHIP_BG],
    ),
  }));

  return (
    <SpringPressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      hitSlop={PRESS_HIT_SLOP}>
      <Animated.View style={[styles.chipShell, shellStyle]}>
        <AppText
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            chipLabelStyle,
            styles.chipTextBase,
            selected
              ? [styles.chipTextOn, {color: colors.textOnBrandPrimary}]
              : [styles.chipTextOff, {color: colors.textDefault}],
          ]}>
          {label}
        </AppText>
      </Animated.View>
    </SpringPressable>
  );
});

export default React.forwardRef(function PostFilterBar(
  {
    categoryList = [],
    selectedCategoryIds = null,
    onSelectCategory,
    onOpenCategoryMore,
    /** null | 'latest' | 'oldest' — null이면 목록 기본 순, UI는 최신순과 동일 라벨 */
    sortKey = null,
    onChangeSort,
  },
  ref,
) {
  const colors = useColors();
  const isDark = useIsDark();
  const chipFont = useScaledStyleSheet(rf => ({
    chipLabel: {fontSize: rf(14), lineHeight: rf(18)},
    sortLabel: {fontSize: rf(14), lineHeight: rf(18)},
    dropdownLabel: {fontSize: rf(14), lineHeight: rf(20)},
    moreEllipsis: {
      fontSize: rf(16),
      lineHeight: rf(20),
      letterSpacing: rf(1.5),
      fontFamily: FONTS.SEMI_BOLD,
      color: colors.textDefault,
    },
  }), [colors]);

  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({x: 0, y: 0, w: 0, h: 0});
  const sortTriggerRef = useRef(null);

  const safeCategories = useMemo(() => {
    if (!Array.isArray(categoryList)) return [];
    return categoryList
      .map(c => {
        const id = getCatId(c);
        if (!id) return null;
        const title = String(c?.title ?? '').trim() || '이름 없음';
        return {id, title};
      })
      .filter(Boolean);
  }, [categoryList]);

  /** 사용자 카테고리 3개 이상 + 더보기 핸들러 있을 때만 앞 2개 + ··· (나머지는 스크롤·시트) */
  const CATEGORY_ELLIPSIS_THRESHOLD = 3;
  const MAX_CHIPS_BEFORE_ELLIPSIS = 2;
  const needsCategoryEllipsis =
    safeCategories.length >= CATEGORY_ELLIPSIS_THRESHOLD && !!onOpenCategoryMore;
  const visibleCategories = needsCategoryEllipsis
    ? safeCategories.slice(0, MAX_CHIPS_BEFORE_ELLIPSIS)
    : safeCategories;
  const hasMoreCategories = needsCategoryEllipsis;

  const allSelected =
    selectedCategoryIds == null || selectedCategoryIds.length === 0;

  const selectedSet = useMemo(() => {
    if (!selectedCategoryIds?.length) return new Set();
    return new Set(selectedCategoryIds.map(String));
  }, [selectedCategoryIds]);

  const sortDisplayLabel = useMemo(() => {
    if (sortKey === 'oldest') return '오래된순';
    return '최신순';
  }, [sortKey]);

  const openSortMenu = useCallback(() => {
    hapticLight();
    requestAnimationFrame(() => {
      sortTriggerRef.current?.measureInWindow?.((x, y, w, h) => {
        setMenuAnchor({
          x,
          y,
          w: w > 0 ? w : SORT_ANCHOR_W,
          h: h > 0 ? h : CHIP_MIN_H,
        });
        setSortMenuOpen(true);
      });
    });
  }, []);

  const closeSortMenu = useCallback(() => setSortMenuOpen(false), []);

  useEffect(() => {
    if (!sortMenuOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSortMenu();
      return true;
    });
    return () => sub.remove();
  }, [sortMenuOpen, closeSortMenu]);

  const onPressAll = useCallback(() => {
    hapticLight();
    onSelectCategory?.(null);
  }, [onSelectCategory]);

  const onPressCategoryChip = useCallback(
    id => {
      hapticLight();
      const sid = String(id);
      const cur = (selectedCategoryIds || []).map(String);
      if (cur.length === 1 && cur[0] === sid) {
        onSelectCategory?.(null);
        return;
      }
      onSelectCategory?.([sid]);
    },
    [onSelectCategory, selectedCategoryIds],
  );

  const pickSort = useCallback(
    key => {
      hapticLight();
      onChangeSort?.(key);
      closeSortMenu();
    },
    [onChangeSort, closeSortMenu],
  );

  const onPressCategoryMoreChip = useCallback(() => {
    hapticLight();
    onOpenCategoryMore?.();
  }, [onOpenCategoryMore]);

  const scrollPadRight = getResponsiveWidth(8);
  const dropdownRightInset = Math.max(
    0,
    Dimensions.get('window').width - menuAnchor.x - menuAnchor.w,
  );
  const sortDropdownMinW = Math.max(
    SORT_DROPDOWN_MIN_W,
    menuAnchor.w > 0 ? menuAnchor.w : 0,
  );

  return (
    <View ref={ref} style={styles.container}>
      <View style={styles.rowRelative}>
        <View style={styles.chipScrollOuter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={[
              styles.chipScrollContent,
              {paddingRight: scrollPadRight},
            ]}
            keyboardShouldPersistTaps="handled">
            <CategoryChip
              label="전체"
              selected={allSelected}
              onPress={onPressAll}
              chipLabelStyle={chipFont.chipLabel}
            />

            {visibleCategories.map(({id, title}) => {
              const selected = !allSelected && selectedSet.has(id);
              return (
                <CategoryChip
                  key={id}
                  label={title}
                  selected={selected}
                  onPress={() => onPressCategoryChip(id)}
                  chipLabelStyle={chipFont.chipLabel}
                />
              );
            })}

            {hasMoreCategories ? (
              <SpringPressable
                onPress={onPressCategoryMoreChip}
                hitSlop={PRESS_HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel="카테고리 더보기">
                <View style={[styles.moreChipShell, {backgroundColor: colors.surfaceMuted}]}>
                  <AppText
                    allowFontScaling={false}
                    style={chipFont.moreEllipsis}
                    accessibilityElementsHidden>
                    {'\u00B7\u00B7\u00B7'}
                  </AppText>
                </View>
              </SpringPressable>
            ) : null}
          </ScrollView>
        </View>

        <View
          style={[styles.sortAnchor, {minWidth: SORT_ANCHOR_W}]}
          pointerEvents="box-none">
          <View style={styles.sortAnchorInner} pointerEvents="box-none">
            <View ref={sortTriggerRef} collapsable={false}>
              <SpringPressable
                onPress={openSortMenu}
                hitSlop={PRESS_HIT_SLOP}
                style={styles.sortTrigger}
                accessibilityRole="button"
                accessibilityLabel={`정렬 ${sortDisplayLabel}`}
                accessibilityState={{expanded: sortMenuOpen}}>
                <AppText
                  allowFontScaling={false}
                  numberOfLines={1}
                  style={[chipFont.sortLabel, styles.sortTriggerText, {color: colors.textDefault}]}>
                  {sortDisplayLabel}
                </AppText>
                <Image
                  source={require('assets/icons/down-arrow.png')}
                  style={[
                    styles.sortCaret,
                    {tintColor: colors.textSecondary},
                    sortMenuOpen && styles.sortCaretOpen,
                  ]}
                  resizeMode="contain"
                  accessibilityElementsHidden
                />
              </SpringPressable>
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={sortMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeSortMenu}
        statusBarTranslucent>
        <View style={styles.modalRoot} pointerEvents="box-none">
          <Pressable
            style={styles.modalBackdrop}
            onPress={closeSortMenu}
            accessibilityLabel="정렬 메뉴 닫기"
          />
          <View
            style={[
              styles.dropdownCard,
              {
                position: 'absolute',
                right: dropdownRightInset,
                top: menuAnchor.y + menuAnchor.h + getResponsiveHeight(6),
                minWidth: sortDropdownMinW,
                backgroundColor: colors.surfacePrimary,
              },
            ]}
            pointerEvents="box-none">
            {SORT_OPTIONS.map(opt => {
              const selected =
                opt.key === 'oldest'
                  ? sortKey === 'oldest'
                  : sortKey !== 'oldest';
              return (
                <SpringPressable
                  key={opt.key}
                  onPress={() => pickSort(opt.key)}
                  style={[
                    styles.dropdownRow,
                    selected && styles.dropdownRowSelected,
                  ]}
                  accessibilityRole="menuitem"
                  accessibilityState={{selected}}>
                  <AppText
                    allowFontScaling={false}
                    style={[
                      chipFont.dropdownLabel,
                      styles.dropdownRowText,
                      {color: colors.textDefault},
                      selected && [
                        styles.dropdownRowTextSelected,
                        {
                          color: isDark
                            ? colors.textStrong
                            : colors.textOnBrandPrimary,
                        },
                      ],
                    ]}>
                    {opt.label}
                  </AppText>
                </SpringPressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: getResponsiveWidth(5),
    paddingTop: getResponsiveHeight(3),
    paddingBottom: getResponsiveHeight(1),
  },
  rowRelative: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: CHIP_MIN_H + getResponsiveHeight(5),
  },
  chipScrollOuter: {
    flex: 1,
    minWidth: 0,
    marginRight: getResponsiveWidth(3),
  },
  chipScroll: {
    width: '100%',
  },
  chipScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(3),
  },
  chipShell: {
    minHeight: CHIP_MIN_H,
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 999,
    marginRight: getResponsiveWidth(12),
  },
  moreChipShell: {
    minHeight: CHIP_MIN_H,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 999,
    marginRight: getResponsiveWidth(12),
  },
  chipTextBase: {
    maxWidth: getResponsiveWidth(128),
  },
  chipTextOff: {
    fontFamily: FONTS.MEDIUM,
  },
  chipTextOn: {
    fontFamily: FONTS.SEMI_BOLD,
  },
  sortAnchor: {
    flexShrink: 0,
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  sortAnchorInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: getResponsiveWidth(6),
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: getResponsiveWidth(4),
    paddingVertical: getResponsiveHeight(3),
    paddingHorizontal: getResponsiveWidth(2),
  },
  sortTriggerText: {
    fontFamily: FONTS.MEDIUM,
    flexShrink: 1,
  },
  sortCaret: {
    width: getResponsiveWidth(14),
    height: getResponsiveWidth(14),
  },
  sortCaretOpen: {
    transform: [{rotate: '180deg'}],
  },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  dropdownCard: {
    borderRadius: getResponsiveWidth(10),
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(17,24,39,0.08)',
    paddingVertical: getResponsiveHeight(4),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {elevation: 6},
    }),
  },
  dropdownRow: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14),
  },
  dropdownRowSelected: {
    backgroundColor: 'rgba(255, 200, 77, 0.2)',
    marginHorizontal: getResponsiveWidth(8),
    borderRadius: getResponsiveWidth(8),
    overflow: 'hidden',
  },
  dropdownRowText: {
    fontFamily: FONTS.MEDIUM,
    textAlign: 'right',
  },
  dropdownRowTextSelected: {
    fontFamily: FONTS.SEMI_BOLD,
  },
});
