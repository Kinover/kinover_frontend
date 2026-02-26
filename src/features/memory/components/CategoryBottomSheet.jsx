// src/screens/xxx/CategoryBottomSheetModal.js
/* eslint-disable react-native/no-inline-styles */

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
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
} from 'react-native';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';

import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import {BottomSheetButtons} from 'components/bottomSheet/BottomSheetButtons';
import {BOTTOMSHEET_STYLE, BUTTON_STYLES, COLORS} from 'styles/style';

import {useSelector} from 'react-redux';
import {FONT_MODE} from 'store/uiSlice';

/** 폰트모드별 UI 스케일(체감용) */
const getFontScaleLevel = fontMode => {
  if (fontMode === FONT_MODE.EXTRA_LARGE) return 'XL';
  if (fontMode === FONT_MODE.LARGE) return 'L';
  return 'N';
};

const MAX_VISIBLE_ITEMS_BASE = 8;

// "전체"도 id를 확실히 가짐
const ALL_CATEGORY = {id: 'ALL', title: '전체'};

// id 키 통일: id / categoryId 둘 다 지원
const getCatId = cat => {
  const v = cat?.id ?? cat?.categoryId ?? null;
  return v != null ? String(v) : null;
};

// 밖으로 내보낼 때는 항상 id를 박아줌(훅이 id 기반으로 안정적으로 비교 가능)
const normalizeCategory = cat => {
  if (!cat) return null;
  const id = getCatId(cat);
  const title = cat?.title ?? '전체';
  return {
    ...cat,
    id: id != null ? id : cat?.id,
    title,
  };
};

const UI = {
  bg: '#FFFFFF',
  panel: '#FFFFFF',
  card: '#FFFFFF',

  optionBg: '#F6F7FB',
  optionBgHover: '#F2F4F7',

  text: '#0B1220',
  sub: '#667085',
  muted: '#98A2B3',

  line: 'rgba(15, 23, 42, 0.10)',
  lineSoft: 'rgba(15, 23, 42, 0.06)',

  brand: '#FFC84D',
  brandDeep: '#FFB020',

  selectedBg: BUTTON_STYLES().saveBg,
  selectedText: '#FFFFFF',

  countBg: '#F2F4F7',
  countText: '#475467',
};

const shadow = Platform.select({});

const CategoryBottomSheetModal = forwardRef(
  (
    {categoryList = [], selectedCategory, onSelectCategory, guideListRef},
    ref,
  ) => {
    const modalRef = useRef(null);

    const [tempSelected, setTempSelected] = useState(selectedCategory);
    const isClosingRef = useRef(false);

    const fontMode = useSelector(state => state.ui.fontMode);
    const level = useMemo(() => getFontScaleLevel(fontMode), [fontMode]);

 // 폰트모드에 따른 레이아웃 계산
    const layout = useMemo(() => {
      const itemH =
        level === 'XL'
          ? getResponsiveHeight(60)
          : level === 'L'
          ? getResponsiveHeight(54)
          : getResponsiveHeight(48);

      const gap =
        level === 'XL'
          ? getResponsiveHeight(10)
          : level === 'L'
          ? getResponsiveHeight(9)
          : getResponsiveHeight(8);

      const maxVisible =
        level === 'XL' ? 7 : level === 'L' ? 7 : MAX_VISIBLE_ITEMS_BASE;

      const snap = level === 'XL' ? ['92%'] : level === 'L' ? ['84%'] : ['81%'];

      const listExtra =
        level === 'XL'
          ? getResponsiveHeight(18)
          : level === 'L'
          ? getResponsiveHeight(12)
          : getResponsiveHeight(8);

      return {
        ITEM_HEIGHT: itemH,
        GAP: gap,
        MAX_VISIBLE_ITEMS: maxVisible,
        snapPoints: snap,
        listExtra,
      };
    }, [level]);

 // 데이터 구성: [전체 + 카테고리들]
    const data = useMemo(
      () => [ALL_CATEGORY, ...(categoryList || [])],
      [categoryList],
    );

    const totalCount = useMemo(() => {
      return Array.isArray(categoryList) ? categoryList.length : 0;
    }, [categoryList]);

    const maxListHeight = useMemo(() => {
      const visible = Math.min(
        layout.MAX_VISIBLE_ITEMS,
        Math.max(1, data.length),
      );
      const base =
        layout.ITEM_HEIGHT * visible + layout.GAP * Math.max(0, visible - 1);

      return base + layout.listExtra;
    }, [data.length, layout]);

    useEffect(() => {
      setTempSelected(selectedCategory);
    }, [selectedCategory]);

    const sheetKey = useMemo(() => {
      const snapKey = (layout.snapPoints || []).join('|');
      return `category-${fontMode}-${snapKey}`;
    }, [fontMode, layout.snapPoints]);

    useImperativeHandle(ref, () => ({
      present: () => {
        isClosingRef.current = false;
        setTempSelected(selectedCategory);

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

    const isSameCategory = useCallback((a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;

      const aId = getCatId(a);
      const bId = getCatId(b);

      if (aId && bId) return aId === bId;

 // fallback
      return (a?.title ?? '') === (b?.title ?? '');
    }, []);

    const handlePressItem = useCallback(cat => {
      setTempSelected(cat);
    }, []);

    const handleCancel = useCallback(() => {
      setTempSelected(selectedCategory);
      closeSheet();
    }, [closeSheet, selectedCategory]);

 // Apply: 밖으로 나갈 때 normalize 해서 id를 박아줌
    const handleApply = useCallback(() => {
      const next = normalizeCategory(tempSelected || ALL_CATEGORY);
      onSelectCategory?.(next);
      closeSheet();
    }, [closeSheet, onSelectCategory, tempSelected]);

    const handleDismiss = useCallback(() => {
      setTempSelected(selectedCategory);
    }, [selectedCategory]);

    const isOnlyAll = data.length <= 1;

    return (
      <BottomSheetLayout
        modalRef={modalRef}
        snapPoints={layout.snapPoints}
        sheetKey={sheetKey}
        enableContentPanningGesture={false}
        keyboardBehavior="none"
        androidKeyboardInputMode="adjustNothing"
        closeOnPressOutside={true}
        onDismiss={handleDismiss}
        title="카테고리"
        subtitle="원하는 추억들만 모아봐요."
        useInternalScroll={false}>
        <SafeAreaView style={{flex: 1, backgroundColor: UI.bg}}>
          <View style={{flex: 1}}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text allowFontScaling={false} style={styles.headerTitle}>
                  목록
                </Text>
                <Text allowFontScaling={false} style={styles.countChipText}>
                  ({totalCount}개)
                </Text>
              </View>

              <View style={styles.pill}>
                <View style={styles.pillDot} />
                <Text allowFontScaling={false} style={styles.pillText}>
                  {tempSelected?.title ?? '전체'}
                </Text>
              </View>
            </View>

            {isOnlyAll ? (
              <View style={styles.emptyBox}>
                <Text allowFontScaling={false} style={styles.emptyTitle}>
                  카테고리가 없어요
                </Text>
                <Text allowFontScaling={false} style={styles.emptyDesc}>
                  지금은 ‘전체’로 보거나, 업로드할 때 새로 만들 수 있어요.
                </Text>
              </View>
            ) : (
              <View
                style={[styles.listViewport, {maxHeight: maxListHeight}]}
                ref={guideListRef}
                collapsable={false}>
                <ScrollView
                  bounces={false}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.scrollContent}>
                  {data.map((cat, index) => {
                    const isSelected = isSameCategory(cat, tempSelected);

 // key도 id/categoryId 둘 다 지원
                    const idKey = getCatId(cat);
                    const key = idKey != null ? idKey : `${cat.title}-${index}`;

                    return (
                      <TouchableOpacity
                        key={key}
                        activeOpacity={0.9}
                        onPress={() => handlePressItem(cat)}
                        style={[
                          styles.itemRow,
                          {height: layout.ITEM_HEIGHT},
                          index !== 0 && {marginTop: layout.GAP},
                          isSelected && styles.itemRowSelected,
                        ]}>
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.itemText,
                            level === 'XL' && {
                              fontSize: getResponsiveFontSize(16),
                            },
                            level === 'L' && {
                              fontSize: getResponsiveFontSize(15),
                            },
                            isSelected && styles.itemTextSelected,
                          ]}
                          numberOfLines={1}>
                          {cat.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.footerFixed}>
            <BottomSheetButtons
              onCancel={handleCancel}
              onSave={handleApply}
              saveLabel="적용하기"
              autoCloseOnSave={false}
            />
          </View>
        </SafeAreaView>
      </BottomSheetLayout>
    );
  },
);

CategoryBottomSheetModal.displayName = 'CategoryBottomSheetModal';
export default CategoryBottomSheetModal;

const styles = StyleSheet.create({
  panel: {
    backgroundColor: UI.panel,
    borderRadius: 18,
    padding: getResponsiveWidth(14),
    borderWidth: 1,
    borderColor: UI.lineSoft,
    ...shadow,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: BOTTOMSHEET_STYLE().sectionLabel.marginBottom,
    marginTop: BOTTOMSHEET_STYLE().sectionLabel.marginTop,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: getResponsiveWidth(4),
  },

  headerTitle: {
    fontSize: BOTTOMSHEET_STYLE().sectionLabel.fontSize,
    fontFamily: BOTTOMSHEET_STYLE().sectionLabel.fontFamily,
    color: BOTTOMSHEET_STYLE().sectionLabel.color,
    lineHeight: BOTTOMSHEET_STYLE().sectionLabel.fontSize,
  },

  countChipText: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.textTertiary,
    lineHeight: getResponsiveFontSize(12),
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(6),
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: UI.lineSoft,
  },
  pillDot: {
    width: getResponsiveWidth(6),
    height: getResponsiveWidth(6),
    borderRadius: 999,
    backgroundColor: UI.brandDeep,
  },
  pillText: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-SemiBold',
    color: UI.sub,
    letterSpacing: -0.2,
  },

  listViewport: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  scrollContent: {},

  itemRow: {
    paddingHorizontal: getResponsiveWidth(14),
    borderRadius: 14,
    backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
    borderWidth: 1,
    borderColor: UI.lineSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  itemRowSelected: {
    backgroundColor: UI.selectedBg,
    borderColor: 'rgba(17, 24, 39, 0.18)',
  },

  itemText: {
    flex: 1,
    paddingRight: getResponsiveWidth(10),
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(14)
        : getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Medium',
    color: UI.text,
    letterSpacing: -0.2,
  },

  itemTextSelected: {
    fontFamily: 'Pretendard-SemiBold',
    color: UI.selectedText,
  },

  emptyBox: {
    paddingVertical: getResponsiveHeight(16),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 16,
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.lineSoft,
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize(14.5),
    fontFamily: 'Pretendard-SemiBold',
    color: UI.text,
    letterSpacing: -0.2,
  },
  emptyDesc: {
    marginTop: getResponsiveHeight(6),
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: UI.sub,
    lineHeight: getResponsiveFontSize(18),
  },

  footerFixed: {
    paddingTop: getResponsiveHeight(10),
    paddingBottom: getResponsiveHeight(2),
  },
});
