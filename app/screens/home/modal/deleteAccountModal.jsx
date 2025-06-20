import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import CustomModal from '../../../components/customModal';

export default function DeleteAccountModal({ visible, onClose, onConfirm }) {
  const [showConfirmInputModal, setShowConfirmInputModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleFirstConfirm = () => {
    setShowConfirmInputModal(true);
  };

  const handleFinalConfirm = () => {
    if (confirmationText === '탈퇴합니다') {
      onConfirm();
      setConfirmationText('');
      setShowConfirmInputModal(false);
    } else {
      alert('정확히 "탈퇴합니다"를 입력해주세요.');
    }
  };

  const handleCloseAll = () => {
    setConfirmationText('');
    setShowConfirmInputModal(false);
    onClose();
  };

  return (
    <>
      <CustomModal
        visible={visible && !showConfirmInputModal}
        onClose={handleFirstConfirm}
        onConfirm={handleCloseAll}
        confirmText="취소"
        closeText="탈퇴하기"
        confirmButtonStyle={styles.closeButton}
        closeButtonStyle={styles.confirmButton}
        confirmTextStyle={styles.modalText}
        closeTextStyle={[styles.modalText, { color: '#fff' }]}
        buttonBottomStyle={styles.modalButtonRow}>
        <Text style={styles.modalTitle}>탈퇴 하시겠습니까?</Text>
      </CustomModal>

      <CustomModal
        visible={visible && showConfirmInputModal}
        onClose={handleFinalConfirm}
        onConfirm={handleCloseAll}
        confirmText="취소"
        closeText="입력하기"
        confirmButtonStyle={styles.closeButton}
        closeButtonStyle={styles.inputConfirmButton}
        confirmTextStyle={styles.modalText}
        closeTextStyle={[styles.modalText, { color: '#fff' }]}
        buttonBottomStyle={styles.modalButtonRow}>
        <Text style={styles.modalTitle}>
          탈퇴 하시려면 아래에{'\n'}‘탈퇴합니다’를 입력하세요
        </Text>
        <TextInput
          placeholder="탈퇴합니다"
          placeholderTextColor="#ccc"
          value={confirmationText}
          onChangeText={setConfirmationText}
          style={styles.input}
        />
      </CustomModal>
    </>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: getResponsiveFontSize(17),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    marginBottom: getResponsiveHeight(6),
    marginTop: getResponsiveHeight(12),
    lineHeight: getResponsiveHeight(24),
  },
  modalText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13.5),
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF4D4D',
    paddingVertical: getResponsiveHeight(11),
    borderRadius: getResponsiveWidth(8),
  },
  inputConfirmButton: {
    flex: 1,
    backgroundColor: '#FF4D4D',
    paddingVertical: getResponsiveHeight(11),
    borderRadius: getResponsiveWidth(8),
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(11),
    borderRadius: getResponsiveWidth(8),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#000',
    backgroundColor: '#fff',
    marginTop: getResponsiveHeight(12),
  },
});
