/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/components/PeriodFilterModal.js

import React, {useEffect, useMemo, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

import CustomModal from 'components/modal/CustomModal';
import SlideSegment from 'components/SlideSegment';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
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

 // -------------------------
 // iOS: overlayChildren로 띄우는 액션시트 피커 상태/애니메이션
 // -------------------------
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [iosPickerWhich, setIosPickerWhich] = useState('start'); // 'start' | 'end'
  const [iosTempDate, setIosTempDate] = useState(today);

  const SHEET_H = useMemo(() => getResponsiveHeight(330), []);

  const sheetY = useRef(new Animated.Value(SHEET_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

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

  const openIOSActionSheet = useCallback(
    which => {
      const current = which === 'start' ? customStart : customEnd;

      setTarget(which);
      setIosPickerWhich(which);
      setIosTempDate(current);

      setIosPickerVisible(true);

 // 시작 상태
      sheetY.setValue(SHEET_H);
      backdropOpacity.setValue(0);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(sheetY, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });

      if (mode !== 'CUSTOM') setMode('CUSTOM');
    },
    [customStart, customEnd, mode, sheetY, SHEET_H, backdropOpacity],
  );

  const closeIOSActionSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheetY, {
        toValue: SHEET_H,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIosPickerVisible(false);
    });
  }, [SHEET_H, sheetY, backdropOpacity]);

  const confirmIOSActionSheet = useCallback(() => {
    const picked = iosTempDate;
    if (!picked) {
      closeIOSActionSheet();
      return;
    }

    if (iosPickerWhich === 'start') {
      setCustomStart(prev => mergeDateKeepTime(picked, prev));
    } else {
      setCustomEnd(prev => mergeDateKeepTime(picked, prev));
    }

    closeIOSActionSheet();
  }, [iosTempDate, iosPickerWhich, closeIOSActionSheet, mergeDateKeepTime]);

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

 // iOS sheet reset
    setIosPickerVisible(false);
    setIosPickerWhich('start');
    setIosTempDate(today);
    sheetY.setValue(SHEET_H);
    backdropOpacity.setValue(0);
  }, [visible, today, cardOpacity, sheetY, SHEET_H, backdropOpacity]);

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
        <Text allowFontScaling={false} style={styles.subText}>
          전체 추억을 한 번에 보여줘요.
        </Text>
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
          <Text allowFontScaling={false} style={styles.subText}>
            선택한 달의 추억만 모아 보여줘요.
          </Text>

          <View style={styles.monthPicker}>
            <TouchableOpacity
              style={styles.monthBtn}
              onPress={() => changeMonth(-1)}
              activeOpacity={0.85}>
              <Text allowFontScaling={false} style={styles.monthBtnText}>
                ‹
              </Text>
            </TouchableOpacity>

            <View style={styles.monthCenter}>
              <Text allowFontScaling={false} style={styles.monthMain}>
                {year}.{pad2(month + 1)}
              </Text>
              <Text allowFontScaling={false} style={styles.monthSub}>
                {formatYMD(startOfMonth(year, month))} ~{' '}
                {formatYMD(endOfMonth(year, month))}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.monthBtn}
              onPress={() => changeMonth(1)}
              activeOpacity={0.85}>
              <Text allowFontScaling={false} style={styles.monthBtnText}>
                ›
              </Text>
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
        <Text allowFontScaling={false} style={styles.subText}>
          원하는 날짜 범위를 골라볼 수 있어요.
        </Text>

        <TouchableOpacity
          style={[styles.dateRow, target === 'start' && styles.dateRowActive]}
          activeOpacity={0.85}
          onPress={() => {
            setTarget('start');
            if (Platform.OS === 'android') openAndroidDatePicker('start');
            if (Platform.OS === 'ios') openIOSActionSheet('start');
          }}>
          <Text allowFontScaling={false} style={styles.dateLabel}>
            시작
          </Text>
          <Text allowFontScaling={false} style={styles.dateValue}>
            {formatYMD(customStart)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateRow, target === 'end' && styles.dateRowActive]}
          activeOpacity={0.85}
          onPress={() => {
            setTarget('end');
            if (Platform.OS === 'android') openAndroidDatePicker('end');
            if (Platform.OS === 'ios') openIOSActionSheet('end');
          }}>
          <Text allowFontScaling={false} style={styles.dateLabel}>
            종료
          </Text>
          <Text allowFontScaling={false} style={styles.dateValue}>
            {formatYMD(customEnd)}
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'android' && (
          <Text allowFontScaling={false} style={styles.hintText}>
            시작/종료를 눌러 날짜를 선택해줘요.
          </Text>
        )}
        {Platform.OS === 'ios' && (
          <Text allowFontScaling={false} style={styles.hintText}>
            시작/종료를 누르면 아래에서 날짜 선택 창이 올라와요.
          </Text>
        )}
      </View>
    );
  };

 // -------------------------
 // iOS ActionSheet UI (overlayChildren로 올릴 내용)
 // -------------------------
  const iosOverlay = Platform.OS === 'ios' && iosPickerVisible && (
    <View style={[StyleSheet.absoluteFill, {justifyContent: 'flex-end'}]}>
      {/* 백드롭 */}
      <Animated.View
        style={[styles.sheetBackdrop, {opacity: backdropOpacity}]}>
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={closeIOSActionSheet}
        />
      </Animated.View>

      {/* 시트 */}
      <Animated.View
        style={[styles.sheetBox, {transform: [{translateY: sheetY}]}]}
        pointerEvents="auto">
        <View style={styles.sheetHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={closeIOSActionSheet}
            style={styles.sheetHeaderBtn}>
            <Text allowFontScaling={false} style={styles.sheetHeaderText}>
              취소
            </Text>
          </TouchableOpacity>

          <Text allowFontScaling={false} style={styles.sheetTitle}>
            {iosPickerWhich === 'start' ? '시작 날짜' : '종료 날짜'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={confirmIOSActionSheet}
            style={styles.sheetHeaderBtn}>
            <Text
              allowFontScaling={false}
              style={[styles.sheetHeaderText, {color: 'black'}]}>
              선택
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sheetPickerArea}>
          <DateTimePicker
            value={iosTempDate}
            mode="date"
            display="spinner"
            locale="ko-KR"
            onChange={(event, selectedDate) => {
              if (!selectedDate) return;
              setIosTempDate(selectedDate);
            }}
            style={{
              width: '100%',
              height: getResponsiveHeight(220),
              alignSelf: 'center',
            }}
          />
        </View>

        <View style={{height: getResponsiveHeight(14)}} />
      </Animated.View>
    </View>
  );

  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={() => {
 // 시트가 떠있으면 먼저 닫고 모달 닫기
        if (iosPickerVisible) closeIOSActionSheet();
        onClose?.();
      }}
      onRequestClose={() => {
        if (iosPickerVisible) closeIOSActionSheet();
        onClose?.();
      }}
      onConfirm={onConfirm}
      title="기간 설정"
      confirmText="적용하기"
      closeText="취소"
      overlayChildren={iosOverlay}>
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
    </CustomModal>
  );
}

const styles = StyleSheet.create({
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
    fontSize: getResponsiveFontSize(22),
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
    fontSize: getResponsiveFontSize(15),
    color: 'black',
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
  },
  monthSub: {
    fontSize: getResponsiveFontSize(11),
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
    borderColor: 'rgba(17,24,39,0.35)',
    backgroundColor: '#fff',
  },
  dateLabel: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.textTertiary,
    fontFamily: 'Pretendard-Medium',
  },
  dateValue: {
    fontSize: getResponsiveFontSize(12.5),
    color: 'black',
    fontFamily: 'Pretendard-SemiBold',
  },

  subText: {
    fontSize: getResponsiveFontSize(12),
    color: COLORS.textSecondary,
    fontFamily: 'Pretendard-Medium',
    alignSelf: 'center',
    paddingVertical: getResponsiveHeight(6),
  },

  hintText: {
    marginTop: getResponsiveHeight(6),
    fontSize: getResponsiveFontSize(11.5),
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
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: '#6B7280',
    textAlign: 'center',
  },
  sheetTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: 'black',
    textAlign: 'center',
  },
  sheetPickerArea: {
    paddingVertical: getResponsiveHeight(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
