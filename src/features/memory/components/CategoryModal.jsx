import React from 'react';
import {StyleSheet, Platform} from 'react-native';
import CustomModal from '../../../components/modal/CustomModal';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

export default function CategoryModal({visible, content, onClose, onConfirm}) {
  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={onClose}
      onRequestClose={onClose}
      closeOnBackdropPress={true}
      onConfirm={onConfirm}
      closeText="취소하기"
      confirmText="추가하기"
      title="새 카테고리를 입력해주세요">
      {content}
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
  },

  // 왼쪽: 취소
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
    color: '#111827',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  // 오른쪽: 추가
  confirmBtn: {
    backgroundColor: '#FFC84D',
    borderWidth: 1,
    borderColor: '#FFC84D',
  },
  confirmText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
    color: '#111827',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },
});
