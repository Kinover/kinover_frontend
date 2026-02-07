/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useMemo} from 'react';
import {StyleSheet, TextInput, Platform} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import CustomModal from '../../../components/modal/CustomModal';
import ToastModal from '../../../components/modal/ToastModal';

import {useDeleteUser} from '../../auth/hooks/useDeleteUser';

const REQUIRED_TEXT = '탈퇴합니다';

export default function DeleteAccountModal({visible, onClose}) {

  const {deleteAccount, toastVisible, toastMessage, hideToast, showToast} =
    useDeleteUser(() => {});

  const [step, setStep] = useState(1);
  const [confirmationText, setConfirmationText] = useState('');

  const isMatch = useMemo(
    () => confirmationText.trim() === REQUIRED_TEXT,
    [confirmationText],
  );

  const handleCloseAll = useCallback(() => {
    setStep(1);
    setConfirmationText('');
    onClose?.();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (step === 1) {
      // 1단계 → 2단계
      setStep(2);
      return;
    }

    // step === 2
    if (!isMatch) {
      showToast(`정확히 “${REQUIRED_TEXT}”를 입력해주세요.`);
      return;
    }

    deleteAccount();
    handleCloseAll();
  }, [step, isMatch, deleteAccount, handleCloseAll, showToast]);

  return (
    <>
      <CustomModal
        showCloseButton
        visible={visible}
        onClose={handleCloseAll}
        onRequestClose={handleCloseAll}
        onConfirm={handleConfirm}
        closeOnBackdropPress
        closeText="취소"
        confirmText={step === 1 ? '탈퇴하기' : '확인'}
        closeButtonStyle={styles.cancelBtn}
        confirmButtonStyle={[
          styles.dangerBtn,
          step === 2 && !isMatch && styles.dangerBtnDisabled,
        ]}
        closeTextStyle={styles.cancelText}
        confirmTextStyle={styles.dangerText}
        buttonBottomStyle={styles.modalButtonRow}
        title={
          step === 1
            ? '탈퇴할까요?'
            : `탈퇴하시려면 아래에\n‘${REQUIRED_TEXT}’를 입력해주세요`
        }
        titleImage={
          step === 1
            ? require('../../../assets/icons/warning-light.png')
            : undefined
        }
        subText={
          step === 1 ? '가족과의 모든 연결과 기록이 함께 사라집니다.' : null
        }>
        {step === 2 && (
          <TextInput
            allowFontScaling={false}
            autoFocus
            placeholder={REQUIRED_TEXT}
            placeholderTextColor="#C7C7C7"
            value={confirmationText}
            onChangeText={setConfirmationText}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />
        )}
      </CustomModal>

      <ToastModal
        visible={toastVisible}
        onClose={hideToast}
        message={toastMessage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalButtonRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    justifyContent: 'space-between',
  },

  // ✅ 왼쪽(취소) 버튼
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14),
    color: '#111827',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  // ✅ 오른쪽(위험) 버튼
  dangerBtn: {
    backgroundColor: '#FF4D4D',
    borderWidth: 1,
    borderColor: '#FF4D4D',
  },
  dangerBtnDisabled: {
    opacity: 0.55,
  },
  dangerText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14),
    color: '#FFFFFF',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: getResponsiveWidth(10),
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(10)
        : getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-Regular',
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginTop: getResponsiveHeight(8),
    marginBottom: getResponsiveHeight(4),
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },
});
