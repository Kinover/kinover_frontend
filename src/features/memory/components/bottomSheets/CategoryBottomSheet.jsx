// src/features/memory/components/bottomSheets/CategoryBottomSheet.jsx
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
import { View, StyleSheet, Platform } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {getBottomSheetEditorBottomSafe} from 'components/bottomSheet/bottomSheetEditorSharedStyles';

import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import BottomSheetFooterButtons from 'components/bottomSheet/BottomSheetFooterButtons';
import BOTTOM_SHEET_TITLES from 'constants/bottomSheetTitles';
import {hapticSuccess, hapticLight} from 'utils/haptic';
import {FONTS} from 'styles/typography';

const ALL_CATEGORY = {id: 'ALL', title: '전체'};

const getCatId = cat => {
  const v = cat?.id ?? cat?.categoryId ?? null;
  return v != null ? String(v) : null;
};

const normalizeIds = ids => {
  if (ids == null || !Array.isArray(ids) || ids.length === 0) return null;
  return ids.map(String);
};

/** 동일 선택인지 (정규화 후 비교) */
const selectionKey = ids => {
  const n = normalizeIds(ids);
  if (n == null) return '__ALL__';
  return [...n].sort().join('\u0001');
};

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
    const styles = useScaledStyleSheet(rf => ({
      scrollContent: {
        paddingTop: getResponsiveHeight(12),
        paddingBottom: getResponsiveHeight(12),
      },
      chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: getResponsiveHeight(10),
        columnGap: getResponsiveWidth(8),
      },
      chip: {
        paddingVertical: getResponsiveHeight(10),
        paddingHorizontal: getResponsiveWidth(18),
        borderRadius: 999,
        backgroundColor: '#F3F4F6',
      },
      chipActive: {
        backgroundColor: '#FFC84D',
      },
      chipText: {
        fontFamily: FONTS.MEDIUM,
        fontSize: rf(13.5),
        color: '#6B7280',
      },
      chipTextActive: {
        fontFamily: FONTS.SEMI_BOLD,
        color: '#111827',
      },
    }));

    const modalRef = useRef(null);
    const insets = useSafeAreaInsets();
    const isClosingRef = useRef(false);

    const [tempIds, setTempIds] = useState(() =>
      normalizeIds(selectedCategoryIds),
    );

    const bottomSafe = useMemo(
      () => getBottomSheetEditorBottomSafe(insets.bottom, getResponsiveHeight),
      [insets.bottom],
    );

    const data = useMemo(
      () => [ALL_CATEGORY, ...(categoryList || [])],
      [categoryList],
    );
    const categoryCount = data.length;
    const isLargeList = categoryCount >= 13;

    /**
     * getSheetSnapPointsByTier는 첫 스냅을 최소 45%로 올려버려( clamp ) 칩만 있을 때 시트가 과하게 큼.
     * 칩 개수에 맞춰 직접 지정.
     */
    const resolvedSnapPoints = useMemo(() => {
      if (isLargeList) return ['62%'];
      if (categoryCount <= 4) return ['32%'];
      if (categoryCount <= 8) return ['40%'];
      return ['48%'];
    }, [categoryCount, isLargeList]);

    const hasSelectionChange = useMemo(
      () => selectionKey(tempIds) !== selectionKey(selectedCategoryIds),
      [tempIds, selectedCategoryIds],
    );

    const scrollAreaStyle = useMemo(
      () =>
        isLargeList
          ? {maxHeight: getResponsiveHeight(320), alignSelf: 'stretch'}
          : {maxHeight: undefined, flexGrow: 0, alignSelf: 'stretch'},
      [isLargeList],
    );

    useEffect(() => {
      setTempIds(normalizeIds(selectedCategoryIds));
    }, [selectedCategoryIds]);

    useImperativeHandle(ref, () => ({
      present: () => {
        isClosingRef.current = false;
        setTempIds(normalizeIds(selectedCategoryIds));
        setTimeout(() => modalRef.current?.present?.(), 0);
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

    const isAllSelected = tempIds == null;

    const handlePressAll = useCallback(() => {
      hapticLight();
      setTempIds(null);
    }, []);

    const handlePressCategory = useCallback(cat => {
      hapticLight();
      const id = getCatId(cat);
      if (!id || id === 'ALL') return;
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
      const payload =
        tempIds == null || tempIds.length === 0 ? null : [...tempIds];
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
        snapPoints={resolvedSnapPoints}
        enableContentPanningGesture={true}
        keyboardBehavior="none"
        androidKeyboardInputMode="adjustNothing"
        closeOnPressOutside
        onDismiss={handleDismiss}
        title={BOTTOM_SHEET_TITLES.CATEGORY_SELECT}
        headerCentered
        useInternalScroll={false}
        disableContentBottomPadding
        containerStyle={{paddingHorizontal: getResponsiveWidth(20)}}>

        <BottomSheetScrollView
          style={scrollAreaStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            !isLargeList ? {flexGrow: 0} : null,
          ]}>
          <View
            ref={guideListRef}
            collapsable={false}
            style={styles.chipWrap}>
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
                <SpringPressable
                  key={key}
                  activeOpacity={0.75}
                  onPress={() =>
                    isAllRow ? handlePressAll() : handlePressCategory(cat)
                  }
                  style={[styles.chip, isSelected && styles.chipActive]}>
                  <AppText
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextActive,
                    ]}>
                    {cat.title}
                  </AppText>
                </SpringPressable>
              );
            })}
          </View>
        </BottomSheetScrollView>

        <BottomSheetFooterButtons
          bottomSafe={bottomSafe}
          includeBottomSafePadding
          onSave={handleApply}
          saveLabel="선택하기"
          saveDisabled={!hasSelectionChange}
          autoCloseOnSave={false}
          buttonRowStyle={{marginTop: 0}}
          style={[
            Platform.OS === 'android' && {
              paddingBottom: getResponsiveHeight(12),
            },
          ]}
        />
      </BottomSheetLayout>
    );
  },
);

CategoryBottomSheetModal.displayName = 'CategoryBottomSheetModal';
export default CategoryBottomSheetModal;
