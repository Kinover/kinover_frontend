// src/screens/memory/components/PeriodFilterModal.js
import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import CustomModal from 'components/CustomModal';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {BUTTON_STYLES} from 'styles/style';

function formatYMD(date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function PeriodFilterModal({
  visible,
  onClose,
  onApply, // ({ startDate, endDate }) => void
  initialStartDate, // 호환용 (안 써도 됨)
  initialWeeks = 1, // 호환용 (안 써도 됨)
}) {
  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState('ALL'); // 'ALL' | 'RECENT' | 'MONTH'
  const [recentWeeks, setRecentWeeks] = useState(1); // 1 / 2 / 4
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0~11

  useEffect(() => {
    if (!visible) return;
    setMode('ALL');
    setRecentWeeks(initialWeeks >= 1 && initialWeeks <= 4 ? initialWeeks : 1);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }, [visible, initialWeeks, today]);

  const {startDate, endDate, summaryText, subtitleText} = useMemo(() => {
    if (mode === 'ALL') {
      return {
        startDate: '',
        endDate: '',
        summaryText: '전체 기간',
        subtitleText: '모든 추억을 한 번에 모아볼게요',
      };
    }

    if (mode === 'RECENT') {
      const end = new Date();
      const start = new Date();
      const days = recentWeeks * 7 - 1;
      start.setDate(end.getDate() - days);

      return {
        startDate: formatYMD(start),
        endDate: formatYMD(end),
        summaryText: `최근 ${recentWeeks}주`,
        subtitleText: `${formatYMD(start)} ~ ${formatYMD(end)}`,
      };
    }

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    return {
      startDate: formatYMD(start),
      endDate: formatYMD(end),
      summaryText: `${year}.${String(month + 1).padStart(2, '0')}`,
      subtitleText: '선택한 달의 추억만 모아볼게요',
    };
  }, [mode, recentWeeks, year, month]);

  const handleChangeMonth = useCallback(
    diff => {
      setMode('MONTH');

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
    [year, month],
  );

  const handleApply = useCallback(() => {
    onApply({startDate, endDate});
  }, [onApply, startDate, endDate]);

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={handleApply}
      title="기간 설정"
      confirmText="적용하기"
      closeText="취소">
      <View style={styles.container}>
        {/* 요약 카드 */}
        {/* <View style={styles.summaryCard}>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>{summaryText}</Text>
          </View>
          <Text style={styles.summarySub}>{subtitleText}</Text>
        </View> */}

        {/* 세그먼트 탭 */}
        <View style={styles.segment}>
          <SegmentTab
            label="전체"
            active={mode === 'ALL'}
            onPress={() => setMode('ALL')}
          />
          <SegmentTab
            label="최근"
            active={mode === 'RECENT'}
            onPress={() => setMode('RECENT')}
          />
          <SegmentTab
            label="월별"
            active={mode === 'MONTH'}
            onPress={() => setMode('MONTH')}
          />
        </View>

        {/* 내용 카드 */}
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
          </View>
        )}

        {mode === 'MONTH' && (
          <View style={styles.card}>
            <Text style={styles.cardTitleCenter}>월별 선택</Text>

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
      </View>
    </CustomModal>
  );
}

function SegmentTab({label, active, onPress}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.segmentTab, active && styles.segmentTabActive]}>
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
  },

  // ===== Summary =====
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 231, 178, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 77, 0.45)',
    borderRadius: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    marginBottom: getResponsiveHeight(12),
    gap: getResponsiveHeight(6),
  },
  summaryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 999,
    backgroundColor: '#FFC84D',
  },
  summaryBadgeText: {
    color: '#fff',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12),
  },
  summarySub: {
    color: '#374151',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12.5),
    lineHeight: getResponsiveHeight(18),
  },

  // ===== Segment =====
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    padding: getResponsiveHeight(4),
    gap: getResponsiveWidth(6),
    marginBottom: getResponsiveHeight(12),
  },
  segmentTab: {
    flex: 1,
    paddingVertical: getResponsiveHeight(8),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.06)',
  },
  segmentText: {
    fontSize: getResponsiveFontSize(12),
    color: '#6B7280',
    fontFamily: 'Pretendard-Medium',
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
  },
  cardTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  cardTitleCenter: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    alignSelf: 'center',
  },
  cardHint: {
    fontSize: getResponsiveFontSize(11.5),
    color: '#9CA3AF',
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(16),
  },

  // ===== Chips =====
  chipRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(8),
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
    borderColor: 'rgba(255, 200, 77, 0.35)',
    backgroundColor: 'rgba(255, 231, 178, 0.18)',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(10),
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
  },
  monthCenter: {
    alignItems: 'center',
    gap: getResponsiveHeight(2),
  },
  monthMain: {
    fontSize: getResponsiveFontSize(14),
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
  },
  monthRange: {
    fontSize: getResponsiveFontSize(11),
    color: '#6B7280',
    fontFamily: 'Pretendard-Regular',
  },
});
