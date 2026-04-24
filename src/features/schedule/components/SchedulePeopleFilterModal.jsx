import React, {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {View, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {useReduxFontMode} from 'hooks/useReduxFontMode';
import {getSheetSnapPointsByTier} from 'utils/layoutMetrics';

import AppText from 'components/AppText';
import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import BottomSheetFooterButtons from 'components/bottomSheet/BottomSheetFooterButtons';
import BOTTOM_SHEET_TITLES from 'constants/bottomSheetTitles';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {hapticLight} from 'utils/haptic';
import {getBottomSheetEditorBottomSafe} from 'components/bottomSheet/bottomSheetEditorSharedStyles';
import {FONTS} from 'styles/typography';

function uniqStrings(ids) {
  const seen = new Set();
  const out = [];
  (ids || []).forEach(x => {
    const s = String(x);
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  });
  return out;
}

export default function SchedulePeopleFilterModal({
  visible,
  onClose,
  onApply,
  familyUserList = [],
  currentUserId,
  selectedUserIds = [],
}) {
  const styles = useScaledStyleSheet(rf => ({
    scrollContent: {
      paddingTop: getResponsiveHeight(22),
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
    empty: {
      textAlign: 'center',
      fontFamily: FONTS.REGULAR,
      fontSize: rf(13),
      color: '#9CA3AF',
      paddingVertical: getResponsiveHeight(24),
    },
  }));

  const modalRef = useRef(null);
  const fontMode = useReduxFontMode();
  const insets = useSafeAreaInsets();
  const bottomSafe = useMemo(
    () => getBottomSheetEditorBottomSafe(insets.bottom, getResponsiveHeight),
    [insets.bottom],
  );

  const [draft, setDraft] = useState([]);

  useEffect(() => {
    if (visible) {
      setDraft(uniqStrings(selectedUserIds));
    }
  }, [visible, selectedUserIds]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => modalRef.current?.present?.(), 0);
    } else {
      modalRef.current?.dismiss?.();
    }
  }, [visible]);

  const members = useMemo(() => {
    const rows = [];
    (familyUserList || []).forEach(u => {
      const id = u?.userId ?? u?.id;
      if (id == null) return;
      rows.push({
        id: String(id),
        label: String(u?.nickname ?? u?.name ?? '가족').trim() || '가족',
      });
    });
    return rows;
  }, [familyUserList]);

  const toggleId = useCallback(id => {
    setDraft(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const handleApply = useCallback(() => {
    hapticLight();
    onApply?.(uniqStrings(draft));
    onClose?.();
  }, [draft, onApply, onClose]);

  const meId =
    currentUserId != null && String(currentUserId).trim() !== ''
      ? String(currentUserId)
      : null;

  const isAllView = draft.length === 0;
  const isOnlyMe = meId != null && draft.length === 1 && draft[0] === meId;

  // 전체 · 나만 + 개별 멤버를 하나의 칩 목록으로 통합
  const chips = useMemo(() => {
    const list = [
      {type: 'preset', id: '__all__', label: '전체'},
      ...(meId != null ? [{type: 'preset', id: '__me__', label: '나만'}] : []),
      ...members.map(m => ({type: 'member', id: m.id, label: m.label})),
    ];
    return list;
  }, [members, meId]);
  const chipCount = chips.length;
  const isLargeList = chipCount >= 13;
  const resolvedSnapPoints = useMemo(() => {
    const base =
      isLargeList
        ? ['58%', '92%']
        : chipCount <= 4
        ? ['30%', '92%']
        : chipCount <= 8
        ? ['40%', '92%']
        : ['48%', '92%'];
    const [first] = getSheetSnapPointsByTier({
      fontMode,
      normal: [base[0], '92%'],
      large: [`${Number.parseFloat(base[0]) + 8}%`, '93%'],
      xl: [`${Number.parseFloat(base[0]) + 14}%`, '94%'],
    });
    return [first];
  }, [chipCount, isLargeList, fontMode]);

  const scrollAreaStyle = useMemo(
    () =>
      isLargeList
        ? {maxHeight: getResponsiveHeight(320)}
        : {maxHeight: undefined},
    [isLargeList],
  );

  const isChipActive = useCallback(
    chip => {
      if (chip.id === '__all__') return isAllView;
      if (chip.id === '__me__') return isOnlyMe;
      return draft.includes(chip.id);
    },
    [isAllView, isOnlyMe, draft],
  );

  const handleChipPress = useCallback(
    chip => {
      hapticLight();
      if (chip.id === '__all__') {
        setDraft([]);
      } else if (chip.id === '__me__') {
        if (meId) setDraft([meId]);
      } else {
        toggleId(chip.id);
      }
    },
    [meId, toggleId],
  );

  return (
    <BottomSheetLayout
      modalRef={modalRef}
      snapPoints={resolvedSnapPoints}
      title={BOTTOM_SHEET_TITLES.SCHEDULE_PEOPLE_FILTER}
      headerCentered
      closeOnPressOutside
      onDismiss={onClose}
      containerStyle={{paddingHorizontal: getResponsiveWidth(20)}}
      useInternalScroll={false}
      enableContentPanningGesture={true}
      disableContentBottomPadding>

      <BottomSheetScrollView
        style={scrollAreaStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>

        {members.length === 0 ? (
          <AppText allowFontScaling={false} style={styles.empty}>
            가족 목록을 불러오지 못했어요.
          </AppText>
        ) : (
          <View style={styles.chipWrap}>
            {chips.map(chip => {
              const active = isChipActive(chip);
              return (
                <TouchableOpacity
                  key={chip.id}
                  activeOpacity={0.75}
                  onPress={() => handleChipPress(chip)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <AppText
                    allowFontScaling={false}
                    style={[styles.chipText, active && styles.chipTextActive]}
                    numberOfLines={1}>
                    {chip.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </BottomSheetScrollView>

      <BottomSheetFooterButtons
        bottomSafe={bottomSafe}
        includeBottomSafePadding
        onCancel={onClose}
        onSave={handleApply}
        saveLabel="선택하기"
        showCancel={false}
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
}
