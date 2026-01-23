// YMDPickerModal.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Svg, {Path} from 'react-native-svg';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useYMDPickerState} from '../hooks/useYMDPickerState';
import {BACKGROUND_COLORS, BUTTON_STYLES, COLORS} from 'styles/style';

export default function YMDPickerModal({
  visible,
  onClose,
  onConfirm,
  initialDate = new Date(),
  minYear = 2000,
  maxYear = 2100,
}) {
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
              <Text allowFontScaling={false} style={styles.title}>날짜 선택</Text>

              <View style={styles.row}>
                {/* 년 */}
                <View style={styles.col}>
                  <Text allowFontScaling={false} style={styles.colLabel}>년</Text>
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
                  <Text style={styles.colLabel}>월</Text>
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
                  <Text style={styles.colLabel}>일</Text>
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
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.confirm]}
                  onPress={handleConfirm}>
                  <Text style={styles.confirmText}>확인</Text>
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

const styles = StyleSheet.create({
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
    fontFamily: 'Pretendard-SemiBold',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(16.5)
        : getResponsiveFontSize(17.5),
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
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.5),
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
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14),
    color: '#111827',
    paddingVertical: getResponsiveHeight(10),
    paddingRight: getResponsiveWidth(26),
  },

  pickerPlaceholder: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14),
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
    backgroundColor: BUTTON_STYLES().saveBg,
    borderColor: BUTTON_STYLES().saveBg,
  },

  cancelText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: BUTTON_STYLES().fontSize,
    color: '#6B7280',
  },

  confirmText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: BUTTON_STYLES().fontSize,
    color: '#FFFFFF',
  },
});
