import React from 'react';
import { StyleSheet, Platform} from 'react-native';
import CustomModal from '../../../components/customModal';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

export default function ChangeKinoModal({visible, onClose, onConfirm}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      showCloseButton={false}
      onConfirm={() => {
        onClose(); // 먼저 모달 닫기
        setTimeout(() => {
          onConfirm(); // 그 다음 화면 이동
        }, 100); // 100ms 정도만 주면 충분해
      }}
      confirmText="교체"
      closeText="취소"
      buttonBottomStyle={styles.modalButtonRow}
      title={'키노를 교체하시겠어요?'}
      subText={"지금까지의 대화는 저장되지 않고,\n새로운 키노와 처음부터 다시 시작해요."
      }></CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(20)
        : getResponsiveFontSize(22),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? undefined : '700',
    marginBottom: getResponsiveHeight(12.5),
    marginTop: getResponsiveHeight(11),
  },
  modalSubText: {
    textAlign: 'center',
    color: '#6E6E6E',
    fontFamily: 'Pretendard-Regular',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(15)
        : getResponsiveFontSize(16),
    lineHeight: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(10),
  },
  modalText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(12.5),
    borderRadius: getResponsiveWidth(8),
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(12.5),
    borderRadius: getResponsiveWidth(8),
  },
});
