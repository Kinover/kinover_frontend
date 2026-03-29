import React from 'react';
import {StyleSheet, Platform} from 'react-native';
import CustomModal from 'components/modal/CustomModal';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
} from 'utils/responsive';

export default function CategoryModal({visible, content, onClose, onConfirm}) {
  const styles = useScaledStyleSheet(rf => ({

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
    fontSize: rf(14),
    color: '#111827',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  confirmBtn: {
    backgroundColor: '#FFC84D',
    borderWidth: 1,
    borderColor: '#FFC84D',
  },
  confirmText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: rf(14),
    color: '#111827',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  }));
  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={onClose}
      onRequestClose={onClose}
      closeOnBackdropPress={true}
      onConfirm={onConfirm}
      closeText="취소"
      confirmText="추가하기"
      title="새 카테고리를 입력해주세요">
      {content}
    </CustomModal>
  );
}

