// src/screens/memory/components/PeriodFilterModal.js
import React, {useEffect, useMemo, useState, useCallback, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import CustomModal from 'components/CustomModal';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {BUTTON_STYLES, COLORS} from 'styles/style';

function formatYMD(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const MODES = ['ALL', 'RECENT', 'MONTH'];

export default function PeriodFilterModal({
  visible,
  onClose,
  onApply, // ({ startDate, endDate }) => void
  initialStartDate, // 호환용 (안 써도 됨)
  initialWeeks = 1, // 호환용 (안 써도 됨)
}) {
  const today = useMemo(() => new Date(), []);

  // ✅ 카드 렌더 기준 모드
  const [mode, setMode] = useState('ALL');

  // ✅ 탭 하이라이트(즉시)
  const [pendingMode, setPendingMode] = useState('ALL');

  const [recentWeeks, setRecentWeeks] = useState(1);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // =========================
  // ✅ 1) 카드 슬라이드 전환
  // =========================
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  // =========================
  // ✅ 2) 세그먼트 알약(thumb) 슬라이드
  // =========================
  const segmentW = useRef(0);
  const thumbX = useRef(new Animated.Value(0)).current;

  const modeIndex = useMemo(() => MODES.indexOf(pendingMode), [pendingMode]);

  const animateThumbTo = useCallback(
    nextMode => {
      const idx = MODES.indexOf(nextMode);
      if (idx < 0) return;

      const w = segmentW.current;
      if (!w) return;

      const padding = getResponsiveHeight(4);
      const innerW = w - padding * 2;
      const tabW = innerW / 3;

      Animated.spring(thumbX, {
        toValue: tabW * idx,
        useNativeDriver: true,
        stiffness: 220,
        damping: 22,
        mass: 0.9,
      }).start();
    },
    [thumbX],
  );

  useEffect(() => {
    if (!visible) return;

    setMode('ALL');
    setPendingMode('ALL');
    setRecentWeeks(initialWeeks >= 1 && initialWeeks <= 4 ? initialWeeks : 1);
    setYear(today.getFullYear());
    setMonth(today.getMonth());

    cardOpacity.setValue(1);
    cardTranslateX.setValue(0);
    isAnimatingRef.current = false;
  }, [visible, initialWeeks, today, cardOpacity, cardTranslateX]);

  const {startDate, endDate} = useMemo(() => {
    if (mode === 'ALL') return {startDate: '', endDate: ''};

    if (mode === 'RECENT') {
      const end = new Date();
      const start = new Date();
      const days = recentWeeks * 7 - 1;
      start.setDate(end.getDate() - days);
      return {startDate: formatYMD(start), endDate: formatYMD(end)};
    }

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {startDate: formatYMD(start), endDate: formatYMD(end)};
  }, [mode, recentWeeks, year, month]);

  const animateToMode = useCallback(
    nextMode => {
      if (isAnimatingRef.current) return;
      if (nextMode === mode) {
        animateThumbTo(nextMode);
        setPendingMode(nextMode);
        return;
      }

      isAnimatingRef.current = true;

      setPendingMode(nextMode);
      animateThumbTo(nextMode);

      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateX, {
          toValue: -getResponsiveWidth(10),
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMode(nextMode);

        cardTranslateX.setValue(getResponsiveWidth(10));
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 170,
            useNativeDriver: true,
          }),
          Animated.timing(cardTranslateX, {
            toValue: 0,
            duration: 170,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isAnimatingRef.current = false;
        });
      });
    },
    [mode, cardOpacity, cardTranslateX, animateThumbTo],
  );

  const handleChangeMonth = useCallback(
    diff => {
      animateToMode('MONTH');

      let newYear = year;
      let newMonth = month + diff;

      if (newMonth < 0) {
        newYear -= 1;
        newMonth = 11;
      } else if (newMonth > 11) {
        newYear += 1;
        newMonth = 0;
      }

      setYear(newYear);
      setMonth(newMonth);
    },
    [animateToMode, year, month],
  );

  const handleApply = useCallback(() => {
    onApply({startDate, endDate});
  }, [onApply, startDate, endDate]);

  const cardAnimatedStyle = {
    opacity: cardOpacity,
    transform: [{translateX: cardTranslateX}],
  };

  const onSegmentLayout = useCallback(
    e => {
      const w = e?.nativeEvent?.layout?.width ?? 0;
      if (!w) return;
      segmentW.current = w;

      requestAnimationFrame(() => {
        animateThumbTo(pendingMode);
      });
    },
    [animateThumbTo, pendingMode],
  );

  const padding = getResponsiveHeight(4);
  const thumbStyle = useMemo(() => {
    const w = segmentW.current;
    const innerW = w ? w - padding * 2 : 0;
    const tabW = innerW ? innerW / 3 : 0;

    return [
      styles.segmentThumb,
      {
        left: padding,
        width: tabW || '33.333%',
        transform: [{translateX: thumbX}],
      },
    ];
  }, [thumbX, padding, modeIndex]);

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={handleApply}
      title="기간 설정"
      confirmText="적용하기"
      closeText="취소">
      <View style={styles.container}>
        {/* ✅ 세그먼트 탭 */}
        <View style={styles.segment} onLayout={onSegmentLayout}>
          <Animated.View pointerEvents="none" style={thumbStyle} />

          <SegmentTab
            label="전체"
            active={pendingMode === 'ALL'}
            onPress={() => animateToMode('ALL')}
          />
          <SegmentTab
            label="최근"
            active={pendingMode === 'RECENT'}
            onPress={() => animateToMode('RECENT')}
          />
          <SegmentTab
            label="월별"
            active={pendingMode === 'MONTH'}
            onPress={() => animateToMode('MONTH')}
          />
        </View>

        {/* ✅ 내용 카드 */}
        <Animated.View style={cardAnimatedStyle}>
          {mode === 'RECENT' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>최근 기준</Text>

              <View style={styles.chipRow}>
                <PresetChip
                  label="1주"
                  active={recentWeeks === 1}
                  onPress={() => setRecentWeeks(1)}
                />
                <PresetChip
                  label="2주"
                  active={recentWeeks === 2}
                  onPress={() => setRecentWeeks(2)}
                />
                <PresetChip
                  label="4주"
                  active={recentWeeks === 4}
                  onPress={() => setRecentWeeks(4)}
                />
              </View>

              <Text style={styles.cardHint}>
                최근 N주 동안의 추억을 모아볼 수 있어요.
              </Text>

              {/* ✅ 날짜 범위도 가운데로 */}
              <Text style={styles.rangeText}>
                {startDate} {startDate && endDate ? '~' : ''} {endDate}
              </Text>
            </View>
          )}

          {mode === 'MONTH' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>월별 선택</Text>

              <View style={styles.monthPicker}>
                <TouchableOpacity
                  style={styles.monthBtn}
                  onPress={() => handleChangeMonth(-1)}>
                  <Text style={styles.monthBtnText}>‹</Text>
                </TouchableOpacity>

                <View style={styles.monthCenter}>
                  <Text style={styles.monthMain}>
                    {year}.{String(month + 1).padStart(2, '0')}
                  </Text>
                  <Text style={styles.monthRange}>
                    {startDate} ~ {endDate}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.monthBtn}
                  onPress={() => handleChangeMonth(1)}>
                  <Text style={styles.monthBtnText}>›</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.cardHint}>
                선택한 달에 등록된 추억만 보여줘요.
              </Text>
            </View>
          )}

          {mode === 'ALL' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>전체 기간</Text>
              <Text style={styles.cardHint}>
                기간 제한 없이 모든 추억을 시간순으로 볼 수 있어요.
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </CustomModal>
  );
}

function SegmentTab({label, active, onPress}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.segmentTab}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PresetChip({label, active, onPress}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.85}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: getResponsiveHeight(2),
    marginBottom: getResponsiveHeight(7),

    // ✅ 전체 가운데 정렬(내용 전반)
    alignItems: 'center',
  },

  // ===== Segment =====
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    padding: getResponsiveHeight(4),
    gap: getResponsiveWidth(6),
    marginBottom: getResponsiveHeight(12),
    position: 'relative',
    overflow: 'hidden',

    // ✅ 자체는 full width 유지하면서 내부 요소는 가운데 느낌
    width: '100%',
  },
  segmentThumb: {
    position: 'absolute',
    top: getResponsiveHeight(4),
    bottom: getResponsiveHeight(4),
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.06)',
  },

  segmentTab: {
    flex: 1,
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  segmentText: {
    fontSize: getResponsiveFontSize(13),
    color: '#6B7280',
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
  },

  // ===== Card =====
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveWidth(14),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    gap: getResponsiveHeight(8),

    // ✅ 카드 내부 전부 가운데 정렬
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    textAlign: 'center',
    alignSelf: 'center',
  },
  cardHint: {
    fontSize: getResponsiveFontSize(11.5),
    color: COLORS.textTertiary,
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(16),
    textAlign: 'center',
  },

  // ✅ (선택) 범위 텍스트도 가운데
  rangeText: {
    fontSize: getResponsiveFontSize(11.5),
    color: '#6B7280',
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },

  // ===== Chips =====
  chipRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(8),
    width: '100%',

    // ✅ row 자체도 가운데로
    justifyContent: 'center',
  },
  chip: {
    flex: 1,
    paddingVertical: getResponsiveHeight(9),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: BUTTON_STYLES.saveBg,
    borderColor: BUTTON_STYLES.saveBg,
  },
  chipText: {
    fontSize: getResponsiveFontSize(12.5),
    color: '#4B5563',
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
  },
  chipTextActive: {
    color: '#fff',
    fontFamily: 'Pretendard-SemiBold',
  },

  // ===== Month Picker =====
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: getResponsiveWidth(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.07)',
    backgroundColor: 'rgba(0, 0, 0, 0.015)',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(10),
    width: '100%',
  },
  monthBtn: {
    width: getResponsiveWidth(36),
    height: getResponsiveWidth(36),
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnText: {
    fontSize: getResponsiveFontSize(22),
    color: '#111827',
    includeFontPadding: false,
    textAlign: 'center',
  },
  monthCenter: {
    alignItems: 'center',
    gap: getResponsiveHeight(2),
    flex: 1, // ✅ 가운데 영역 넓게 잡아서 진짜 중앙 느낌
  },
  monthMain: {
    fontSize: getResponsiveFontSize(14),
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
  monthRange: {
    fontSize: getResponsiveFontSize(11),
    color: '#6B7280',
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },
});
