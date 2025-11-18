// YMDPickerModal.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import Picker from 'react-native-picker-select';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import { useSelectModal } from '../hooks/useSelectModal';
import { useYMDPickerState } from '../hooks/useYMDPickerState';

// ---- ✅ 간단 커스텀 Select (Android용, 옵션 칸 크게) ----
function Select({value, options = [], onChange, title, placeholder = '선택'}) {
  const {
    open,
    selected,
    selectedIndex,
    openModal,
    closeModal,
    handleChange,
  } = useSelectModal(value, options);

  return (
    <>
      <TouchableOpacity
        style={sel.field}
        onPress={openModal}
        activeOpacity={0.8}>
        <Text style={[sel.valueText, !selected && sel.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={sel.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={sel.backdrop}>
          <View style={sel.sheet}>
            {!!title && (
              <View style={sel.stickyHeader}>
                <Text style={sel.title}>{title}</Text>
              </View>
            )}

            <FlatList
              data={options}
              keyExtractor={(it, idx) => String(it.value ?? idx)}
              initialScrollIndex={selectedIndex}
              getItemLayout={(_, index) => ({
                length: 56,
                offset: 56 * index,
                index,
              })}
              renderItem={({item}) => {
                const isSel = item.value === value;
                return (
                  <TouchableOpacity
                    style={[sel.option, isSel && sel.optionSelected]}
                    onPress={() => {
                      const next = handleChange(item.value);
                      onChange(next);
                    }}
                    activeOpacity={0.7}
                    android_ripple={{borderless: false}}>
                    <Text
                      style={[sel.optionText, isSel && sel.optionTextSelected]}>
                      {item.label}
                    </Text>
                    {isSel && (
                      <Image
                        style={{
                          position: 'absolute',
                          right: getResponsiveWidth(15),
                          width: getResponsiveWidth(16),
                          height: getResponsiveHeight(13),
                          resizeMode: 'contain',
                        }}
                        source={require('../../assets/icons/check-yellow.png')}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={sel.divider} />}
              contentContainerStyle={{paddingBottom: 8}}
              bounces={false}
            />

            <TouchableOpacity style={sel.close} onPress={closeModal}>
              <Text style={sel.closeText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const sel = StyleSheet.create({
  field: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    width: '100%',
  },
  valueText: {fontFamily: 'Pretendard-Medium', color: '#111', fontSize: 16},
  placeholder: {color: '#999'},
  chevron: {fontSize: 16, position: 'absolute', right: 12},
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  sheet: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: '60%',
    minWidth: '90%',
    alignSelf: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 8},
  },
  stickyHeader: {
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    backgroundColor: '#FFF',
  },
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    color: '#111',
    textAlign: 'center',
  },
  option: {
    paddingHorizontal: 16,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  optionSelected: {backgroundColor: '#FFF6DA'},
  optionText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 17,
    color: '#111',
    textAlign: 'center',
    flex: 1,
  },
  optionTextSelected: {fontFamily: 'Pretendard-SemiBold', fontWeight: 'bold'},
  divider: {height: 1, backgroundColor: '#EFEFEF', marginHorizontal: 12},
  close: {
    marginTop: 6,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  closeText: {fontFamily: 'Pretendard-Medium', color: '#4A4A4A'},
});

// ---- ✅ YMDPickerModal ----
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
    androidYearOptions,
    androidMonthOptions,
    androidDayOptions,
    handleConfirm,
  } = useYMDPickerState({
    visible,
    initialDate,
    minYear,
    maxYear,
    onConfirm,
  });

  const isAndroid = Platform.OS === 'android';

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
                {isAndroid ? (
                  <Select
                    value={year}
                    onChange={setYear}
                    title="년 선택"
                    options={androidYearOptions}
                  />
                ) : (
                  <Picker
                    selectedValue={year}
                    onValueChange={setYear}
                    itemStyle={styles.iosPickerItem}
                    style={styles.picker}>
                    {yearOptions.map(y => (
                      <Picker.Item key={y} label={`${y}`} value={y} />
                    ))}
                  </Picker>
                )}
              </View>

              {/* Month */}
              <View style={styles.col}>
                <Text style={styles.colLabel}>월</Text>
                {isAndroid ? (
                  <Select
                    value={month}
                    onChange={setMonth}
                    title="월 선택"
                    options={androidMonthOptions}
                  />
                ) : (
                  <Picker
                    selectedValue={month}
                    onValueChange={setMonth}
                    itemStyle={styles.iosPickerItem}
                    style={styles.picker}>
                    {monthOptions.map(m => (
                      <Picker.Item key={m} label={m.toString().padStart(2, '0')} value={m} />
                    ))}
                  </Picker>
                )}
              </View>

              {/* Day */}
              <View style={styles.col}>
                <Text style={styles.colLabel}>일</Text>
                {isAndroid ? (
                  <Select
                    value={day}
                    onChange={setDay}
                    title="일 선택"
                    options={androidDayOptions}
                  />
                ) : (
                  <Picker
                    selectedValue={day}
                    onValueChange={setDay}
                    itemStyle={styles.iosPickerItem}
                    style={styles.picker}>
                    {dayOptions.map(d => (
                      <Picker.Item
                        key={d}
                        label={d.toString().padStart(2, '0')}
                        value={d}
                      />
                    ))}
                  </Picker>
                )}
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
  picker: {width: '100%'},
  iosPickerItem: {
    fontSize: getResponsiveFontSize(12),
    lineHeight: 20,
    textAlign: 'center',
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
