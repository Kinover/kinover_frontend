import React from 'react';
import {View, Text, TextInput, StyleSheet, Platform} from 'react-native';
import CustomModal from '../../../../../components/customModal';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../../../utils/responsive';

export default function RenameChatRoomModal({
  visible,
  onClose,
  onConfirm,
  newRoomName,
  setNewRoomName,
}) {
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
      confirmText="변경"
      closeText="취소"
      confirmButtonStyle={styles.confirmButton}
      closeButtonStyle={styles.closeButton}
      closeTextStyle={styles.modalText}
      confirmTextStyle={[styles.modalText, {color: 'black'}]}
      buttonBottomStyle={styles.modalButtonRow}>
      <View style={{marginTop: getResponsiveHeight(15)}}>
        <Text style={styles.modalTitle}>채팅방 이름을 수정하세요</Text>
        <TextInput
          placeholder="새 채팅방 이름"
          value={newRoomName}
          onChangeText={setNewRoomName}
          style={styles.textInput}
          placeholderTextColor="#999"
        />
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: getResponsiveFontSize(17),
    textAlign: 'center',
    fontFamily: 'Pretendard-Medium',
    fontWeight: Platform.OS === 'ios' ? undefined : '700',
    marginBottom: getResponsiveHeight(20),
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(14),
    backgroundColor: '#fff',
    fontFamily: 'Pretendard-Regular',
  },
});
