// src/screens/memory/components/PeriodFilterModal.js
import React, {useEffect, useMemo, useState} from 'react';
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
  const [mode, setMode] = useState('ALL'); // 'ALL' | 'RECENT' | 'MONTH' |
  const [recentWeeks, setRecentWeeks] = useState(1); // 1 / 2 / 4
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0~11

  // 모달 열릴 때 기본값 초기화
  useEffect(() => {
    if (!visible) return;
    setMode('ALL');
    setRecentWeeks(initialWeeks >= 1 && initialWeeks <= 4 ? initialWeeks : 1);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }, [visible, initialWeeks, today]);

  // 현재 선택 상태에 따라 실제 날짜 범위 계산
  const {startDate, endDate, summaryText} = useMemo(() => {
    if (mode === 'ALL') {
      return {
        startDate: '',
        endDate: '',
        summaryText: '전체 기간의 추억을 모두 볼게요',
      };
    }

    if (mode === 'RECENT') {
      const end = new Date();
      const start = new Date();
      const days = recentWeeks * 7 - 1; // 1주 → 7일, 2주 → 14일, 4주 → 28일
      start.setDate(end.getDate() - days);
      return {
        startDate: formatYMD(start),
        endDate: formatYMD(end),
        summaryText: `${formatYMD(start)} ~ ${formatYMD(
          end,
        )} (최근 ${recentWeeks}주)`,
      };
    }

    // mode === 'MONTH'
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      startDate: formatYMD(start),
      endDate: formatYMD(end),
      summaryText: `${year}.${String(month + 1).padStart(2, '0')} 한 달 전체`,
    };
  }, [mode, recentWeeks, year, month]);

  const handleChangeMonth = diff => {
    setMode('MONTH');
    setYear(prevYear => {
      let newYear = prevYear;
      let newMonth = month + diff;

      if (newMonth < 0) {
        newYear -= 1;
        newMonth = 11;
      } else if (newMonth > 11) {
        newYear += 1;
        newMonth = 0;
      }

      setMonth(newMonth);
      return newYear;
    });
  };

  const handleApply = () => {
    onApply({startDate, endDate});
  };

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={handleApply}
      title="기간 설정"
      confirmText="적용하기"
      closeText="취소">
      <View
        style={{
          position: 'relative',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* 요약 */}
        <Text style={styles.summary}>{summaryText}</Text>

        {/* 모드 탭: 최근 / 월별 / 전체 */}
        <View style={styles.modeTabs}>
          <ModeTab
            label="전체"
            active={mode === 'ALL'}
            onPress={() => setMode('ALL')}
          />
          <ModeTab
            label="최근"
            active={mode === 'RECENT'}
            onPress={() => setMode('RECENT')}
          />
          <ModeTab
            label="월별"
            active={mode === 'MONTH'}
            onPress={() => setMode('MONTH')}
          />
        </View>

        {/* 모드별 내용 */}
        {mode === 'RECENT' && (
          <View
            style={{
              position: 'relative',
              alignSelf: 'flex-start',
              marginTop: getResponsiveHeight(10),
              marginHorizontal: getResponsiveHeight(5),
            }}>
            <Text style={styles.sectionLabel}>최근 기준</Text>
            <View style={styles.chipRow}>
              <PresetChip
                label="최근 1주"
                active={recentWeeks === 1}
                onPress={() => setRecentWeeks(1)}
              />
              <PresetChip
                label="최근 2주"
                active={recentWeeks === 2}
                onPress={() => setRecentWeeks(2)}
              />
              <PresetChip
                label="최근 4주"
                active={recentWeeks === 4}
                onPress={() => setRecentWeeks(4)}
              />
            </View>
            <Text style={styles.helperText}>
              최소 1주 단위로, 최근 N주 동안의 추억을 볼 수 있어요.
            </Text>
          </View>
        )}

        {mode === 'MONTH' && (
          <View
            style={{
              position: 'relative',
              alignSelf: 'center',
              marginTop: getResponsiveHeight(10),
              marginHorizontal: getResponsiveHeight(5),
            }}>
            <Text style={[styles.sectionLabel, {alignSelf: 'center'}]}>
              월별 선택
            </Text>
            <View style={styles.monthRow}>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => handleChangeMonth(-1)}>
                <Text style={styles.monthArrowText}>◀</Text>
              </TouchableOpacity>

              <Text style={styles.monthText}>
                {year}.{String(month + 1).padStart(2, '0')}
              </Text>

              <TouchableOpacity
                style={styles.monthArrow}
                onPress={() => handleChangeMonth(1)}>
                <Text style={styles.monthArrowText}>▶</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              선택한 달에 등록된 추억만 모아볼게요.
            </Text>
          </View>
        )}

        {/* {mode === 'ALL' && (
          <View
            style={{
              position: 'relative',
              alignSelf: 'flex-start',
              marginTop: getResponsiveHeight(10),
              marginHorizontal: getResponsiveHeight(5),
            }}>
            <Text style={styles.sectionLabel}>전체 기간</Text>
            <Text style={styles.helperText}>
              기간 제한 없이, 모든 추억을 시간순으로 볼 수 있어요.
            </Text>
          </View>
        )} */}
      </View>
    </CustomModal>
  );
}

function ModeTab({label, active, onPress}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.modeTab, active && styles.modeTabActive]}>
      <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PresetChip({label, active, onPress}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  summary: {
    fontSize: getResponsiveFontSize(13),
    color: '#4B5563',
    marginBottom: getResponsiveHeight(10),
    textAlign: 'left',
  },

  // 모드 탭
  modeTabs: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    padding: getResponsiveHeight(3),
    marginBottom: getResponsiveHeight(10),
  },
  modeTab: {
    flex: 1,
    paddingVertical: getResponsiveHeight(8),
    borderRadius: 999,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    fontSize: getResponsiveFontSize(12),
    color: '#6B7280',
  },
  modeTabTextActive: {
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
  },

  sectionLabel: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: getResponsiveHeight(4),
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveWidth(6),
    // justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipActive: {
    // backgroundColor: '#FFC84D',
    backgroundColor: BUTTON_STYLES.saveBg,
    borderColor: BUTTON_STYLES.saveBg,

    // borderColor: '#FFC84D',
  },
  chipText: {
    fontSize: getResponsiveFontSize(12),
    color: '#4B5563',
  },
  chipTextActive: {
    fontFamily: 'Pretendard-Bold',
    // color: '#111827',
    color: 'white',
  },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveHeight(4),
  },
  monthArrow: {
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(4),
  },
  monthArrowText: {
    fontSize: getResponsiveFontSize(16),
    color: '#4B5563',
  },
  monthText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Medium',
    color: '#111827',
    marginHorizontal: getResponsiveWidth(12),
  },

  helperText: {
    fontSize: getResponsiveFontSize(11),
    color: '#9CA3AF',
    marginTop: getResponsiveHeight(6),
  },
});
