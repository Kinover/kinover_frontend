import React from 'react';
import {TextInput, StyleSheet, Platform} from 'react-native';
import CustomModal from '../../../components/CustomModal';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

export default function RenameChatRoomModal({
  visible,
  onClose,
  onConfirm,
  newRoomName,
  setNewRoomName,
  currentRoomName, // ⭐ 현재 채팅방 이름 props 추가
}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={() => {
        onClose(); // 먼저 모달 닫기
        setTimeout(() => {
          onConfirm(); // 그 다음 로직 실행
        }, 100);
      }}
      confirmText="변경"
      closeText="취소"
      title="채팅방 이름 변경">
      <TextInput
        placeholder={currentRoomName || '채팅방 이름'} // ⭐ 여기서 사용
        value={newRoomName}
        onChangeText={setNewRoomName}
        style={styles.textInput}
        placeholderTextColor="#999"
      />
    </CustomModal>
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
    fontFamily: 'Pretendard-Semibold',
    fontWeight: Platform.OS === 'ios' ? undefined : '700',
    marginBottom: getResponsiveHeight(20),
  },
  modalText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(15),
    backgroundColor: '#fff',
    fontFamily: 'Pretendard-Regular',
    marginVertical: getResponsiveHeight(12),
  },
});
