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
import {View, StyleSheet, Platform, TouchableOpacity} from 'react-native';
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
import BOTTOM_SHEET_TITLES, {
  BOTTOM_SHEET_BUTTON_LABELS,
} from 'constants/bottomSheetTitles';
import {hapticSuccess, hapticLight} from 'utils/haptic';

const SNAP_POINTS = ['50%'];

const ALL_CATEGORY = {id: 'ALL', title: '전체'};

const getCatId = cat => {
  const v = cat?.id ?? cat?.categoryId ?? null;
  return v != null ? String(v) : null;
};

const normalizeIds = ids => {
  if (ids == null || !Array.isArray(ids) || ids.length === 0) return null;
  return ids.map(String);
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
        paddingTop: getResponsiveHeight(8),
        paddingBottom: getResponsiveHeight(16),
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
        backgroundColor: '#111827',
      },
      chipText: {
        fontFamily: 'Pretendard-Medium',
        fontSize: rf(13.5),
        color: '#6B7280',
      },
      chipTextActive: {
        fontFamily: 'Pretendard-SemiBold',
        color: '#FFFFFF',
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
        snapPoints={SNAP_POINTS}
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
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
                <TouchableOpacity
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
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetScrollView>

        <BottomSheetFooterButtons
          bottomSafe={bottomSafe}
          includeBottomSafePadding
          onCancel={closeSheet}
          onSave={handleApply}
          cancelLabel={BOTTOM_SHEET_BUTTON_LABELS.CANCEL}
          saveLabel={BOTTOM_SHEET_BUTTON_LABELS.APPLY}
          showCancel
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
