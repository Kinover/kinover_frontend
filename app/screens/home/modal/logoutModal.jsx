import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import CustomModal from '../../../components/customModal';

export default function LogoutModal({visible, onClose, onConfirm}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onConfirm} // ✅ 원래 onConfirm이 하던 일
      onConfirm={onClose} // ✅ 원래 onClose이 하던 일
      confirmText="취소" // ✅ 텍스트 반전
      closeText="로그아웃"
      confirmButtonStyle={styles.closeButton} // 회색 (왼쪽)
      closeButtonStyle={styles.confirmButton} // 노랑 (오른쪽)
      confirmTextStyle={styles.modalText}
      closeTextStyle={[styles.modalText, {color: 'black'}]}
      buttonBottomStyle={styles.modalButtonRow}>
      <Text style={styles.modalTitle}>로그아웃 하시겠습니까?</Text>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 19,
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS == 'ios' ? null : '700',
    marginBottom: getResponsiveHeight(5),
    marginTop: getResponsiveHeight(15),
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
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
});
