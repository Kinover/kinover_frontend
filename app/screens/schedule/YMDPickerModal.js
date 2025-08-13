// YMDPickerModal.js
import React, {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';

const pad2 = n => n.toString().padStart(2, '0');
const daysInMonth = (y, m) => new Date(y, m, 0).getDate(); // m: 1~12

export default function YMDPickerModal({
  visible,
  onClose,
  onConfirm,
  initialDate = new Date(),
  minYear = 2000,
  maxYear = 2100,
}) {
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth() + 1); // 1~12
  const [day, setDay] = useState(initialDate.getDate());

  // visible 열릴 때 초기화
  useEffect(() => {
    if (visible) {
      setYear(initialDate.getFullYear());
      setMonth(initialDate.getMonth() + 1);
      setDay(initialDate.getDate());
    }
  }, [visible, initialDate]);

  const yearOptions = useMemo(
    () => Array.from({length: maxYear - minYear + 1}, (_, i) => minYear + i),
    [minYear, maxYear],
  );
  const monthOptions = useMemo(
    () => Array.from({length: 12}, (_, i) => i + 1),
    [],
  );
  const dayOptions = useMemo(() => {
    const len = daysInMonth(year, month);
    return Array.from({length: len}, (_, i) => i + 1);
  }, [year, month]);

  // 월/년 바뀌면 기존 day가 넘치지 않도록 보정
  useEffect(() => {
    const len = daysInMonth(year, month);
    if (day > len) setDay(len);
  }, [year, month, day]);

  const handleConfirm = () => {
    const selected = new Date(year, month - 1, day);
    onConfirm(selected);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>날짜 선택</Text>

          <View style={styles.row}>
            {/* Year */}
            <View style={styles.col}>
              <Text style={styles.colLabel}>년</Text>
              <Picker
                selectedValue={year}
                onValueChange={setYear}
                itemStyle={styles.pickerItem}
                style={styles.picker}
                mode={Platform.OS === 'android' ? 'dropdown' : undefined} // ✅ Android 드롭다운
              >
                {yearOptions.map(y => (
                  <Picker.Item key={y} label={`${y}`} value={y} />
                ))}
              </Picker>
            </View>

            {/* Month */}
            <View style={styles.col}>
              <Text style={styles.colLabel}>월</Text>
              <Picker
                selectedValue={month}
                onValueChange={setMonth}
                itemStyle={styles.pickerItem}
                style={styles.picker}
                mode={Platform.OS === 'android' ? 'dropdown' : undefined}>
                {monthOptions.map(m => (
                  <Picker.Item key={m} label={pad2(m)} value={m} />
                ))}
              </Picker>
            </View>

            {/* Day */}
            <View style={styles.col}>
              <Text style={styles.colLabel}>일</Text>
              <Picker
                selectedValue={day}
                onValueChange={setDay}
                itemStyle={styles.pickerItem}
                style={styles.picker}
                mode={Platform.OS === 'android' ? 'dropdown' : undefined}>
                {dayOptions.map(d => (
                  <Picker.Item key={d} label={pad2(d)} value={d} />
                ))}
              </Picker>
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
    // height:'40%',
    maxWidth: 480, // ✅ 너무 넓지 않게
    borderRadius: 14,
    backgroundColor: '#FFF',
    paddingVertical: getResponsiveHeight(20),
    paddingHorizontal: getResponsiveWidth(20),
  },
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(18),
    color: '#111',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(20),
  },
  row: {
    flexDirection: 'row',
    marginTop: getResponsiveHeight(6),
    alignItems: 'center',
  },
  col: {flex: 1, alignItems: 'center'},
  colLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14),
    color: '#777',
    marginBottom: 4,
  },
  picker: {width: '100%'},
  pickerItem: {height: getResponsiveHeight(120)},
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: getResponsiveHeight(6),
  },
  btn: {
    flex: 1,
    textAlignVertical: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancel: {backgroundColor: '#F1F1F1'},
  confirm: {backgroundColor: '#FFC84D'},
  cancelText: {
    textAlign: 'center',
    color: '#333',
    fontFamily: 'Pretendard-Medium',
  },
  confirmText: {
    color: '#111',
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
  },
});
