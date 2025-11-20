// YMDPickerModal.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Svg, {Path} from 'react-native-svg';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useYMDPickerState} from '../hooks/useYMDPickerState';

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
        stroke="#B0B4BF"
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
      <TouchableWithoutFeedback>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>날짜 선택</Text>

            <View style={styles.row}>
              {/* Year */}
              <View style={styles.col}>
                <Text style={styles.colLabel}>년</Text>
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

              {/* Month */}
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

              {/* Day */}
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
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: getResponsiveWidth(500),
    borderRadius: 20,
    backgroundColor: '#FFF',
    paddingVertical: getResponsiveHeight(20),
    paddingHorizontal: getResponsiveWidth(20),
  },
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(18),
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(20),
  },
  row: {
    flexDirection: 'row',
    marginTop: getResponsiveHeight(6),
    alignItems: 'center',
    gap: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 96,
    paddingHorizontal: 4,
  },
  colLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14),
    color: '#777',
  },

  // ▼ RNPickerSelect용 스타일
  pickerBox: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 46,
    position: 'relative',
  },
  pickerInput: {
    color:'gray',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'left',
    paddingVertical: 10,
    paddingRight: 24, // 화살표 공간 확보
  },
  pickerPlaceholder: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Medium',
    textAlign: 'left',
    color: '#999',
    paddingVertical: 10,
    paddingRight: 24,
  },
  pickerIconContainer: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -8, // 세로 가운데 맞추기
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: getResponsiveHeight(20),
  },
  btn: {
    flex: 1,
    textAlignVertical: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancel: {backgroundColor: '#F1F1F1'},
  confirm: {backgroundColor: '#FFC84D'},
  cancelText: {
    textAlign: 'center',
    color: '#A1A5AF',
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-bold',
  },
  confirmText: {
    color: 'white',
    textAlign: 'center',
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-bold',
  },
});
