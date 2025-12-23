// src/screens/memory/components/PeriodFilterModal.js
import React, {useEffect, useMemo, useState, useCallback, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
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
  // ✅ 1) 카드 슬라이드 전환 (이미 하던 것)
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

      const padding = getResponsiveHeight(4); // segment padding이랑 동일
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

    // thumb 초기화는 layout 잡힌 뒤에 onLayout에서 처리
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
        // mode랑 같아도 thumb는 안전하게 맞춰줌(레이아웃 후 재동기화용)
        animateThumbTo(nextMode);
        setPendingMode(nextMode);
        return;
      }

      isAnimatingRef.current = true;

      // ✅ 0) 세그먼트 알약 먼저 슥 이동(즉시)
      setPendingMode(nextMode);
      animateThumbTo(nextMode);

      // ✅ 1) 카드 페이드아웃 + 살짝 왼쪽
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
        // ✅ 2) 내용 교체
        setMode(nextMode);

        // ✅ 3) 새 카드 오른쪽에서 들어오기
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
      // 월별 모드로 전환(애니메이션)
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

      // ✅ 레이아웃 잡히면 현재 pendingMode 기준으로 thumb 위치 맞추기
      // (모달 첫 오픈 시 0에 붙어있는 문제 방지)
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
  }, [thumbX, padding, modeIndex]); // modeIndex 넣어야 리렌더 때 width 계산 갱신

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={handleApply}
      title="기간 설정"
      confirmText="적용하기"
      closeText="취소">
      <View style={styles.container}>
        {/* ✅ 세그먼트 탭 (알약 슬라이드) */}
        <View style={styles.segment} onLayout={onSegmentLayout}>
          {/* 흰색 알약(thumb) */}
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

        {/* ✅ 내용 카드(슬라이드 전환) */}
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
  },
  // ✅ 슬라이드되는 알약
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
    zIndex: 2, // thumb 위에 텍스트가 보이게
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
    borderColor: 'rgba(0, 0, 0, 0.07)',
    backgroundColor: 'rgba(0, 0, 0, 0.015)',
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
