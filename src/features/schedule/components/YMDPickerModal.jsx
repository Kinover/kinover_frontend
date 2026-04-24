// YMDPickerModal.js
import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Platform } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Svg, {Path} from 'react-native-svg';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

import {useYMDPickerState} from '../hooks/useYMDPickerState';
import {BACKGROUND_COLORS, BUTTON_STYLES, COLORS} from 'styles/style';
import {FONTS} from 'styles/typography';

export default function YMDPickerModal({
  visible,
  onClose,
  onConfirm,
  initialDate = new Date(),
  minYear = 2000,
  maxYear = 2100,
}) {
  const styles = useScaledStyleSheet(rf => ({

  backdrop: {
    flex: 1,
    backgroundColor: BACKGROUND_COLORS.overlayBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveWidth(18),
  },

  card: {
    width: '100%',
    maxWidth: getResponsiveWidth(520),
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(22),
    paddingBottom: getResponsiveHeight(18),
    zIndex: 50,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },

  title: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize:
      Platform.OS === 'android'
        ? rf(16.5)
        : rf(17.5),
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: getResponsiveHeight(14),
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
  },

  col: {
    flex: 1,
    minWidth: getResponsiveWidth(96),
  },

  colLabel: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: rf(12.5),
    color: '#6B7280',
    marginBottom: getResponsiveHeight(6),
    paddingLeft: getResponsiveWidth(6),
  },

  pickerBox: {
    height: getResponsiveHeight(45),
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(12),
  },

  pickerInput: {
    fontFamily: FONTS.MEDIUM,
    fontSize: rf(14),
    color: '#111827',
    paddingVertical: getResponsiveHeight(10),
    paddingRight: getResponsiveWidth(26),
  },

  pickerPlaceholder: {
    fontFamily: FONTS.MEDIUM,
    fontSize: rf(14),
    color: COLORS.textTertiary,
  },

  pickerIconContainer: {
    position: 'absolute',
    right: getResponsiveWidth(0),
    top: '50%',
    marginTop: -8,
  },

  actions: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    marginTop: getResponsiveHeight(18),
  },

  btn: {
    flex: 1,
    height: getResponsiveHeight(44),
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  cancel: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },

  confirm: {
    backgroundColor: COLORS.brandPrimary,
    borderColor: COLORS.brandPrimary,
  },

  cancelText: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: BUTTON_STYLES().fontSize,
    color: '#6B7280',
  },

  confirmText: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: BUTTON_STYLES().fontSize,
    color: '#111827',
  },

  }));
  const {
    year,
    month,
    day,
    setYear,
    setMonth,
    setDay,
    yearOptions,
    monthOptions,
    dayOptions,
    handleConfirm,
  } = useYMDPickerState({
    visible,
    initialDate,
    minYear,
    maxYear,
    onConfirm,
  });

  const pickerCommonStyle = {
    inputIOS: styles.pickerInput,
    inputAndroid: styles.pickerInput,
    placeholder: styles.pickerPlaceholder,
    iconContainer: styles.pickerIconContainer,
  };

  const ArrowIcon = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M6 9l6 6 6-6"
        stroke={COLORS.textTertiary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <AppText allowFontScaling={false} style={styles.title}>날짜 선택</AppText>

              <View style={styles.row}>
                {/* 년 */}
                <View style={styles.col}>
                  <AppText allowFontScaling={false} style={styles.colLabel}>년</AppText>
                  <View style={styles.pickerBox}>
                    <RNPickerSelect
                      value={year}
                      onValueChange={setYear}
                      items={yearOptions.map(y => ({
                        label: `${y}`,
                        value: y,
                      }))}
                      useNativeAndroidPickerStyle={false}
                      style={pickerCommonStyle}
                      Icon={ArrowIcon}
                      placeholder={{}}
                    />
                  </View>
                </View>

                {/* 월 */}
                <View style={styles.col}>
                  <AppText allowFontScaling={false} style={styles.colLabel}>
                    월
                  </AppText>
                  <View style={styles.pickerBox}>
                    <RNPickerSelect
                      value={month}
                      onValueChange={setMonth}
                      items={monthOptions.map(m => ({
                        label: m.toString().padStart(2, '0'),
                        value: m,
                      }))}
                      useNativeAndroidPickerStyle={false}
                      style={pickerCommonStyle}
                      Icon={ArrowIcon}
                      placeholder={{}}
                    />
                  </View>
                </View>

                {/* 일 */}
                <View style={styles.col}>
                  <AppText style={styles.colLabel}>일</AppText>
                  <View style={styles.pickerBox}>
                    <RNPickerSelect
                      value={day}
                      onValueChange={setDay}
                      items={dayOptions.map(d => ({
                        label: d.toString().padStart(2, '0'),
                        value: d,
                      }))}
                      useNativeAndroidPickerStyle={false}
                      style={pickerCommonStyle}
                      Icon={ArrowIcon}
                      placeholder={{}}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancel]}
                  onPress={onClose}>
                  <AppText style={styles.cancelText}>취소</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.confirm]}
                  onPress={handleConfirm}>
                  <AppText style={styles.confirmText}>확인</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ================= styles ================= */

