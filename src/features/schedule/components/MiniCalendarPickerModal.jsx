/* eslint-disable react-native/no-inline-styles */
// src/features/schedule/components/MiniCalendarPickerBottomSheet.jsx

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform,
} from 'react-native';

import BottomSheetLayout from 'components/BottomSheetLayout';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {BottomSheetButtons} from 'components/BottomSheetButtons';

// ✅ fontMode 구독
import {useSelector} from 'react-redux';
import {FONT_MODE} from '../../../store/uiSlice';

const pad2 = n => String(n).padStart(2, '0');
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const toMidday = d => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};

const daysInMonth = (year, month0) => new Date(year, month0 + 1, 0).getDate();

const makeDateSafe = (y, m0, d) => {
  const maxD = daysInMonth(y, m0);
  const dd = clamp(d, 1, maxD);
  return toMidday(new Date(y, m0, dd));
};

const getDowLabel = date => {
  const dd = date.getDay();
  return ['일', '월', '화', '수', '목', '금', '토'][dd] || '';
};

const STEP = {
  YEAR: 'YEAR',
  MONTH: 'MONTH',
  DAY: 'DAY',
};

const UI = {
  bg: '#FFFFFF',

  // surfaces
  panel: '#F6F7FB',
  card: '#FFFFFF',
  surface: '#F9FAFB',

  // text
  text: '#0B1220',
  sub: '#667085',
  muted: '#98A2B3',

  // lines
  line: 'rgba(15, 23, 42, 0.08)',
  lineSoft: 'rgba(15, 23, 42, 0.06)',

  // brand
  brand: '#FFC84D',
  brandDeep: '#FFB020',

  // action
  primaryBg: '#111827',
  primaryText: '#FFFFFF',
};

const shadow = Platform.select({});

const shadowStrong = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
  },
  android: {elevation: 3},
});

const DAY_COLS = 7;

// ✅ footer 높이만큼 본문 바닥 여유 (버튼 가림 방지)
// 기존 상수였는데, fontMode에 따라 동적으로 바꿀 거라 "BASE"로 변경
const FOOTER_SPACE_BASE = getResponsiveHeight(88);

export default function MiniCalendarPickerBottomSheet({
  modalRef,
  snapPoints, // optional (외부에서 주면 우선)

  enableContentPanningGesture = false,
  animationConfigs,
  keyboardBehavior = 'none',
  androidKeyboardInputMode = 'adjustNothing',

  onConfirm,
  onClose,

  initialDate,
  minYear = 1950,
  maxYear = 2025,

  defaultYear = 2026,
  forceDefaultYear = false,

  closeOnPressOutside = true,
}) {
  // ✅ fontMode
  const fontMode = useSelector(state => state.ui.fontMode);
  const isLargeFont = fontMode === FONT_MODE.LARGE;

  // ✅ LARGE면 footer 여유를 조금 더 (버튼 + 글씨 커짐 보정)
  const FOOTER_SPACE = useMemo(() => {
    return isLargeFont
      ? FOOTER_SPACE_BASE + getResponsiveHeight(12)
      : FOOTER_SPACE_BASE;
  }, [isLargeFont]);

  // ✅ LARGE면 기본 snapPoints를 더 크게
  // - 외부에서 snapPoints를 넘기면 그걸 그대로 사용
  const resolvedSnapPoints = useMemo(() => {
    if (snapPoints) return snapPoints;
    // NORMAL: 80%
    // LARGE: 88% (원하면 86~90 사이로 조절 가능)
    return isLargeFont ? ['92%'] : ['84%'];
  }, [snapPoints, isLargeFont]);

  const baseDate = useMemo(() => {
    const safeDefaultYear = clamp(defaultYear, minYear, maxYear);
    const hasInitial = !!initialDate;

    if (!hasInitial) return makeDateSafe(safeDefaultYear, 0, 1);

    const dd = toMidday(initialDate);
    if (forceDefaultYear) {
      return makeDateSafe(safeDefaultYear, dd.getMonth(), dd.getDate());
    }
    return dd;
  }, [initialDate, defaultYear, minYear, maxYear, forceDefaultYear]);

  const [step, setStep] = useState(STEP.YEAR);
  const [y, setY] = useState(baseDate.getFullYear());
  const [m0, setM0] = useState(baseDate.getMonth());
  const [d, setD] = useState(baseDate.getDate());

  useEffect(() => {
    setStep(STEP.YEAR);
    setY(baseDate.getFullYear());
    setM0(baseDate.getMonth());
    setD(baseDate.getDate());
  }, [baseDate]);

  useEffect(() => {
    const md = daysInMonth(y, m0);
    if (d > md) setD(md);
  }, [y, m0, d]);

  const selectedDate = useMemo(() => makeDateSafe(y, m0, d), [y, m0, d]);

  const stepTitle = useMemo(() => {
    if (step === STEP.YEAR) return '연도 선택';
    if (step === STEP.MONTH) return '월 선택';
    return '일 선택';
  }, [step]);

  const subtitle = useMemo(() => {
    return `${y}.${pad2(m0 + 1)}.${pad2(d)}  ·  ${getDowLabel(
      selectedDate,
    )}요일`;
  }, [y, m0, d, selectedDate]);

  const years = useMemo(() => {
    const arr = [];
    for (let i = minYear; i <= maxYear; i += 1) arr.push(i);
    return arr;
  }, [minYear, maxYear]);

  const months = useMemo(() => Array.from({length: 12}, (_, i) => i), []);
  const maxDay = useMemo(() => daysInMonth(y, m0), [y, m0]);
  const days = useMemo(
    () => Array.from({length: maxDay}, (_, i) => i + 1),
    [maxDay],
  );

  const closeSheet = useCallback(() => {
    onClose?.();
    modalRef?.current?.dismiss?.();
    modalRef?.current?.close?.();
  }, [onClose, modalRef]);

  const goBackStep = useCallback(() => {
    if (step === STEP.DAY) setStep(STEP.MONTH);
    else if (step === STEP.MONTH) setStep(STEP.YEAR);
    else closeSheet();
  }, [step, closeSheet]);

  const pickToday = useCallback(() => {
    const t = toMidday(new Date());
    const ty = t.getFullYear();
    if (ty < minYear || ty > maxYear) return;
    setY(ty);
    setM0(t.getMonth());
    setD(t.getDate());
    setStep(STEP.DAY);
  }, [minYear, maxYear]);

  const isDayStep = step === STEP.DAY;

  const handleSave = useCallback(() => {
    if (step !== STEP.DAY) return;
    const next = makeDateSafe(y, m0, d);
    onConfirm?.(next);
    closeSheet();
  }, [step, y, m0, d, onConfirm, closeSheet]);

  const handleCancel = useCallback(() => {
    closeSheet();
  }, [closeSheet]);

  // YEAR list scroll sync
  const yearListRef = useRef(null);
  useEffect(() => {
    if (step !== STEP.YEAR) return;
    const idx = clamp(y - minYear, 0, years.length - 1);
    requestAnimationFrame(() => {
      yearListRef.current?.scrollToIndex?.({index: idx, animated: false});
    });
  }, [step, y, minYear, years.length]);

  // ✅ 공통 row height
  const YEAR_ROW_H = useMemo(() => getResponsiveHeight(50), []);

  const renderYearItem = useCallback(
    ({item}) => {
      const isSelected = item === y;
      return (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => {
            setY(item);
            setStep(STEP.MONTH);
          }}
          style={[styles.yearRow, isSelected && styles.yearRowSelected]}>
          <Text allowFontScaling={false}
            style={[styles.yearText, isSelected && styles.yearTextSelected]}>
            {item}년
          </Text>

          {isSelected ? (
            <View style={styles.selectedPill}>
              <Text allowFontScaling={false} style={styles.selectedPillText}>선택</Text>
            </View>
          ) : (
            <View style={{width: getResponsiveWidth(46)}} />
          )}
        </TouchableOpacity>
      );
    },
    [y],
  );

  // DAY layout
  const [dayGridWidth, setDayGridWidth] = useState(0);
  const DAY_GAP = useMemo(() => Math.round(getResponsiveWidth(8)), []);

  const dayLayout = useMemo(() => {
    if (!dayGridWidth) return {cell: 0, remainder: 0};

    const w = Math.round(dayGridWidth);
    const usable = Math.max(0, w - DAY_GAP * (DAY_COLS - 1));
    const cell = Math.floor(usable / DAY_COLS);
    const remainder = usable - cell * DAY_COLS;

    return {cell, remainder};
  }, [dayGridWidth, DAY_GAP]);

  const renderDayItem = useCallback(
    ({item, index}) => {
      const day = item;
      const isSelected = day === d;

      const col = index % DAY_COLS;
      const isEnd = col === DAY_COLS - 1;

      const base = dayLayout.cell;
      const extra = col < dayLayout.remainder ? 1 : 0;
      const size = base ? base + extra : 0;

      return (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setD(day)}
          style={[
            styles.dayBtn,
            size ? {width: size, height: size} : null,
            !isEnd && {marginRight: DAY_GAP},
            {marginBottom: DAY_GAP},
            isSelected && styles.dayBtnSelected,
          ]}>
          <Text allowFontScaling={false} style={[styles.dayText, isSelected && styles.dayTextSelected]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    },
    [d, dayLayout.cell, dayLayout.remainder, DAY_GAP],
  );

  return (
    <BottomSheetLayout
      modalRef={modalRef}
      snapPoints={resolvedSnapPoints}
      enableContentPanningGesture={enableContentPanningGesture}
      animationConfigs={animationConfigs}
      keyboardBehavior={keyboardBehavior}
      androidKeyboardInputMode={androidKeyboardInputMode}
      closeOnPressOutside={closeOnPressOutside}
      onDismiss={onClose}
      title={stepTitle}
      subtitle={subtitle}
      useInternalScroll={false}>
      <SafeAreaView style={{flex: 1, backgroundColor: UI.bg}}>
        <View style={{flex: 1}}>
          {/* ✅ 본문 */}
          <View style={[styles.bodyWrap, {paddingBottom: FOOTER_SPACE}]}>
            {/* ✅ 상단 퀵 액션 */}
            <View style={styles.quickRow}>
              <TouchableOpacity
                onPress={goBackStep}
                activeOpacity={0.88}
                style={[styles.quickBtn, styles.quickBtnGhost]}>
                <Text allowFontScaling={false} style={styles.quickTextGhost}>이전</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickToday}
                activeOpacity={0.88}
                style={[styles.quickBtn, styles.quickBtnPrimary]}>
                <Text allowFontScaling={false} style={styles.quickTextPrimary}>오늘</Text>
              </TouchableOpacity>
            </View>

            {/* ✅ 메인 카드 */}
            <View style={styles.card}>
              {step === STEP.YEAR && (
                <>
                  <Text allowFontScaling={false} style={styles.hint}>
                    연도를 고르면 다음 단계로 넘어가요
                  </Text>

                  <View style={styles.yearListWrap}>
                    <FlatList
                      ref={yearListRef}
                      data={years}
                      keyExtractor={item => String(item)}
                      renderItem={renderYearItem}
                      showsVerticalScrollIndicator={false}
                      getItemLayout={(_, index) => ({
                        length: YEAR_ROW_H,
                        offset: YEAR_ROW_H * index,
                        index,
                      })}
                      onScrollToIndexFailed={() => {}}
                    />
                  </View>
                </>
              )}

              {step === STEP.MONTH && (
                <>
                  <Text allowFontScaling={false} style={styles.hint}>{y}년의 월을 골라줘요</Text>

                  <View style={styles.monthGrid}>
                    {months.map(month0 => {
                      const isSelected = month0 === m0;
                      return (
                        <TouchableOpacity
                          key={month0}
                          activeOpacity={0.88}
                          onPress={() => {
                            setM0(month0);
                            setStep(STEP.DAY);
                          }}
                          style={[
                            styles.monthChip,
                            isSelected && styles.monthChipSelected,
                          ]}>
                          <Text allowFontScaling={false}
                            style={[
                              styles.monthChipText,
                              isSelected && styles.monthChipTextSelected,
                            ]}>
                            {month0 + 1}월
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {step === STEP.DAY && (
                <>
                  <Text allowFontScaling={false} style={styles.hint}>
                    {y}년 {m0 + 1}월은 {maxDay}일까지 있어요
                  </Text>

                  <View
                    style={styles.dayGridWrap}
                    onLayout={e => {
                      const w = e?.nativeEvent?.layout?.width || 0;
                      if (w && Math.abs(w - dayGridWidth) > 0.5) {
                        setDayGridWidth(w);
                      }
                    }}>
                    <FlatList
                      data={days}
                      keyExtractor={item => String(item)}
                      renderItem={renderDayItem}
                      numColumns={DAY_COLS}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                      columnWrapperStyle={styles.dayColumnWrap}
                      onScrollToIndexFailed={() => {}}
                    />
                  </View>

                  {/* ✅ 선택된 날짜 강조 카드 */}
                  <View style={styles.selectedCard}>
                    <Text allowFontScaling={false}  style={styles.selectedCardLabel}>선택한 날짜</Text>
                    <Text allowFontScaling={false} style={styles.selectedCardValue}>
                      {y}.{pad2(m0 + 1)}.{pad2(d)} ({getDowLabel(selectedDate)})
                    </Text>
                  </View>
                </>
              )}
            </View>

            {!isDayStep && (
              <View style={styles.footerHintWrap}>
                <Text allowFontScaling={false} style={styles.footerHint}>
                  날짜(일)까지 선택해야 ‘선택하기’가 가능해요
                </Text>
              </View>
            )}
          </View>

          {/* ✅ footer 고정 */}
          <View style={styles.footerFixed}>
            <BottomSheetButtons
              onCancel={handleCancel}
              onSave={handleSave}
              saveLabel="선택하기"
              autoCloseOnSave={true}
            />
          </View>
        </View>
      </SafeAreaView>
    </BottomSheetLayout>
  );
}

const styles = StyleSheet.create({
  bodyWrap: {
    flex: 1,
    paddingTop: getResponsiveHeight(6),
  },

  /* ----------------- Quick Actions ----------------- */
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(12),
  },
  quickBtn: {
    paddingVertical: getResponsiveHeight(9),
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: getResponsiveWidth(74),
  },
  quickBtnGhost: {
    backgroundColor: UI.card,
    borderColor: UI.line,
  },
  quickTextGhost: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13),
    color: UI.sub,
    letterSpacing: -0.2,
  },
  quickBtnPrimary: {
    backgroundColor: UI.primaryBg,
    borderColor: UI.primaryBg,
    ...shadowStrong,
  },
  quickTextPrimary: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13),
    color: UI.primaryText,
    letterSpacing: -0.2,
  },

  /* ----------------- Main Card ----------------- */
  card: {
    backgroundColor: UI.panel,
    borderWidth: 1,
    borderColor: UI.lineSoft,
    borderRadius: 18,
    padding: getResponsiveWidth(14),
    ...shadow,
  },

  hint: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12.8),
    color: UI.sub,
    marginBottom: getResponsiveHeight(10),
    letterSpacing: -0.2,
  },

  /* ----------------- Year List ----------------- */
  yearListWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UI.lineSoft,
    backgroundColor: UI.card,
    overflow: 'hidden',
    maxHeight: getResponsiveHeight(320),
  },
  yearRow: {
    height: getResponsiveHeight(50),
    paddingHorizontal: getResponsiveWidth(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: UI.card,
    borderBottomWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  yearRowSelected: {
    backgroundColor: 'rgba(255, 200, 77, 0.22)',
  },
  yearText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(15),
    color: UI.text,
    letterSpacing: -0.2,
  },
  yearTextSelected: {
    color: UI.text,
  },
  selectedPill: {
    paddingVertical: getResponsiveHeight(5),
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: 999,
    backgroundColor: UI.primaryBg,
  },
  selectedPillText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(11.5),
    color: UI.primaryText,
    letterSpacing: -0.2,
  },

  /* ----------------- Month Grid ----------------- */
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: getResponsiveHeight(10),
  },
  monthChip: {
    width: '31.6%',
    paddingVertical: getResponsiveHeight(14),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: UI.line,
    backgroundColor: UI.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthChipSelected: {
    backgroundColor: UI.primaryBg,
    borderColor: UI.primaryBg,
    ...shadowStrong,
  },
  monthChipText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
    color: UI.text,
    letterSpacing: -0.2,
  },
  monthChipTextSelected: {
    color: UI.primaryText,
  },

  /* ----------------- Day Grid ----------------- */
  dayGridWrap: {
    width: '100%',
    alignSelf: 'stretch',
  },
  dayColumnWrap: {
    justifyContent: 'flex-start',
  },
  dayBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: UI.lineSoft,
    backgroundColor: UI.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnSelected: {
    backgroundColor: UI.primaryBg,
    borderColor: UI.primaryBg,
    ...shadowStrong,
  },
  dayText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13),
    color: UI.text,
    letterSpacing: -0.2,
  },
  dayTextSelected: {
    color: UI.primaryText,
  },

  /* ----------------- Selected Date Card ----------------- */
  selectedCard: {
    marginTop: getResponsiveHeight(12),
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.lineSoft,
    borderRadius: 16,
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(14),
  },
  selectedCardLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12),
    color: UI.sub,
    letterSpacing: -0.2,
  },
  selectedCardValue: {
    marginTop: getResponsiveHeight(6),
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(15),
    color: UI.text,
    letterSpacing: -0.2,
  },

  /* ----------------- Footer Hint ----------------- */
  footerHintWrap: {
    marginTop: getResponsiveHeight(10),
    alignItems: 'center',
  },
  footerHint: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12.5),
    color: UI.muted,
    letterSpacing: -0.2,
  },

  /* ----------------- Footer ----------------- */
  footerFixed: {
    paddingTop: getResponsiveHeight(10),
    paddingBottom: getResponsiveHeight(2),
  },
});
