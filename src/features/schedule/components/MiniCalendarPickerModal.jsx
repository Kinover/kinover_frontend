/* eslint-disable react-native/no-inline-styles */
// src/features/schedule/components/MiniCalendarPickerModal.jsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {BACKGROUND_COLORS, BUTTON_STYLES} from 'styles/style';

const R = 18;

const pad2 = n => String(n).padStart(2, '0');

const toMidday = d => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};

const sameYMD = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const clampMonth = (y, m, minYear, maxYear) => {
  const yy = Math.min(Math.max(y, minYear), maxYear);
  let mm = m;

  if (yy === minYear && mm < 0) mm = 0;
  if (yy === maxYear && mm > 11) mm = 11;

  return {y: yy, m: mm};
};

const addMonths = (y, m, delta, minYear, maxYear) => {
  let ny = y;
  let nm = m + delta;

  while (nm < 0) {
    nm += 12;
    ny -= 1;
  }
  while (nm > 11) {
    nm -= 12;
    ny += 1;
  }

  const clamped = clampMonth(ny, nm, minYear, maxYear);
  return clamped;
};

const getDowLabel = date => {
  const d = date.getDay();
  return ['일', '월', '화', '수', '목', '금', '토'][d] || '';
};

const buildMonthGrid = (year, month) => {
  // 6주 * 7일 고정 그리드
  const first = new Date(year, month, 1);
  const startDow = first.getDay(); // 0=일
  const start = new Date(year, month, 1 - startDow);

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      date: d,
      isCurrentMonth: d.getMonth() === month,
    });
  }
  return cells;
};

export default function MiniCalendarPickerModal({
  visible,
  onClose,
  onConfirm,
  initialDate = new Date(),
  minYear = 2000,
  maxYear = 2100,
}) {
  const initialSafe = useMemo(
    () => toMidday(initialDate || new Date()),
    [initialDate],
  );

  const [tempSelected, setTempSelected] = useState(initialSafe);
  const [viewYear, setViewYear] = useState(initialSafe.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialSafe.getMonth());

  // open마다 초기화
  useEffect(() => {
    if (!visible) return;
    const d = toMidday(initialDate || new Date());
    setTempSelected(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [visible, initialDate]);

  // slide-up 애니메이션
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 닫힐 때는 Modal 자체가 내려가서 별도 처리 최소화
      translateY.setValue(40);
      opacity.setValue(0);
    }
  }, [visible, opacity, translateY]);

  const today = useMemo(() => toMidday(new Date()), []);

  const monthLabel = useMemo(() => {
    return `${viewYear}년 ${viewMonth + 1}월`;
  }, [viewYear, viewMonth]);

  const headerBig = useMemo(() => {
    const d = tempSelected || initialSafe;
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
  }, [tempSelected, initialSafe]);

  const headerSub = useMemo(() => {
    const d = tempSelected || initialSafe;
    return `${getDowLabel(d)}요일`;
  }, [tempSelected, initialSafe]);

  const canPrev = useMemo(() => {
    if (viewYear > minYear) return true;
    return viewYear === minYear && viewMonth > 0;
  }, [viewYear, viewMonth, minYear]);

  const canNext = useMemo(() => {
    if (viewYear < maxYear) return true;
    return viewYear === maxYear && viewMonth < 11;
  }, [viewYear, viewMonth, maxYear]);

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    const next = addMonths(viewYear, viewMonth, -1, minYear, maxYear);
    setViewYear(next.y);
    setViewMonth(next.m);
  }, [canPrev, viewYear, viewMonth, minYear, maxYear]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    const next = addMonths(viewYear, viewMonth, 1, minYear, maxYear);
    setViewYear(next.y);
    setViewMonth(next.m);
  }, [canNext, viewYear, viewMonth, minYear, maxYear]);

  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const confirm = useCallback(() => {
    const d = tempSelected || initialSafe;
    onConfirm?.(toMidday(d));
  }, [tempSelected, initialSafe, onConfirm]);

  const pickToday = useCallback(() => {
    const d = toMidday(new Date());
    // 범위 밖이면 무시
    const y = d.getFullYear();
    if (y < minYear || y > maxYear) return;

    setTempSelected(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [minYear, maxYear]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, {opacity}]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                {
                  transform: [{translateY}],
                },
              ]}>
              {/* drag handle */}
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>

              {/* Selected header */}
              <View style={styles.topHeader}>
                <View style={{flex: 1}}>
                  <Text style={styles.bigDate}>{headerBig}</Text>
                  <Text style={styles.subDate}>{headerSub}</Text>
                </View>

                <TouchableOpacity
                  onPress={pickToday}
                  activeOpacity={0.9}
                  style={styles.todayBtn}>
                  <Text style={styles.todayText}>오늘</Text>
                </TouchableOpacity>
              </View>

              {/* Month nav */}
              <View style={styles.monthRow}>
                <TouchableOpacity
                  onPress={goPrev}
                  disabled={!canPrev}
                  style={[styles.navBtn, !canPrev && styles.navDisabled]}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={styles.navText}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.monthLabel}>{monthLabel}</Text>

                <TouchableOpacity
                  onPress={goNext}
                  disabled={!canNext}
                  style={[styles.navBtn, !canNext && styles.navDisabled]}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                  <Text style={styles.navText}>›</Text>
                </TouchableOpacity>
              </View>

              {/* DOW */}
              <View style={styles.dowRow}>
                {['일', '월', '화', '수', '목', '금', '토'].map((d, idx) => (
                  <View key={d} style={styles.dowCell}>
                    <Text
                      style={[styles.dowText, idx === 0 && styles.dowSunday]}>
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Grid */}
              <View style={styles.grid}>
                {grid.map((c, idx) => {
                  const d = toMidday(c.date);
                  const isToday = sameYMD(d, today);
                  const isSelected = sameYMD(d, tempSelected);
                  const isOutside = !c.isCurrentMonth;

                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.9}
                      onPress={() => {
                        // 범위 밖 연도면 막기
                        const y = d.getFullYear();
                        if (y < minYear || y > maxYear) return;
                        setTempSelected(d);

                        // 다른 달 클릭하면 그 달로 자동 이동 (요즘 UX)
                        if (
                          d.getMonth() !== viewMonth ||
                          d.getFullYear() !== viewYear
                        ) {
                          const clamped = clampMonth(
                            d.getFullYear(),
                            d.getMonth(),
                            minYear,
                            maxYear,
                          );
                          setViewYear(clamped.y);
                          setViewMonth(clamped.m);
                        }
                      }}
                      style={styles.cell}>
                      <View
                        style={[
                          styles.cellInner,
                          isSelected && styles.cellSelected,
                          isToday && !isSelected && styles.cellToday,
                          isOutside && styles.cellOutside,
                        ]}>
                        <Text
                          style={[
                            styles.cellText,
                            isOutside && styles.cellTextOutside,
                            isSelected && styles.cellTextSelected,
                            isToday && !isSelected && styles.cellTextToday,
                          ]}>
                          {d.getDate()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Actions (bottom fixed-ish) */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancel]}
                  onPress={onClose}>
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.confirm]}
                  onPress={confirm}>
                  <Text style={styles.confirmText}>선택하기</Text>
                </TouchableOpacity>
              </View>

              {/* safe bottom padding */}
              <View style={{height: getResponsiveHeight(8)}} />
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const CELL = getResponsiveWidth(44); // 모달은 캘린더랑 분리된 느낌이 있어야 해서 셀 크기 고정

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: BACKGROUND_COLORS.overlayBg,
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: R,
    borderTopRightRadius: R,
    paddingHorizontal: getResponsiveWidth(18),
    paddingTop: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(10),
    borderTopWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',

    shadowColor: '#000',
    shadowOffset: {width: 0, height: -8},
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 18,
  },

  handleWrap: {
    alignItems: 'center',
    paddingTop: getResponsiveHeight(6),
    paddingBottom: getResponsiveHeight(8),
  },
  handle: {
    width: getResponsiveWidth(44),
    height: getResponsiveHeight(5),
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    paddingBottom: getResponsiveHeight(12),
  },
  bigDate: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(22),
    color: '#111827',
    letterSpacing: -0.4,
  },
  subDate: {
    marginTop: getResponsiveHeight(4),
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13),
    color: '#6B7280',
  },
  todayBtn: {
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  todayText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13),
    color: '#111827',
  },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveHeight(10),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEF2F7',
  },
  monthLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(16),
    color: '#111827',
    letterSpacing: -0.2,
  },
  navBtn: {
    width: getResponsiveWidth(36),
    height: getResponsiveWidth(36),
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: {
    opacity: 0.35,
  },
  navText: {
    fontFamily:
      Platform.OS === 'android' ? 'Pretendard-SemiBold' : 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(18),
    color: '#111827',
    marginTop: -1,
  },

  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: getResponsiveHeight(10),
    paddingBottom: getResponsiveHeight(6),
  },
  dowCell: {
    width: CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dowText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.5),
    color: '#6B7280',
  },
  dowSunday: {
    color: '#EF4444',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: getResponsiveHeight(6),
    paddingBottom: getResponsiveHeight(10),
  },
  cell: {
    width: CELL,
    height: CELL,
    marginBottom: getResponsiveHeight(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellInner: {
    width: CELL * 0.86,
    height: CELL * 0.86,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14),
    color: '#111827',
  },

  cellOutside: {
    opacity: 0.35,
  },
  cellTextOutside: {
    color: '#6B7280',
  },

  cellSelected: {
    backgroundColor: BUTTON_STYLES.saveBg,
  },
  cellTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },

  cellToday: {
    backgroundColor: 'rgba(17,24,39,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.18)',
  },
  cellTextToday: {
    fontFamily: 'Pretendard-SemiBold',
  },

  actions: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    paddingTop: getResponsiveHeight(6),
  },
  btn: {
    flex: 1,
    height: getResponsiveHeight(48),
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cancel: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  confirm: {
    backgroundColor: BUTTON_STYLES.saveBg,
    borderColor: BUTTON_STYLES.saveBg,
  },
  cancelText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
    color: '#6B7280',
  },
  confirmText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
    color: '#FFFFFF',
  },
});
