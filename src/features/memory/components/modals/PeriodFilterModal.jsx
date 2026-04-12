/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/components/PeriodFilterModal.js

import React, {useEffect, useMemo, useState, useCallback, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import DatePicker from 'react-native-date-picker';

import CustomModal from 'components/modal/CustomModal';
import SlideSegment from 'components/SlideSegment';

import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';
import {BOTTOMSHEET_STYLE, COLORS} from 'styles/style';

const MODES = [
  {key: 'ALL', label: '전체'},
  {key: 'MONTH', label: '월별'},
  {key: 'CUSTOM', label: '직접'},
];

const SEG_PAD = getResponsiveHeight(4);
const pad2 = n => `${n}`.padStart(2, '0');

const formatYMD = d => {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
};

const startOfMonth = (y, m) => new Date(y, m, 1, 0, 0, 0);
const endOfMonth = (y, m) => new Date(y, m + 1, 0, 23, 59, 0);

export default function PeriodFilterModal({visible, onClose, onApply}) {
  const styles = useScaledStyleSheet(rf => ({
    container: {
      width: '100%',
      paddingTop: getResponsiveHeight(2),
      marginBottom: getResponsiveHeight(7),
      alignItems: 'center',
    },

    card: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: getResponsiveWidth(14),
      borderWidth: 1,
      borderColor: '#F1F5F9',
      paddingVertical: getResponsiveHeight(14),
      paddingHorizontal: getResponsiveWidth(12),
      alignItems: 'center',
    },

    monthPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: getResponsiveWidth(12),
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.07)',
      backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
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
      fontSize: rf(22),
      color: 'black',
      includeFontPadding: false,
      textAlign: 'center',
    },
    monthCenter: {
      alignItems: 'center',
      gap: getResponsiveHeight(2),
      flex: 1,
    },
    monthMain: {
      fontSize: rf(15),
      color: 'black',
      fontFamily: 'Pretendard-SemiBold',
      textAlign: 'center',
    },
    monthSub: {
      fontSize: rf(11),
      color: '#6B7280',
      fontFamily: 'Pretendard-Regular',
      textAlign: 'center',
    },

    dateRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: getResponsiveHeight(12),
      paddingHorizontal: getResponsiveWidth(12),
      borderRadius: getResponsiveWidth(12),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
    },
    dateRowActive: {
      borderColor: COLORS.brandPrimary,
      backgroundColor: '#fff',
    },
    dateLabel: {
      fontSize: rf(12),
      color: COLORS.textTertiary,
      fontFamily: 'Pretendard-Medium',
    },
    dateValue: {
      fontSize: rf(12.5),
      color: 'black',
      fontFamily: 'Pretendard-SemiBold',
    },

    subText: {
      fontSize: rf(12),
      color: COLORS.textSecondary,
      fontFamily: 'Pretendard-Medium',
      alignSelf: 'center',
      paddingVertical: getResponsiveHeight(6),
    },

    hintText: {
      marginTop: getResponsiveHeight(6),
      fontSize: rf(11.5),
      color: '#9CA3AF',
      fontFamily: 'Pretendard-Medium',
      textAlign: 'center',
    },

    segmentWrap: {
      backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      overflow: 'hidden',
      marginBottom: getResponsiveHeight(15),
    },

    // -------------------------
    // iOS ActionSheet styles (overlayChildren)
    // -------------------------
    sheetBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    sheetBox: {
      width: '100%',
      backgroundColor: '#fff',
      borderTopLeftRadius: getResponsiveWidth(18),
      borderTopRightRadius: getResponsiveWidth(18),
      overflow: 'hidden',
      borderTopWidth: 1,
      borderColor: 'rgba(0,0,0,0.06)',
    },
    sheetHeader: {
      height: getResponsiveHeight(50),
      paddingHorizontal: getResponsiveWidth(14),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.06)',
    },
    sheetHeaderBtn: {
      paddingVertical: getResponsiveHeight(8),
      paddingHorizontal: getResponsiveWidth(8),
      minWidth: getResponsiveWidth(56),
    },
    sheetHeaderText: {
      fontSize: rf(13),
      fontFamily: 'Pretendard-SemiBold',
      color: '#6B7280',
      textAlign: 'center',
    },
    sheetTitle: {
      fontSize: rf(13),
      fontFamily: 'Pretendard-SemiBold',
      color: 'black',
      textAlign: 'center',
    },
    sheetPickerArea: {
      paddingVertical: getResponsiveHeight(6),
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));
  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState('ALL');

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0~11

  // 직접 기간: 시간 유지(09:00 / 18:00)
  const [customStart, setCustomStart] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
  );
  const [customEnd, setCustomEnd] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0, 0),
  );

  const [target, setTarget] = useState('start'); // 'start' | 'end'
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // iOS: 기본 날짜 선택 모달 상태
  const [iosDatePickerOpen, setIosDatePickerOpen] = useState(false);
  const [iosPickerWhich, setIosPickerWhich] = useState('start'); // 'start' | 'end'
  const [iosTempDate, setIosTempDate] = useState(today);

  const mergeDateKeepTime = useCallback((nextDateOnly, keepDateTime) => {
    return new Date(
      nextDateOnly.getFullYear(),
      nextDateOnly.getMonth(),
      nextDateOnly.getDate(),
      keepDateTime.getHours(),
      keepDateTime.getMinutes(),
      0,
    );
  }, []);

  const openIOSDatePicker = useCallback(
    which => {
      const current = which === 'start' ? customStart : customEnd;

      setTarget(which);
      setIosPickerWhich(which);
      setIosTempDate(current);
      setIosDatePickerOpen(true);

      if (mode !== 'CUSTOM') setMode('CUSTOM');
    },
    [customStart, customEnd, mode],
  );

  const closeIOSDatePicker = useCallback(() => {
    setIosDatePickerOpen(false);
  }, []);

  const confirmIOSDatePicker = useCallback(
    pickedFromModal => {
      // 모달 onConfirm에서 setState 직후 호출하면 iosTempDate는 아직 이전 값이라
      // 반드시 인자로 받은 날짜를 사용해야 함
      const picked = pickedFromModal ?? iosTempDate;
      if (!picked) {
        closeIOSDatePicker();
        return;
      }

      if (iosPickerWhich === 'start') {
        setCustomStart(prev => mergeDateKeepTime(picked, prev));
      } else {
        setCustomEnd(prev => mergeDateKeepTime(picked, prev));
      }

      closeIOSDatePicker();
    },
    [iosTempDate, iosPickerWhich, closeIOSDatePicker, mergeDateKeepTime],
  );

  // -------------------------
  // range 계산
  // -------------------------
  const range = useMemo(() => {
    if (mode === 'ALL') return {startDate: '', endDate: ''};

    if (mode === 'MONTH') {
      const s = startOfMonth(year, month);
      const e = endOfMonth(year, month);
      return {startDate: formatYMD(s), endDate: formatYMD(e)};
    }

    // CUSTOM
    const s = customStart;
    const e = customEnd;

    if (s.getTime() <= e.getTime()) {
      return {startDate: formatYMD(s), endDate: formatYMD(e)};
    }
    return {startDate: formatYMD(e), endDate: formatYMD(s)};
  }, [mode, year, month, customStart, customEnd]);

  const fadeOnce = useCallback(
    cb => {
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }).start(() => {
        cb?.();
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      });
    },
    [cardOpacity],
  );

  const switchMode = useCallback(
    next => {
      if (next === mode) return;
      fadeOnce(() => setMode(next));
    },
    [mode, fadeOnce],
  );

  const changeMonth = useCallback(
    diff => {
      if (mode !== 'MONTH') switchMode('MONTH');

      let y = year;
      let m = month + diff;

      if (m < 0) {
        y -= 1;
        m = 11;
      } else if (m > 11) {
        y += 1;
        m = 0;
      }

      setYear(y);
      setMonth(m);
    },
    [mode, switchMode, year, month],
  );

  useEffect(() => {
    if (!visible) return;

    setMode('ALL');
    setYear(today.getFullYear());
    setMonth(today.getMonth());

    const s = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      9,
      0,
      0,
    );
    const e = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      18,
      0,
      0,
    );

    setCustomStart(s);
    setCustomEnd(e);
    setTarget('start');

    cardOpacity.setValue(1);

    // iOS picker reset
    setIosDatePickerOpen(false);
    setIosPickerWhich('start');
    setIosTempDate(today);
  }, [visible, today, cardOpacity]);

  const onConfirm = useCallback(() => {
    onApply?.(range);
  }, [onApply, range]);

  // -------------------------
  // Android: 다이얼로그 오픈
  // -------------------------
  const openAndroidDatePicker = useCallback(
    which => {
      const current = which === 'start' ? customStart : customEnd;

      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        display: 'spinner',
        onChange: (event, selectedDate) => {
          if (event?.type === 'dismissed') return;
          if (!selectedDate) return;

          if (which === 'start') {
            setCustomStart(prev => mergeDateKeepTime(selectedDate, prev));
          } else {
            setCustomEnd(prev => mergeDateKeepTime(selectedDate, prev));
          }

          if (mode !== 'CUSTOM') setMode('CUSTOM');
        },
      });
    },
    [customStart, customEnd, mergeDateKeepTime, mode],
  );

  const renderAnimatedContent = () => {
    if (mode === 'ALL') {
      return (
        <AppText style={styles.subText}>전체 추억을 한 번에 보여줘요.</AppText>
      );
    }

    if (mode === 'MONTH') {
      return (
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            gap: getResponsiveHeight(10),
          }}>
          <AppText style={styles.subText}>
            선택한 달의 추억만 모아 보여줘요.
          </AppText>

          <View style={styles.monthPicker}>
            <TouchableOpacity
              style={styles.monthBtn}
              onPress={() => changeMonth(-1)}
              activeOpacity={0.85}>
              <AppText style={styles.monthBtnText}>‹</AppText>
            </TouchableOpacity>

            <View style={styles.monthCenter}>
              <AppText style={styles.monthMain}>
                {year}.{pad2(month + 1)}
              </AppText>
              <AppText style={styles.monthSub}>
                {formatYMD(startOfMonth(year, month))} ~{' '}
                {formatYMD(endOfMonth(year, month))}
              </AppText>
            </View>

            <TouchableOpacity
              style={styles.monthBtn}
              onPress={() => changeMonth(1)}
              activeOpacity={0.85}>
              <AppText style={styles.monthBtnText}>›</AppText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // CUSTOM
    return (
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          gap: getResponsiveHeight(10),
        }}>
        <AppText style={styles.subText}>
          원하는 날짜 범위를 골라볼 수 있어요.
        </AppText>

        <TouchableOpacity
          style={[styles.dateRow, target === 'start' && styles.dateRowActive]}
          activeOpacity={0.85}
          onPress={() => {
            setTarget('start');
            if (Platform.OS === 'android') openAndroidDatePicker('start');
            if (Platform.OS === 'ios') openIOSDatePicker('start');
          }}>
          <AppText style={styles.dateLabel}>시작</AppText>
          <AppText style={styles.dateValue}>{formatYMD(customStart)}</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateRow, target === 'end' && styles.dateRowActive]}
          activeOpacity={0.85}
          onPress={() => {
            setTarget('end');
            if (Platform.OS === 'android') openAndroidDatePicker('end');
            if (Platform.OS === 'ios') openIOSDatePicker('end');
          }}>
          <AppText style={styles.dateLabel}>종료</AppText>
          <AppText style={styles.dateValue}>{formatYMD(customEnd)}</AppText>
        </TouchableOpacity>

      
      </View>
    );
  };

  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={() => {
        setIosDatePickerOpen(false);
        onClose?.();
      }}
      onRequestClose={() => {
        setIosDatePickerOpen(false);
        onClose?.();
      }}
      onConfirm={onConfirm}
      title="기간 설정"
      confirmText="적용">
      <View style={styles.container}>
        <SlideSegment
          items={MODES}
          value={mode}
          onChange={switchMode}
          padding={SEG_PAD}
          gap={getResponsiveWidth(6)}
          containerStyle={styles.segmentWrap}
          thumbStyle={{backgroundColor: 'black'}}
          textStyle={{color: '#6B7280'}}
          activeTextStyle={{color: '#FFFFFF'}}
        />

        <View style={styles.card}>
          <Animated.View style={{opacity: cardOpacity, width: '100%'}}>
            {renderAnimatedContent()}
          </Animated.View>
        </View>
      </View>

      {Platform.OS === 'ios' && (
        <DatePicker
          modal
          open={iosDatePickerOpen}
          date={iosTempDate}
          mode="date"
          locale="ko"
          title={iosPickerWhich === 'start' ? '시작 날짜' : '종료 날짜'}
          confirmText="확인"
          cancelText="취소"
          onConfirm={picked => {
            setIosTempDate(picked);
            confirmIOSDatePicker(picked);
          }}
          onCancel={closeIOSDatePicker}
        />
      )}
    </CustomModal>
  );
}
