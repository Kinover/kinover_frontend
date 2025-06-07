
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import CustomModal from '../../../../../utils/customModal';
import {
    getResponsiveHeight,
    getResponsiveFontSize,
    getResponsiveWidth,
  } from '../../../../../utils/responsive';

export default function LeaveChatRoomModal({
  visible,
  onClose,
  onConfirm,
}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmText="나가기"
      closeText="취소하기"
      confirmButtonStyle={styles.confirmButton}
      closeButtonStyle={styles.closeButton}
      closeTextStyle={styles.modalText}
      confirmTextStyle={[styles.modalText, { color: 'black' }]}
      buttonBottomStyle={styles.modalButtonRow}
    >
      <Text style={styles.modalTitle}>정말 채팅방을 나가시겠습니까?</Text>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 17,
    textAlign: 'center',
    fontFamily: 'Pretendard-Medium',
    fontWeight:Platform.OS=='ios'?null:'700',
    marginBottom: getResponsiveHeight(10),
    marginTop:getResponsiveHeight(15),
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