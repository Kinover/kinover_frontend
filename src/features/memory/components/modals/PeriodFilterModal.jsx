import React, {useEffect, useMemo, useState, useRef, useCallback} from 'react';
import {View, TouchableOpacity, PanResponder, Image} from 'react-native';

import AppText from 'components/AppText';
import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';
import {useReduxFontMode} from 'hooks/useReduxFontMode';
import {getSheetSnapPointsByTier} from 'utils/layoutMetrics';
import {FONTS} from 'styles/typography';

const DEFAULT_SORT_OPTIONS = [
  {key: 'none', title: '선택 안 함'},
  {key: 'latest', title: '최신순'},
  {key: 'oldest', title: '오래된순'},
];

const RANGE_PRESETS = [
  {key: '12m', label: '12개월 전', monthsAgo: 12},
  {key: '9m', label: '9개월 전', monthsAgo: 9},
  {key: '6m', label: '6개월 전', monthsAgo: 6},
  {key: '3m', label: '3개월 전', monthsAgo: 3},
  {key: '1m', label: '지난달', monthsAgo: 1},
  {key: '0m', label: '이번달', monthsAgo: 0},
];
const SLIDER_THUMB_SIZE = getResponsiveWidth(24);
const SLIDER_THUMB_RADIUS = SLIDER_THUMB_SIZE / 2;

const pad2 = n => String(n).padStart(2, '0');

const formatYMD = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const startOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
const endOfMonth = d => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 0);

const getPresetMonthDate = (today, monthsAgo) =>
  new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1, 0, 0, 0);

const parseDateText = raw => {
  if (!raw) return null;
  const parsed = new Date(String(raw).replace(/\./g, '-'));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const nearestPresetIndex = (targetDate, today) => {
  if (!targetDate) return null;
  const targetMonthValue = targetDate.getFullYear() * 12 + targetDate.getMonth();
  let bestIdx = 0;
  let bestGap = Number.POSITIVE_INFINITY;

  RANGE_PRESETS.forEach((preset, idx) => {
    const monthDate = getPresetMonthDate(today, preset.monthsAgo);
    const monthValue = monthDate.getFullYear() * 12 + monthDate.getMonth();
    const gap = Math.abs(monthValue - targetMonthValue);
    if (gap < bestGap) {
      bestGap = gap;
      bestIdx = idx;
    }
  });

  return bestIdx;
};

export default function PeriodFilterModal({
  visible,
  onClose,
  onApply,
  initialStartDate = '',
  initialEndDate = '',
  initialSortKey = 'latest',
  sortOptions = DEFAULT_SORT_OPTIONS,
}) {
  const fontMode = useReduxFontMode();
  const styles = useScaledStyleSheet(rf => ({
    container: {
      width: '100%',
      paddingTop: getResponsiveHeight(10),
      marginBottom: getResponsiveHeight(7),
      alignItems: 'center',
    },
    sortCard: {
      width: '100%',
      paddingVertical: getResponsiveHeight(6),
      paddingHorizontal: getResponsiveWidth(2),
      marginBottom: getResponsiveHeight(12),
    },
    sectionHeaderRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: getResponsiveHeight(6),
    },
    sectionTitle: {
      fontSize: rf(15),
      fontFamily: FONTS.SEMI_BOLD,
      color: '#111827',
    },
    sectionToggleBtn: {
      minHeight: getResponsiveHeight(28),
      paddingHorizontal: getResponsiveWidth(10),
      borderRadius: 999,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
    sectionToggleBtnActive: {
      borderColor: '#F6C542',
      backgroundColor: '#FFE8A3',
    },
    sectionToggleText: {
      fontSize: rf(11.5),
      color: '#6B7280',
      fontFamily: FONTS.MEDIUM,
    },
    sectionToggleTextActive: {
      color: '#8A5A00',
      fontFamily: FONTS.SEMI_BOLD,
    },
    sectionOffWrap: {
      backgroundColor: '#F3F4F6',
      borderRadius: getResponsiveWidth(10),
      paddingHorizontal: getResponsiveWidth(8),
      paddingVertical: getResponsiveHeight(8),
    },
    sortOption: {
      minHeight: getResponsiveHeight(36),
      paddingHorizontal: getResponsiveWidth(10),
      borderRadius: getResponsiveWidth(10),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sortOptionActive: {
      backgroundColor: 'rgba(255, 200, 77, 0.22)',
    },
    sortOptionText: {
      fontSize: rf(12.5),
      color: '#374151',
      fontFamily: FONTS.MEDIUM,
    },
    sortOptionTextActive: {
      color: '#8A5A00',
      fontFamily: FONTS.SEMI_BOLD,
    },
    rangeCard: {
      width: '100%',
      paddingTop: getResponsiveHeight(14),
      paddingVertical: getResponsiveHeight(14),
      paddingHorizontal: getResponsiveWidth(2),
    },
    sectionDivider: {
      width: '100%',
      height: 1,
      backgroundColor: '#E5E7EB',
      marginVertical: getResponsiveHeight(4),
    },
    sectionDimmed: {
      opacity: 0.48,
    },
    rangeHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: getResponsiveHeight(8),
    },
    rangeEdgeLabel: {
      fontSize: rf(12),
      color: '#6B7280',
      fontFamily: FONTS.MEDIUM,
    },
    sliderWrap: {
      height: getResponsiveHeight(36),
      justifyContent: 'center',
      marginTop: getResponsiveHeight(4),
      marginBottom: getResponsiveHeight(8),
    },
    sliderTrack: {
      height: getResponsiveHeight(4),
      borderRadius: 999,
      backgroundColor: '#E5E7EB',
    },
    sliderTrackActive: {
      position: 'absolute',
      height: getResponsiveHeight(4),
      borderRadius: 999,
      backgroundColor: '#FFC84D',
    },
    stepDot: {
      position: 'absolute',
      width: getResponsiveWidth(8),
      height: getResponsiveWidth(8),
      borderRadius: 999,
      backgroundColor: '#D1D5DB',
      top: '50%',
      marginTop: -getResponsiveWidth(4),
      marginLeft: -getResponsiveWidth(4),
    },
    thumb: {
      position: 'absolute',
      width: SLIDER_THUMB_SIZE,
      height: SLIDER_THUMB_SIZE,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: '#FFC84D',
      backgroundColor: '#FFFFFF',
      top: '50%',
      marginTop: -SLIDER_THUMB_RADIUS,
      marginLeft: -SLIDER_THUMB_RADIUS,
    },
    selectedLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: getResponsiveHeight(8),
    },
    selectedLabel: {
      fontSize: rf(12),
      color: '#111827',
      fontFamily: FONTS.SEMI_BOLD,
    },
    selectedRangeText: {
      fontSize: rf(12),
      color: '#374151',
      fontFamily: FONTS.MEDIUM,
      textAlign: 'center',
      marginTop: getResponsiveHeight(2),
    },
    applyButton: {
      width: '100%',
      minHeight: getResponsiveHeight(52),
      marginTop: getResponsiveHeight(14),
      borderRadius: 14,
      backgroundColor: '#FFC84D',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: getResponsiveHeight(12),
    },
    applyButtonText: {
      fontSize: rf(15),
      fontFamily: FONTS.SEMI_BOLD,
      color: '#111827',
    },
  }));

  const modalRef = useRef(null);
  const resolvedSnapPoints = useMemo(() => {
    const [first] = getSheetSnapPointsByTier({
      fontMode,
      normal: ['64%', '92%'],
      large: ['74%', '93%'],
      xl: ['84%', '94%'],
    });
    return [first];
  }, [fontMode]);
  const today = useMemo(() => new Date(), []);
  const [selectedSortKey, setSelectedSortKey] = useState(
    initialSortKey || 'none',
  );
  const [startIdx, setStartIdx] = useState(2);
  const [endIdx, setEndIdx] = useState(RANGE_PRESETS.length - 1);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [periodEnabled, setPeriodEnabled] = useState(false);
  const periodEnabledRef = useRef(periodEnabled);
  const startIdxRef = useRef(startIdx);
  const endIdxRef = useRef(endIdx);
  const startDragBaseX = useRef(0);
  const endDragBaseX = useRef(0);

  const stepCount = RANGE_PRESETS.length;
  const maxIndex = stepCount - 1;
  const usableSliderWidth = Math.max(0, sliderWidth - SLIDER_THUMB_SIZE);
  const stepWidth = usableSliderWidth > 0 ? usableSliderWidth / maxIndex : 0;

  useEffect(() => {
    startIdxRef.current = startIdx;
  }, [startIdx]);

  useEffect(() => {
    endIdxRef.current = endIdx;
  }, [endIdx]);

  useEffect(() => {
    periodEnabledRef.current = periodEnabled;
  }, [periodEnabled]);

  useEffect(() => {
    if (!visible) return;

    const parsedStart = parseDateText(initialStartDate);
    const parsedEnd = parseDateText(initialEndDate);
    const guessedStart = nearestPresetIndex(parsedStart, today);
    const guessedEnd = nearestPresetIndex(parsedEnd, today);

    const nextStart = guessedStart ?? 2;
    const nextEnd = guessedEnd ?? maxIndex;

    setStartIdx(Math.min(nextStart, nextEnd));
    setEndIdx(Math.max(nextStart, nextEnd));
    setPeriodEnabled(!!(parsedStart && parsedEnd));
    setSelectedSortKey(initialSortKey || 'none');
  }, [visible, initialStartDate, initialEndDate, initialSortKey, today, maxIndex]);

  const indexFromX = useCallback(
    x => {
      if (stepWidth <= 0) return 0;
      const clampedX = Math.min(
        sliderWidth - SLIDER_THUMB_RADIUS,
        Math.max(SLIDER_THUMB_RADIUS, x),
      );
      const raw = Math.round((clampedX - SLIDER_THUMB_RADIUS) / stepWidth);
      return Math.min(maxIndex, Math.max(0, raw));
    },
    [stepWidth, maxIndex, sliderWidth],
  );

  const startPan = useMemo(
    () =>
      PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (!periodEnabledRef.current) setPeriodEnabled(true);
        startDragBaseX.current = startX;
      },
      onPanResponderMove: (_, gesture) => {
        const idx = indexFromX(startDragBaseX.current + gesture.dx);
        setStartIdx(Math.min(idx, endIdxRef.current));
      },
      onPanResponderRelease: (_, gesture) => {
        const idx = indexFromX(startDragBaseX.current + gesture.dx);
        setStartIdx(Math.min(idx, endIdxRef.current));
      },
      }),
    [indexFromX, startX],
  );

  const endPan = useMemo(
    () =>
      PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (!periodEnabledRef.current) setPeriodEnabled(true);
        endDragBaseX.current = endX;
      },
      onPanResponderMove: (_, gesture) => {
        const idx = indexFromX(endDragBaseX.current + gesture.dx);
        setEndIdx(Math.max(idx, startIdxRef.current));
      },
      onPanResponderRelease: (_, gesture) => {
        const idx = indexFromX(endDragBaseX.current + gesture.dx);
        setEndIdx(Math.max(idx, startIdxRef.current));
      },
      }),
    [indexFromX, endX],
  );

  const startMonth = useMemo(
    () => getPresetMonthDate(today, RANGE_PRESETS[startIdx].monthsAgo),
    [today, startIdx],
  );
  const endMonth = useMemo(
    () => getPresetMonthDate(today, RANGE_PRESETS[endIdx].monthsAgo),
    [today, endIdx],
  );

  const range = useMemo(
    () => ({
      startDate: formatYMD(startOfMonth(startMonth)),
      endDate: formatYMD(endOfMonth(endMonth)),
    }),
    [startMonth, endMonth],
  );

  const startX = SLIDER_THUMB_RADIUS + stepWidth * startIdx;
  const endX = SLIDER_THUMB_RADIUS + stepWidth * endIdx;

  const onConfirm = useCallback(() => {
    onApply?.({
      startDate: periodEnabled ? range.startDate : '',
      endDate: periodEnabled ? range.endDate : '',
      sortKey: selectedSortKey === 'none' ? null : selectedSortKey,
    });
  }, [onApply, periodEnabled, range, selectedSortKey]);

  useEffect(() => {
    const ref = modalRef.current;
    if (!ref) return;
    if (visible) {
      requestAnimationFrame(() => {
        modalRef.current?.present?.();
      });
      return;
    }
    modalRef.current?.dismiss?.();
  }, [visible]);

  const handleDismiss = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <BottomSheetLayout
      modalRef={modalRef}
      snapPoints={resolvedSnapPoints}
      title="필터 설정"
      headerCentered={true}
      useInternalScroll={true}
      enableContentPanningGesture={true}
      dismissKeyboardOnPress={false}
      onDismiss={handleDismiss}
      closeOnPressOutside={true}
      containerStyle={{paddingHorizontal: getResponsiveWidth(16)}}
      innerContentStyle={{paddingBottom: getResponsiveHeight(6)}}
      contentStyle={{paddingBottom: getResponsiveHeight(8)}}
      disableContentBottomPadding={true}>
      <View style={styles.container}>
        <View style={styles.sortCard}>
          <View style={styles.sectionHeaderRow}>
            <AppText style={styles.sectionTitle}>정렬</AppText>
          </View>
          <View
            style={[
              selectedSortKey === 'none' ? styles.sectionDimmed : null,
              selectedSortKey === 'none' ? styles.sectionOffWrap : null,
            ]}>
            {(sortOptions || DEFAULT_SORT_OPTIONS).map(opt => {
              const active = opt.key === selectedSortKey;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.8}
                  style={[styles.sortOption, active && styles.sortOptionActive]}
                  onPress={() => setSelectedSortKey(opt.key)}>
                  <AppText
                    style={[
                      styles.sortOptionText,
                      active && styles.sortOptionTextActive,
                    ]}>
                    {opt.title}
                  </AppText>
                  {active ? (
                    <Image
                      style={{
                        tintColor: '#111827',
                        width: getResponsiveWidth(10),
                        height: getResponsiveWidth(10),
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
        <View style={styles.sectionDivider} />

        <View style={styles.rangeCard}>
          <View style={styles.sectionHeaderRow}>
            <AppText style={styles.sectionTitle}>기간 선택</AppText>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.sectionToggleBtn,
                !periodEnabled && styles.sectionToggleBtnActive,
              ]}
              onPress={() => setPeriodEnabled(v => !v)}>
              <AppText
                style={[
                  styles.sectionToggleText,
                  !periodEnabled && styles.sectionToggleTextActive,
                ]}>
                선택 안 함
              </AppText>
            </TouchableOpacity>
          </View>

          <View
            onTouchStart={() => {
              if (!periodEnabled) setPeriodEnabled(true);
            }}
            style={[
              !periodEnabled ? styles.sectionDimmed : null,
              !periodEnabled ? styles.sectionOffWrap : null,
            ]}>
            <View style={styles.rangeHeaderRow}>
              <AppText style={styles.rangeEdgeLabel}>
                {RANGE_PRESETS[0].label}
              </AppText>
              <AppText style={styles.rangeEdgeLabel}>
                {RANGE_PRESETS[maxIndex].label}
              </AppText>
            </View>

            <View
              pointerEvents={periodEnabled ? 'auto' : 'none'}
              style={styles.sliderWrap}
              onLayout={e => setSliderWidth(e.nativeEvent.layout.width)}>
              <View style={styles.sliderTrack} />
              {sliderWidth > 0 ? (
                <>
                  <View
                    style={[
                      styles.sliderTrackActive,
                      {left: startX, width: endX - startX},
                    ]}
                  />
                  {RANGE_PRESETS.map((preset, idx) => (
                    <View
                      key={preset.key}
                      style={[
                        styles.stepDot,
                        {left: SLIDER_THUMB_RADIUS + stepWidth * idx},
                      ]}
                    />
                  ))}
                  <View
                    style={[styles.thumb, {left: startX}]}
                    {...startPan.panHandlers}
                  />
                  <View
                    style={[styles.thumb, {left: endX}]}
                    {...endPan.panHandlers}
                  />
                </>
              ) : null}
            </View>

            <View style={styles.selectedLabelRow}>
              <AppText style={styles.selectedLabel}>
                {RANGE_PRESETS[startIdx].label}
              </AppText>
              <AppText style={styles.selectedLabel}>
                {RANGE_PRESETS[endIdx].label}
              </AppText>
            </View>

            <AppText style={styles.selectedRangeText}>
              {periodEnabled
                ? `선택 범위: ${range.startDate} ~ ${range.endDate}`
                : '선택 범위: 전체 기간'}
            </AppText>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.applyButton}
          onPress={onConfirm}>
          <AppText style={styles.applyButtonText}>적용</AppText>
        </TouchableOpacity>
      </View>
    </BottomSheetLayout>
  );
}
