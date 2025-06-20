import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import CustomModal from '../../../components/customModal';

export default function LogoutModal({ visible, onClose, onConfirm }) {
  return (
    <CustomModal
      visible={visible}
      onClose={onConfirm}
      onConfirm={onClose}
      confirmText="취소"
      closeText="로그아웃"
      confirmButtonStyle={styles.closeButton}
      closeButtonStyle={styles.confirmButton}
      confirmTextStyle={styles.modalText}
      closeTextStyle={[styles.modalText, { color: 'black' }]}
      buttonBottomStyle={styles.modalButtonRow}>
      <Text style={styles.modalTitle}>로그아웃 하시겠습니까?</Text>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: getResponsiveFontSize(17),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    marginBottom: getResponsiveHeight(6),
    marginTop: getResponsiveHeight(15),
    lineHeight: getResponsiveHeight(24),
  },
  modalText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(11),
    borderRadius: getResponsiveWidth(8),
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(11),
    borderRadius: getResponsiveWidth(8),
  },
});
