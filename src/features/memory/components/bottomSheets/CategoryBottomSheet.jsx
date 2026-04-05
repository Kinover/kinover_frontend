// src/features/memory/components/bottomSheets/CategoryBottomSheet.jsx
/* eslint-disable react-native/no-inline-styles */

import AppText from 'components/AppText';
import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';
import {
  BOTTOM_SHEET_EDITOR_COLORS,
  getBottomSheetEditorBottomSafe,
  getBottomSheetPrimarySaveButtonStyle,
} from 'components/bottomSheet/bottomSheetEditorSharedStyles';

import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import {useReduxFontMode} from 'hooks/useReduxFontMode';
import {FONT_MODE} from 'store/uiSlice';
import {hapticSuccess} from 'utils/haptic';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getFontScaleLevel = fontMode => {
  if (fontMode === FONT_MODE.EXTRA_LARGE) return 'XL';
  if (fontMode === FONT_MODE.LARGE) return 'L';
  return 'N';
};

const ALL_CATEGORY = {id: 'ALL', title: '전체'};

const getCatId = cat => {
  const v = cat?.id ?? cat?.categoryId ?? null;
  return v != null ? String(v) : null;
};

const normalizeIds = ids => {
  if (ids == null || !Array.isArray(ids) || ids.length === 0) return null;
  return ids.map(String);
};

const UI = {
  bg: BOTTOM_SHEET_EDITOR_COLORS.bg,
  navy: BOTTOM_SHEET_EDITOR_COLORS.navy,
  chipIdleBg: '#F1F5F9',
  chipIdleText: '#64748B',
  chipSelectedText: '#FFFFFF',
};

const CHIP_GAP = getResponsiveWidth(10);
const CHIP_RADIUS = 16;

const PRIMARY_SAVE_BTN_STYLE = getBottomSheetPrimarySaveButtonStyle(
  getResponsiveHeight,
  getResponsiveIconSize,
);

const SP = {
  titleToState: 8,
  stateToChips: 12,
  chipsToFooter: 24,
};

function CategoryChip({label, selected, onPress, padV, padH, fontSize, width}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected}}
      style={({pressed}) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipIdle,
        {paddingVertical: padV, paddingHorizontal: padH, width},
        pressed && {opacity: selected ? 0.92 : 0.85},
      ]}>
      <AppText
        allowFontScaling={false}
        numberOfLines={1}
        style={[
          styles.chipLabelBase,
          {fontSize},
          selected ? styles.chipLabelSelected : styles.chipLabelIdle,
        ]}>
        {label}
      </AppText>
      {selected && (
        <AppText
          allowFontScaling={false}
          style={[styles.chipCheck, {right: padH, fontSize}]}>
          ✓
        </AppText>
      )}
    </Pressable>
  );
}

const CategoryBottomSheetModal = forwardRef(
  (
    {
      categoryList = [],
      selectedCategoryIds,
      onSelectCategory,
      guideListRef,
      onDismiss,
    },
    ref,
  ) => {
    const modalRef = useRef(null);
    const insets = useSafeAreaInsets();

    const [tempIds, setTempIds] = useState(() =>
      normalizeIds(selectedCategoryIds),
    );
    const isClosingRef = useRef(false);

    const fontMode = useReduxFontMode();
    const level = useMemo(() => getFontScaleLevel(fontMode), [fontMode]);
    const {width: windowWidth, height: windowHeight} = useWindowDimensions();

    const bottomSafe = useMemo(
      () => getBottomSheetEditorBottomSafe(insets.bottom, getResponsiveHeight),
      [insets.bottom],
    );

    const layout = useMemo(() => {
      const chipPadV =
        level === 'XL'
          ? getResponsiveHeight(17)
          : level === 'L'
            ? getResponsiveHeight(16)
            : getResponsiveHeight(15);
      const chipPadH =
        level === 'XL'
          ? getResponsiveWidth(16)
          : level === 'L'
            ? getResponsiveWidth(16)
            : getResponsiveWidth(16);

      const chipFont =
        level === 'XL'
          ? getResponsiveFontSize(15)
          : level === 'L'
            ? getResponsiveFontSize(14.5)
            : getResponsiveFontSize(14);

      const chipLineHeight = chipPadV * 2 + chipFont;

      const listExtra = getResponsiveHeight(8);

      return {
        chipPadV,
        chipPadH,
        chipFont,
        chipLineHeight,
        listExtra,
      };
    }, [level]);

    const data = useMemo(
      () => [ALL_CATEGORY, ...(categoryList || [])],
      [categoryList],
    );

    const chipWidth = useMemo(() => {
      const containerPadH = getResponsiveWidth(20);
      const w = windowWidth > 0 ? windowWidth : 375;
      return Math.floor((w - containerPadH * 2 - CHIP_GAP) / 2);
    }, [windowWidth]);

    /** 칩 전체 높이(2열 랩) + 상한: 넘으면 이 높이로 고정 후 스크롤 */
    const chipArea = useMemo(() => {
      const cols = 2;
      const count = Math.max(1, data.length);
      const rows = Math.ceil(count / cols);
      const totalContentH =
        rows * layout.chipLineHeight +
        Math.max(0, rows - 1) * CHIP_GAP +
        layout.listExtra;

      const maxScrollCap = Math.min(
        Math.round(windowHeight * 0.42),
        getResponsiveHeight(340),
      );

      const viewportHeight = Math.min(totalContentH, maxScrollCap);
      const needsScroll = totalContentH > maxScrollCap + 0.5;

      return {
        viewportHeight,
        needsScroll,
        totalContentH,
      };
    }, [data.length, layout, windowHeight]);

    useEffect(() => {
      setTempIds(normalizeIds(selectedCategoryIds));
    }, [selectedCategoryIds]);

    const sheetKey = useMemo(
      () => `category-${fontMode}-${level}`,
      [fontMode, level],
    );

    const stateSubtitle = useMemo(() => {
      if (tempIds == null) {
        return '전체 선택됨';
      }
      if (tempIds.length === 1) {
        const id = tempIds[0];
        const found = (categoryList || []).find(
          c => getCatId(c) === String(id),
        );
        return found?.title ? `${found.title} 선택됨` : '1개 선택됨';
      }
      return `${tempIds.length}개 선택됨`;
    }, [tempIds, categoryList]);

    const headerAccessory = useMemo(
      () => (
        <View style={styles.headerStateWrap}>
          <AppText allowFontScaling={false} style={styles.headerStateText}>
            {stateSubtitle}
          </AppText>
        </View>
      ),
      [stateSubtitle],
    );

    useImperativeHandle(ref, () => ({
      present: () => {
        isClosingRef.current = false;
        setTempIds(normalizeIds(selectedCategoryIds));

        modalRef.current?.present?.();
        requestAnimationFrame(() => {
          modalRef.current?.snapToIndex?.(0);
        });
      },
      dismiss: () => {
        isClosingRef.current = true;
        modalRef.current?.dismiss?.();
      },
    }));

    const closeSheet = useCallback(() => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;
      modalRef.current?.dismiss?.();
      setTimeout(() => {
        isClosingRef.current = false;
      }, 280);
    }, []);

    useEffect(() => {
      const refObj = modalRef?.current;
      if (!refObj) return;
      requestAnimationFrame(() => {
        refObj.snapToIndex?.(0);
      });
    }, [fontMode, sheetKey]);

    const isAllSelected = tempIds == null;

    const handlePressAll = useCallback(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTempIds(null);
    }, []);

    const handlePressCategory = useCallback(cat => {
      const id = getCatId(cat);
      if (!id || id === 'ALL') return;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTempIds(prev => {
        if (prev == null) return [id];
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        const arr = [...next];
        return arr.length === 0 ? null : arr;
      });
    }, []);

    const handleApply = useCallback(() => {
      hapticSuccess();
      const payload = tempIds == null || tempIds.length === 0 ? null : [...tempIds];
      onSelectCategory?.(payload);
      closeSheet();
    }, [closeSheet, onSelectCategory, tempIds]);

    const handleDismiss = useCallback(() => {
      setTempIds(normalizeIds(selectedCategoryIds));
      onDismiss?.();
    }, [selectedCategoryIds, onDismiss]);

    return (
      <BottomSheetLayout
        modalRef={modalRef}
        enableDynamicSizing
        sheetKey={sheetKey}
        enableContentPanningGesture={false}
        keyboardBehavior="none"
        androidKeyboardInputMode="adjustNothing"
        closeOnPressOutside={true}
        onDismiss={handleDismiss}
        title="카테고리 선택"
        headerAccessory={headerAccessory}
        headerStyle={styles.headerGroup}
        useInternalScroll={false}
        disableContentBottomPadding={true}
        containerStyle={{paddingHorizontal: getResponsiveWidth(20)}}>
        <SafeAreaView edges={[]} style={{alignSelf: 'stretch', backgroundColor: UI.bg}}>
          <View style={styles.sheetBody}>
            <View style={styles.content}>
              <View
                style={[styles.chipViewport, {height: chipArea.viewportHeight}]}
                ref={guideListRef}
                collapsable={false}>
                <ScrollView
                  bounces={false}
                  scrollEnabled={chipArea.needsScroll}
                  showsVerticalScrollIndicator={chipArea.needsScroll}
                  nestedScrollEnabled
                  style={styles.chipScroll}
                  contentContainerStyle={styles.chipScrollContent}>
                  {data.map((cat, index) => {
                    const idKey = getCatId(cat);
                    const isAllRow = idKey === 'ALL';
                    const isSelected = isAllRow
                      ? isAllSelected
                      : !isAllSelected &&
                        tempIds != null &&
                        idKey != null &&
                        tempIds.includes(idKey);

                    const key =
                      idKey != null ? idKey : `${cat.title ?? 'c'}-${index}`;

                    return (
                      <CategoryChip
                        key={key}
                        label={cat.title}
                        selected={isSelected}
                        padV={layout.chipPadV}
                        padH={layout.chipPadH}
                        fontSize={layout.chipFont}
                        width={chipWidth}
                        onPress={() =>
                          isAllRow ? handlePressAll() : handlePressCategory(cat)
                        }
                      />
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={[styles.footerSticky, {paddingBottom: bottomSafe}]}>
              <TouchableOpacity
                onPress={handleApply}
                activeOpacity={0.88}
                style={styles.applyButton}>
                <AppText allowFontScaling={false} style={styles.applyLabel}>
                  적용하기
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </BottomSheetLayout>
    );
  },
);

CategoryBottomSheetModal.displayName = 'CategoryBottomSheetModal';
export default CategoryBottomSheetModal;

const styles = StyleSheet.create({
  headerGroup: {
    paddingBottom: 0,
  },
  headerStateWrap: {
    marginTop: getResponsiveHeight(SP.titleToState),
  },
  headerStateText: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#94A3B8',
    letterSpacing: -0.2,
    lineHeight: getResponsiveFontSize(18),
  },

  sheetBody: {
    flexGrow: 0,
    alignSelf: 'stretch',
  },
  content: {
    flexGrow: 0,
    minHeight: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },

  chipViewport: {
    alignSelf: 'stretch',
    marginTop: getResponsiveHeight(SP.stateToChips),
  },
  chipScroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  chipScrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: CHIP_GAP,
    paddingBottom: 0,
  },

  chip: {
    borderRadius: CHIP_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipIdle: {
    backgroundColor: UI.chipIdleBg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: UI.navy,
    borderWidth: 1,
    borderColor: UI.navy,
  },
  chipLabelBase: {
    letterSpacing: -0.2,
    textAlign: 'center',
    flexShrink: 1,
  },
  chipLabelIdle: {
    fontFamily: 'Pretendard-Medium',
    color: UI.chipIdleText,
  },
  chipLabelSelected: {
    fontFamily: 'Pretendard-SemiBold',
    color: UI.chipSelectedText,
  },
  chipCheck: {
    position: 'absolute',
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    includeFontPadding: false,
  },

  footerSticky: {
    backgroundColor: UI.bg,
    paddingTop: getResponsiveHeight(SP.chipsToFooter),
  },
  applyButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...PRIMARY_SAVE_BTN_STYLE,
  },
  applyLabel: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
