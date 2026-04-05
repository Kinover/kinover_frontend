import React, {useState, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import CustomInput from 'components/CustomInput';
import CustomModal from 'components/modal/CustomModal';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from 'utils/responsive';
import {required, validateLength} from 'utils/validation';

import AppText from 'components/AppText';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

const ROOM_NAME_MAX = 50;

export default function RenameChatRoomModal({
  visible,
  onClose,
  onConfirm,
  newRoomName,
  setNewRoomName,
  currentRoomName,
}) {
  const styles = useScaledStyleSheet(rf => ({

  textInput: {
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    fontSize: rf(15),
    backgroundColor: '#fff',
    fontFamily: 'Pretendard-Regular',
    marginTop: getResponsiveHeight(4),
    marginBottom: getResponsiveHeight(10),
  },

  errorText: {
    color: '#DC2626',
    fontSize: rf(12),
    marginBottom: getResponsiveHeight(4),
  },

  noticeText: {
    marginTop: getResponsiveHeight(8),
    fontSize: rf(12),
    color: '#9B9B9B',
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveHeight(16),
  },

  }));
  const [fieldError, setFieldError] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      setFieldError('');
      setIsNameFocused(false);
    }
  }, [visible]);

  const handleConfirm = () => {
    const trimmed = (newRoomName ?? '').trim();
    const requiredResult = required(trimmed, '채팅방 이름');
    if (!requiredResult.valid) {
      setFieldError(requiredResult.message);
      return;
    }
    const lengthResult = validateLength(trimmed, {min: 1, max: ROOM_NAME_MAX});
    if (!lengthResult.valid) {
      setFieldError(lengthResult.message);
      return;
    }
    setFieldError('');
    onClose();
    setTimeout(() => onConfirm(), 100);
  };

  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmText="저장"
      closeText="취소"
      title="채팅방 이름 변경"
      subText={
        '이름을 바꿔도 다른 참여자에게는 보이지 않아요.\n나만 쓰는 채팅방 이름이에요.'
      }>
      {fieldError ? (
        <AppText style={styles.errorText}>
          {fieldError}
        </AppText>
      ) : null}
      <View
        style={[
          styles.textInput,
          isNameFocused && {borderColor: '#FFC84D'},
        ]}>
        <CustomInput
          disableFocusStyle={true}
          disableBaseStyle={true}
          placeholder={currentRoomName || '채팅방 이름'}
          value={newRoomName}
          onChangeText={t => {
            setNewRoomName(t);
            if (fieldError) setFieldError('');
          }}
          onFocus={() => setIsNameFocused(true)}
          onBlur={() => setIsNameFocused(false)}
          style={{
            borderWidth: 0,
            paddingVertical: 0,
            paddingHorizontal: 0,
          }}
          placeholderTextColor="#999"
        />
      </View>
    </CustomModal>
  );
}

