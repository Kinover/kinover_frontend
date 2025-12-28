import React from 'react';
import {TextInput, StyleSheet, Platform, Text, View} from 'react-native';
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
  currentRoomName,
}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={() => {
        onClose(); // 먼저 모달 닫기
        setTimeout(() => {
          onConfirm(); // 그 다음 변경 로직
        }, 100);
      }}
      confirmText="변경"
      closeText="취소"
      title="채팅방 이름 변경"
      subText={'채팅방 이름은 모든 참여자에게 동일하게 보여요'}>
      <TextInput
        placeholder={currentRoomName || '채팅방 이름'}
        value={newRoomName}
        onChangeText={setNewRoomName}
        style={styles.textInput}
        placeholderTextColor="#999"
      />
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(15),
    backgroundColor: '#fff',
    fontFamily: 'Pretendard-Regular',
    marginBottom: getResponsiveHeight(12),
  },

  noticeText: {
    marginTop: getResponsiveHeight(8),
    fontSize: getResponsiveFontSize(12),
    color: '#9B9B9B',
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(16),
  },
});
