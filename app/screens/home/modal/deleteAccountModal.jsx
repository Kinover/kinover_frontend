import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, Platform} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import CustomModal from '../../../components/customModal';

export default function DeleteAccountModal({visible, onClose, onConfirm}) {
  const [showConfirmInputModal, setShowConfirmInputModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleFirstConfirm = () => {
    // 첫 번째 모달에서 "탈퇴하기" 누르면
    setShowConfirmInputModal(true);
  };

  const handleFinalConfirm = () => {
    if (confirmationText === '탈퇴합니다') {
      onConfirm(); // 최종 탈퇴 확정
      setConfirmationText('');
      setShowConfirmInputModal(false);
    } else {
      alert('정확히 "탈퇴합니다"를 입력해주세요.');
    }
  };

  const handleCloseAll = () => {
    setConfirmationText('');
    setShowConfirmInputModal(false);
    onClose(); // 외부에서 상태 초기화
  };

  return (
    <>
      {/* 1차 모달: 정말 탈퇴하시겠습니까? */}
      <CustomModal
        visible={visible && !showConfirmInputModal}
        onClose={handleFirstConfirm} // ✅ 원래 onConfirm이 하던 역할
        onConfirm={handleCloseAll} // ✅ 원래 onClose가 하던 역할
        confirmText="취소" // ✅ 텍스트 역할 반대로
        closeText="탈퇴하기"
        confirmButtonStyle={styles.closeButton} // 회색 버튼 (왼쪽)
        closeButtonStyle={styles.confirmButton} // 빨간 버튼 (오른쪽)
        confirmTextStyle={styles.modalText}
        closeTextStyle={[styles.modalText, {color: '#fff'}]}
        buttonBottomStyle={styles.modalButtonRow}>
        <Text style={styles.modalTitle}>탈퇴 하시겠습니까?</Text>
      </CustomModal>

      {/* 2차 모달: "탈퇴합니다" 입력 */}
      <CustomModal
        visible={visible && showConfirmInputModal}
        onClose={handleFinalConfirm} // ✅ 버튼 역할 반대로
        onConfirm={handleCloseAll}
        confirmText="취소" // ✅ 텍스트 바꾸기
        closeText="입력하기"
        confirmButtonStyle={styles.closeButton} // ✅ 회색 (취소) 스타일
        closeButtonStyle={styles.inputConfirmButton} // ✅ 빨간 버튼
        confirmTextStyle={styles.modalText}
        closeTextStyle={[styles.modalText, {color: '#fff'}]}
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
    fontSize: 19,
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? null : '700',
    marginBottom: getResponsiveHeight(5),
    marginTop: getResponsiveHeight(10),
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
    backgroundColor: '#FF4D4D',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  inputConfirmButton: {
    flex: 1,
    backgroundColor: '#FF4D4D',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#000',
    backgroundColor: '#fff',
    marginTop: getResponsiveHeight(10),
  },
});
