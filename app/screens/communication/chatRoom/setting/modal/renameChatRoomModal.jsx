
import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import CustomModal from '../../../../../utils/customModal';
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
      onConfirm={onConfirm}
      confirmText="변경"
      closeText="취소"
      confirmButtonStyle={styles.confirmButton}
      closeButtonStyle={styles.closeButton}
      closeTextStyle={styles.modalText}
      confirmTextStyle={[styles.modalText, { color: 'black' }]}
      buttonBottomStyle={styles.modalButtonRow}
    >
      <View style={{ marginTop: getResponsiveHeight(15)}}>
        <Text style={styles.modalTitle}>채팅방 이름을 수정하세요</Text>
        <TextInput
          placeholder="새 채팅방 이름"
          value={newRoomName}
          onChangeText={setNewRoomName}
          style={styles.textInput}
        />
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 17,
    textAlign: 'center',
    fontFamily: 'Pretendard-Medium',
    fontWeight:Platform.OS=='ios'?null:'700',
    marginBottom: getResponsiveHeight(20),
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
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: getResponsiveFontSize(14),
    backgroundColor: '#fff',
    fontFamily: 'Pretendard-Regular',
  },
});