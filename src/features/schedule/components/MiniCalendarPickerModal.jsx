/* eslint-disable react-native/no-inline-styles */
// src/features/schedule/components/MiniCalendarPickerModal.jsx

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, TouchableOpacity, Platform, useWindowDimensions} from 'react-native';

import DateTimePicker, {DateTimePickerAndroid} from '@react-native-community/datetimepicker';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';

import {FONT_MODE} from 'store/uiSlice';
import {useReduxFontMode} from 'hooks/useReduxFontMode';

import CustomModal from 'components/modal/CustomModal';

const pad2 = n => String(n).padStart(2, '0');
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const toMidday = d => {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
};

const getDowLabel = date => {
  const dd = date.getDay();
  return ['일', '월', '화', '수', '목', '금', '토'][dd] || '';
};

const makeMinDate = minYear => toMidday(new Date(minYear, 0, 1));
const makeMaxDate = maxYear => toMidday(new Date(maxYear, 11, 31));

const makeDateSafe = (date, minYear, maxYear) => {
  const d = toMidday(date || new Date());
  const yy = clamp(d.getFullYear(), minYear, maxYear);
  const mm = d.getMonth();
  const dd = d.getDate();

  const next = toMidday(new Date(yy, mm, dd));
  const minD = makeMinDate(minYear);
  const maxD = makeMaxDate(maxYear);

  if (next < minD) return minD;
  if (next > maxD) return maxD;
  return next;
};

export default function MiniCalendarPickerModal({
  visible,
  onRequestClose,
  onClose,
  onConfirm,

  initialDate,
  minYear = 1950,
  maxYear = new Date().getFullYear(),

  defaultYear = new Date().getFullYear(),
  forceDefaultYear = false,

  closeOnPressOutside = true,
}) {
  const styles = useScaledStyleSheet(rf => ({

  modalBoxStyle: {},
  contentStyle: {marginTop: getResponsiveHeight(10)},
  /** 타이틀 아래 선택 날짜 — 모달 기본 subText보다 크고 진하게 */
  modalSelectedDateText: {
    fontSize: rf(16.5),
    lineHeight: rf(24),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    marginBottom: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(8),
  },
  panel: {alignItems: 'center', justifyContent: 'center', width: '100%'},

  pickerBox: {
    width: '100%',
    borderRadius: getResponsiveWidth(14),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },

  androidPickBtn: {
    width: '100%',
    borderRadius: getResponsiveWidth(14),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fff',
    paddingVertical: getResponsiveHeight(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidPickText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(13),
    color: 'black',
    textAlign: 'center',
  },

  resetBtn: {
    marginTop: getResponsiveHeight(10),
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveHeight(14),
    borderRadius: 999,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(12),
    color: '#fff',
    textAlign: 'center',
  },

  rangeHint: {
    marginTop: getResponsiveHeight(12),
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(11.5),
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom:getResponsiveHeight(16),
  },

  resetBtnIOS: {
    marginTop: getResponsiveHeight(10),
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveHeight(14),
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetTextIOS: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(12),
    color: 'black',
    textAlign: 'center',
  },

  }));
  const fontMode = useReduxFontMode();
  const isLargeFont = fontMode === FONT_MODE.LARGE;

  const baseDate = useMemo(() => {
    const safeDefaultYear = clamp(defaultYear, minYear, maxYear);

    if (!initialDate) {
      return makeDateSafe(new Date(safeDefaultYear, 0, 1), minYear, maxYear);
    }

    const dd = toMidday(initialDate);

    if (forceDefaultYear) {
      return makeDateSafe(
        new Date(safeDefaultYear, dd.getMonth(), dd.getDate()),
        minYear,
        maxYear,
      );
    }

    return makeDateSafe(dd, minYear, maxYear);
  }, [initialDate, defaultYear, minYear, maxYear, forceDefaultYear]);

  const [pickedDate, setPickedDate] = useState(baseDate);

  useEffect(() => {
    if (!visible) return;
    setPickedDate(baseDate);
  }, [visible, baseDate]);

  const subtitle = useMemo(() => {
    const d = pickedDate || baseDate;
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(
      d.getDate(),
    )} (${getDowLabel(d)})`;
  }, [pickedDate, baseDate]);

  const minDate = useMemo(() => makeMinDate(minYear), [minYear]);
  const maxDate = useMemo(() => makeMaxDate(maxYear), [maxYear]);

  const requestClose = useCallback(() => {
    if (onRequestClose) return onRequestClose();
    return onClose?.();
  }, [onRequestClose, onClose]);

  const handleConfirm = useCallback(() => {
    const next = makeDateSafe(pickedDate, minYear, maxYear);
    onConfirm?.(next);
  }, [pickedDate, minYear, maxYear, onConfirm]);

  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const resetToBase = useCallback(() => {
    setPickedDate(baseDate);
  }, [baseDate]);

  // iOS width 실측 유지(너가 원했던 “width는 숫자”)
  const {width: windowW} = useWindowDimensions();
  const [pickerBoxWidth, setPickerBoxWidth] = useState(0);

  const fallbackPickerWidth = useMemo(() => {
    const estimated = windowW - getResponsiveWidth(90);
    return Math.max(260, Math.floor(estimated));
  }, [windowW]);

  const onPickerBoxLayout = useCallback(e => {
    const w = Math.floor(e?.nativeEvent?.layout?.width || 0);
    if (!w || w <= 0) return;
    setPickerBoxWidth(prev => (prev > 0 ? prev : w));
  }, []);

  const datePickerWidth =
    pickerBoxWidth > 0 ? pickerBoxWidth : fallbackPickerWidth;

  const handleChangeIOS = useCallback(
    (event, selectedDate) => {
      if (event?.type === 'dismissed') return;
      if (!selectedDate) return;
      setPickedDate(makeDateSafe(selectedDate, minYear, maxYear));
    },
    [minYear, maxYear],
  );

  const openAndroidPicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: pickedDate || baseDate,
      mode: 'date',
      display: 'spinner',
      minimumDate: minDate,
      maximumDate: maxDate,
      onChange: (event, selectedDate) => {
        if (event?.type === 'dismissed') return;
        if (!selectedDate) return;
        setPickedDate(makeDateSafe(selectedDate, minYear, maxYear));
      },
    });
  }, [pickedDate, baseDate, minDate, maxDate, minYear, maxYear]);

  return (
    <CustomModal
      visible={!!visible}
      title="날짜 선택"
      subText={subtitle}
      onRequestClose={requestClose}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      closeText="취소"
      confirmText="확인"
      showCloseButton={true}
      closeOnBackdropPress={closeOnPressOutside}
      modalBoxStyle={styles.modalBoxStyle}
      contentStyle={styles.contentStyle}
      subTextStyle={styles.modalSelectedDateText}>
      <View style={styles.panel}>
        {Platform.OS === 'ios' ? (
          <>
            <View style={styles.pickerBox} onLayout={onPickerBoxLayout}>
              <DateTimePicker
                value={pickedDate}
                mode="date"
                display="spinner"
                locale="ko-KR"
                minimumDate={minDate}
                maximumDate={maxDate}
                onChange={handleChangeIOS}
                style={{
                  width: datePickerWidth,
                  height: getResponsiveHeight(isLargeFont ? 230 : 210),
                  alignSelf: 'center',
                }}
              />
            </View>

            <AppText allowFontScaling={false} style={styles.rangeHint}>
              선택 가능 범위: {minYear}년 1월 1일 ~ {maxYear}년 12월 31일
            </AppText>

            {/* <TouchableOpacity
              activeOpacity={0.9}
              onPress={resetToBase}
              style={styles.resetBtnIOS}>
              <AppText allowFontScaling={false} style={styles.resetTextIOS}>
                기본값으로 되돌리기
              </AppText>
            </TouchableOpacity> */}
          </>
        ) : (
          <>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openAndroidPicker}
              style={styles.androidPickBtn}>
              <AppText allowFontScaling={false} style={styles.androidPickText}>
                날짜 고르기
              </AppText>
            </TouchableOpacity>

            {/* <TouchableOpacity
              activeOpacity={0.9}
              onPress={resetToBase}
              style={styles.resetBtn}>
              <AppText allowFontScaling={false} style={styles.resetText}>
                기본값으로 되돌리기
              </AppText>
            </TouchableOpacity> */}

            <AppText allowFontScaling={false} style={styles.rangeHint}>
              선택 가능 범위: {minYear}년 1월 1일 ~ {maxYear}년 12월 31일
            </AppText>
          </>
        )}
      </View>
    </CustomModal>
  );
}

