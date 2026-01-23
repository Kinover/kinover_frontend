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

const MODES = [
  {key: 'ALL', label: '전체'},
  {key: 'RECENT', label: '최근'},
  {key: 'MONTH', label: '월별'},
];

export default function PeriodFilterModal({
  visible,
  onClose,
  onApply, // ({ startDate, endDate }) => void
  initialWeeks = 1,
}) {
  const today = useMemo(() => new Date(), []);

  // ✅ 단일 상태로 단순화
  const [mode, setMode] = useState('ALL');

  const [recentWeeks, setRecentWeeks] = useState(1);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // ✅ 카드 전환: 과하지 않게 페이드만
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // ✅ 세그먼트 thumb
  const segmentW = useRef(0);
  const thumbX = useRef(new Animated.Value(0)).current;

  const modeIndex = useMemo(() => {
    const idx = MODES.findIndex(m => m.key === mode);
    return idx < 0 ? 0 : idx;
  }, [mode]);

  // ✅ 열릴 때 초기화
  useEffect(() => {
    if (!visible) return;

    setMode('ALL');
    setRecentWeeks(initialWeeks >= 1 && initialWeeks <= 4 ? initialWeeks : 1);
    setYear(today.getFullYear());
    setMonth(today.getMonth());

    cardOpacity.setValue(1);
    thumbX.setValue(0);
  }, [visible, initialWeeks, today, cardOpacity, thumbX]);

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

  const animateThumb = useCallback(
    nextIndex => {
      const w = segmentW.current;
      if (!w) return;

      const padding = getResponsiveHeight(4);
      const innerW = w - padding * 2;
      const tabW = innerW / 3;

      Animated.spring(thumbX, {
        toValue: tabW * nextIndex,
        useNativeDriver: true,
        stiffness: 240,
        damping: 24,
        mass: 0.9,
      }).start();
    },
    [thumbX],
  );

  const fadeCardOnce = useCallback(
    cb => {
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 110,
        useNativeDriver: true,
      }).start(() => {
        cb?.();
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }).start();
      });
    },
    [cardOpacity],
  );

  const handleSelectMode = useCallback(
    nextMode => {
      if (nextMode === mode) return;

      const idx = MODES.findIndex(m => m.key === nextMode);
      animateThumb(idx);

      // ✅ 화면 변화는 부드럽게 “딱 한 번”만
      fadeCardOnce(() => {
        setMode(nextMode);
      });
    },
    [mode, animateThumb, fadeCardOnce],
  );

  const handleChangeMonth = useCallback(
    diff => {
      if (mode !== 'MONTH') {
        // 월 버튼 누르면 월별 모드로 자동 이동
        const idx = MODES.findIndex(m => m.key === 'MONTH');
        animateThumb(idx);
        fadeCardOnce(() => setMode('MONTH'));
      }

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
    [mode, year, month, animateThumb, fadeCardOnce],
  );

  const handleApply = useCallback(() => {
    onApply({startDate, endDate});
  }, [onApply, startDate, endDate]);

  const onSegmentLayout = useCallback(
    e => {
      const w = e?.nativeEvent?.layout?.width ?? 0;
      if (!w) return;
      segmentW.current = w;

      requestAnimationFrame(() => {
        animateThumb(modeIndex);
      });
    },
    [animateThumb, modeIndex],
  );

  const thumbStyle = useMemo(() => {
    const w = segmentW.current;
    const padding = getResponsiveHeight(4);
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
  }, [thumbX]);

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={handleApply}
      title="기간 설정"
      confirmText="적용하기"
      closeText="취소">
      <View style={styles.container}>
        {/* ✅ 세그먼트 */}
        <View style={styles.segment} onLayout={onSegmentLayout}>
          <Animated.View pointerEvents="none" style={thumbStyle} />

          {MODES.map(m => (
            <SegmentTab
              key={m.key}
              label={m.label}
              active={mode === m.key}
              onPress={() => handleSelectMode(m.key)}
            />
          ))}
        </View>

        {/* ✅ 카드: 톤 통일 + 페이드만 */}
        <Animated.View style={{opacity: cardOpacity, width: '100%'}}>
          <View style={styles.card}>
            {mode === 'ALL' && (
              <>
                <Text allowFontScaling={false} style={styles.cardTitle}>전체 보기</Text>
                <Text allowFontScaling={false} style={styles.cardHint}>
                  기간 제한 없이 모든 추억을 보여줘요.
                </Text>
                <Text allowFontScaling={false} style={styles.rangeText}>전체 기간</Text>
              </>
            )}

            {mode === 'RECENT' && (
              <>
                <Text allowFontScaling={false} style={styles.cardTitle}>최근 보기</Text>

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

                <Text allowFontScaling={false} style={styles.rangeText}>
                  {startDate} ~ {endDate}
                </Text>
              </>
            )}

            {mode === 'MONTH' && (
              <>
                <Text allowFontScaling={false} style={styles.cardTitle}>월별 보기</Text>

                <View style={styles.monthPicker}>
                  <TouchableOpacity
                    style={styles.monthBtn}
                    onPress={() => handleChangeMonth(-1)}
                    activeOpacity={0.85}>
                    <Text allowFontScaling={false} style={styles.monthBtnText}>‹</Text>
                  </TouchableOpacity>

                  <View style={styles.monthCenter}>
                    <Text allowFontScaling={false} style={styles.monthMain}>
                      {year}.{String(month + 1).padStart(2, '0')}
                    </Text>
                    <Text allowFontScaling={false} style={styles.monthRange}>
                      {startDate} ~ {endDate}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.monthBtn}
                    onPress={() => handleChangeMonth(1)}
                    activeOpacity={0.85}>
                    <Text allowFontScaling={false} style={styles.monthBtnText}>›</Text>
                  </TouchableOpacity>
                </View>

                <Text allowFontScaling={false} style={styles.cardHint}>
                  선택한 달에 등록된 추억만 보여줘요.
                </Text>
              </>
            )}
          </View>
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
      <Text allowFontScaling={false} style={[styles.segmentText, active && styles.segmentTextActive]}>
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
      <Text allowFontScaling={false} style={[styles.chipText, active && styles.chipTextActive]}>
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
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(12),
    gap: getResponsiveHeight(10),
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    textAlign: 'center',
  },
  cardHint: {
    fontSize: getResponsiveFontSize(11.5),
    color: COLORS.textTertiary,
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(16),
    textAlign: 'center',
  },
  rangeText: {
    fontSize: getResponsiveFontSize(12),
    color: '#374151',
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
  },

  // ===== Chips =====
  chipRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(8),
    width: '100%',
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
    backgroundColor: BUTTON_STYLES().saveBg,
    borderColor: BUTTON_STYLES().saveBg,
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
    flex: 1,
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
