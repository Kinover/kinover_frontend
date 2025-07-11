import React from 'react';
import {Text, StyleSheet, Platform} from 'react-native';
import CustomModal from '../../../../../components/customModal';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../../../utils/responsive';

export default function LeaveChatRoomModal({visible, onClose, onConfirm}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={() => {
        onClose(); // 먼저 모달 닫기
        setTimeout(() => {
          onConfirm(); // 그 다음 화면 이동
        }, 100); // 100ms 정도만 주면 충분해
      }}
      confirmText="나가기"
      closeText="취소하기"
      confirmButtonStyle={styles.confirmButton}
      closeButtonStyle={styles.closeButton}
      closeTextStyle={styles.modalText}
      confirmTextStyle={[styles.modalText, {color: 'black'}]}
      buttonBottomStyle={styles.modalButtonRow}>
      <Text style={styles.modalTitle}>정말 채팅방을 나가시겠습니까?</Text>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: getResponsiveFontSize(17),
    textAlign: 'center',
    fontFamily: 'Pretendard-Medium',
    fontWeight: Platform.OS === 'ios' ? undefined : '700',
    marginBottom: getResponsiveHeight(10),
    marginTop: getResponsiveHeight(15),
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
    paddingVertical: getResponsiveHeight(10),
    borderRadius: getResponsiveWidth(8),
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: getResponsiveWidth(8),
  },
});
