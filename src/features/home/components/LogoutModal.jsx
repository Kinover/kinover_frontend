import React from 'react';
import {StyleSheet, Platform } from 'react-native';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from 'utils/responsive';
import CustomModal from 'components/modal/CustomModal';
import {FONTS} from 'styles/typography';
export default function LogoutModal({ visible, onClose, onConfirm }) {
  const styles = useScaledStyleSheet(rf => ({

  modalTitle: {
    color:'black',
    fontSize: Platform.OS === 'android' ? rf(20) : rf(22),
    textAlign: 'center',
    fontFamily: FONTS.SEMI_BOLD,
    marginBottom: getResponsiveHeight(6),
    marginTop: getResponsiveHeight(15),
    lineHeight: getResponsiveHeight(24),
  },
  modalText: {
    fontFamily: FONTS.REGULAR,
    fontSize: rf(14),
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

  }));
  return (
    <CustomModal
    showCloseButton
      visible={visible}
      onClose={onClose} // ❗ 취소 → 닫기
      onConfirm={onConfirm} // ❗ 로그아웃 → 처리 실행
      confirmText="로그아웃"
      closeText="취소"
      title="로그아웃 할까요?">
    </CustomModal>
  );
}


