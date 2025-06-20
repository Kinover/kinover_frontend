import React from 'react';
import {Text, StyleSheet, Platform} from 'react-native';
import CustomModal from '../../../../../components/customModal';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../../../utils/responsive';

export default function ChangeKinoModal({visible, onClose, onConfirm}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmText="교체하기"
      closeText="취소하기"
      confirmButtonStyle={styles.confirmButton}
      closeButtonStyle={styles.closeButton}
      closeTextStyle={styles.modalText}
      confirmTextStyle={[styles.modalText, {color: 'black'}]}
      buttonBottomStyle={styles.modalButtonRow}>
      <Text style={styles.modalTitle}>정말 키노를 교체하시겠습니까?</Text>
      <Text style={styles.modalSubText}>
        기존 키노와의 대화는 저장되지 않으며{'\n'}
        새로운 키노를 선택해 처음부터 대화를 시작하게 됩니다.
      </Text>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? null : '700',
    marginBottom: getResponsiveHeight(8),
    marginTop: getResponsiveHeight(15),
  },
  modalSubText: {
    textAlign: 'center',
    color: '#6E6E6E',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12),
    lineHeight: getResponsiveHeight(20),
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
