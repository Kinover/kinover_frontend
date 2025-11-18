import React from 'react';
import {StyleSheet} from 'react-native';
import CustomModal from '../../../components/customModal';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

export default function ImageDeleteModal({
  visible,
  onClose,
  onConfirm,
  children,
}) {

  if(!visible) return null;
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      closeText="취소"
      confirmText="삭제"
      buttonBottomStyle={styles.buttonRow}
      modalBoxStyle={[styles.modalBox]}>
      {children}
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalBox: {
    width: getResponsiveWidth(320),
    maxWidth: '90%',
    alignSelf: 'center',
    position: 'relative', // ✅ zIndex 적용되도록 position 추가
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  closeText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },
  confirmText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
    color: 'black',
  },
});
