import React from 'react';
import CustomModal from '../../../../components/customModal';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../../utils/responsive';

export default function CategoryModal({visible, onClose, onConfirm, content}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      closeText="취소하기"
      confirmText="추가하기"
      modalBoxStyle={styles.modalBox}
      closeTextStyle={styles.closeText}
      confirmTextStyle={styles.confirmText}
      confirmButtonStyle={styles.confirmButton}
      closeButtonStyle={styles.closeButton}
      buttonBottomStyle={styles.buttonRow}
      children={content}
    />
  );
}

const styles = StyleSheet.create({
  modalBox: {
    width: getResponsiveWidth(300),
  },
  closeText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
  },
  confirmText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
    color: 'black',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    justifyContent: 'space-between',
  },
});
