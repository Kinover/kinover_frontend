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
  getResponsiveIconSize,
} from '../../../utils/responsive';

import BottomSheetLayout from 'components/BottomSheetLayout';
import {BottomSheetButtons} from 'components/BottomSheetButtons';
import {BUTTON_STYLES} from 'styles/style';

import {useSelector} from 'react-redux';
import {FONT_MODE} from '../../../store/uiSlice';

/** ✅ 폰트모드별 UI 스케일(체감용) */
const getFontScaleLevel = fontMode => {
  if (fontMode === FONT_MODE.EXTRA_LARGE) return 'XL';
  if (fontMode === FONT_MODE.LARGE) return 'L';
  return 'N';
};

const MAX_VISIBLE_ITEMS_BASE = 7;

const ALL_CATEGORY = {id: 'ALL', title: '전체'};

const UI = {
  bg: '#FFFFFF',
  panel: '#F6F7FB',
  card: '#FFFFFF',

  text: '#0B1220',
  sub: '#667085',
  muted: '#98A2B3',

  line: 'rgba(15, 23, 42, 0.08)',
  lineSoft: 'rgba(15, 23, 42, 0.06)',

  brand: '#FFC84D',
  brandDeep: '#FFB020',

  selectedBg: BUTTON_STYLES().saveBg,
  selectedText: '#FFFFFF',
};

const shadow = Platform.select({});

const CategoryBottomSheetModal = forwardRef(
  ({categoryList = [], selectedCategory, onSelectCategory}, ref) => {
    const modalRef = useRef(null);

    const [tempSelected, setTempSelected] = useState(selectedCategory);
    const isClosingRef = useRef(false);

    // ✅ fontMode 구독
    const fontMode = useSelector(state => state.ui.fontMode);
    const level = useMemo(() => getFontScaleLevel(fontMode), [fontMode]);

    /** ✅ 폰트모드별 레이아웃 파라미터(핵심) */
    const layout = useMemo(() => {
      // rowHeight: 폰트 커질수록 늘려서 잘림 방지
      const itemH =
        level === 'XL'
          ? getResponsiveHeight(60)
          : level === 'L'
          ? getResponsiveHeight(54)
          : getResponsiveHeight(48);

      // row 간격도 조금 늘려야 답답함이 줄어듦
      const gap =
        level === 'XL'
          ? getResponsiveHeight(10)
          : level === 'L'
          ? getResponsiveHeight(9)
          : getResponsiveHeight(8);

      // 보이는 개수: 폰트 커질수록 한 화면에 덜 보여주는 게 자연스러움
      const maxVisible =
        level === 'XL'
          ? 6
          : level === 'L'
          ? 6
          : MAX_VISIBLE_ITEMS_BASE;

      // 바텀시트 높이: 폰트 커질수록 여유를 더 줌
      const snap =
        level === 'XL'
          ? ['90%']
          : level === 'L'
          ? ['82%']
          : ['78%'];

      // 리스트 하단 여유(버튼/패딩 체감)
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

    const data = useMemo(
      () => [ALL_CATEGORY, ...(categoryList || [])],
      [categoryList],
    );

    const maxListHeight = useMemo(() => {
      const visible = Math.min(layout.MAX_VISIBLE_ITEMS, Math.max(1, data.length));
      // ✅ row height + gap 고려
      const base =
        layout.ITEM_HEIGHT * visible + layout.GAP * Math.max(0, visible - 1);

      return base + layout.listExtra;
    }, [data.length, layout]);

    useEffect(() => {
      setTempSelected(selectedCategory);
    }, [selectedCategory]);

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

    const isSameCategory = useCallback((a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      if (a.id != null && b.id != null) return String(a.id) === String(b.id);
      return a.title === b.title;
    }, []);

    const handlePressItem = useCallback(cat => {
      setTempSelected(cat);
    }, []);

    const handleCancel = useCallback(() => {
      setTempSelected(selectedCategory);
      closeSheet();
    }, [closeSheet, selectedCategory]);

    const handleApply = useCallback(() => {
      onSelectCategory?.(tempSelected || ALL_CATEGORY);
      closeSheet();
    }, [closeSheet, onSelectCategory, tempSelected]);

    const handleDismiss = useCallback(() => {
      setTempSelected(selectedCategory);
    }, [selectedCategory]);

    const isOnlyAll = data.length <= 1;

    return (
      <BottomSheetLayout
        modalRef={modalRef}
        // ✅ 폰트모드(N/L/XL)별 snapPoints 반영
        snapPoints={layout.snapPoints}
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
            {/* ✅ 카드(패널) */}
            <View style={styles.panel}>
              <View style={styles.headerRow}>
                <Text allowFontScaling={false} style={styles.headerTitle}>
                  목록
                </Text>

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
                <View style={[styles.listViewport, {maxHeight: maxListHeight}]}>
                  <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}>
                    {data.map((cat, index) => {
                      const isSelected = isSameCategory(cat, tempSelected);
                      const key =
                        cat.id != null ? String(cat.id) : `${cat.title}-${index}`;

                      return (
                        <TouchableOpacity
                          key={key}
                          activeOpacity={0.88}
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
                              // ✅ XL일수록 폰트 살짝 올리고, 라인 높이도 확보
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

                          {isSelected ? (
                            <View style={styles.selectedMark} />
                          ) : (
                            <View style={styles.checkPlaceholder} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* ✅ footer 고정 */}
            <View style={styles.footerFixed}>
              <BottomSheetButtons
                onCancel={handleCancel}
                onSave={handleApply}
                saveLabel="적용하기"
                autoCloseOnSave={false}
              />
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
    marginBottom: getResponsiveHeight(12),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: UI.text,
    letterSpacing: -0.2,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(6),
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: 999,
    backgroundColor: UI.card,
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

  scrollContent: {
    paddingBottom: getResponsiveHeight(2),
  },

  itemRow: {
    paddingHorizontal: getResponsiveWidth(14),
    borderRadius: 14,

    backgroundColor: UI.card,
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

  selectedMark: {
    width: getResponsiveIconSize(13),
    height: getResponsiveIconSize(13),
    borderRadius: 999,
    backgroundColor: UI.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkPlaceholder: {
    width: getResponsiveIconSize(26),
    height: getResponsiveIconSize(26),
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
