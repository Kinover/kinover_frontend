import React from 'react';
import {TextInput, StyleSheet} from 'react-native';
import CustomModal from 'components/modal/CustomModal';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from 'utils/responsive';

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
      showCloseButton
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
      subText={
        '이름을 바꿔도 다른 참여자에게는 보이지 않아요.\n나만 쓰는 채팅방 이름이에요.'
      }>
      <TextInput
        allowFontScaling={false}
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
    borderRadius: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(15),
    backgroundColor: '#fff',
    fontFamily: 'Pretendard-Regular',
    marginTop: getResponsiveHeight(4),
    marginBottom: getResponsiveHeight(10),
  },

  noticeText: {
    marginTop: getResponsiveHeight(8),
    fontSize: getResponsiveFontSize(12),
    color: '#9B9B9B',
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(16),
  },
});
