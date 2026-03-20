/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useMemo} from 'react';
import { StyleSheet, TextInput, Platform, View } from 'react-native';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from 'utils/responsive';
import CustomModal from 'components/modal/CustomModal';
import ToastModal from 'components/modal/ToastModal';

import {useDeleteUser} from 'features/auth/hooks/useDeleteUser';

const REQUIRED_TEXT = '탈퇴합니다';

export default function DeleteAccountModal({visible, onClose}) {

  const styles = useScaledStyleSheet(rf => ({

  modalButtonRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    justifyContent: 'space-between',
  },

 // 왼쪽(취소) 버튼
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(14),
    color: '#111827',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

 // 오른쪽(위험) 버튼
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
    fontSize: rf(14),
    color: '#FFFFFF',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  step2Content: {
    marginTop: getResponsiveHeight(4),
    marginBottom: getResponsiveHeight(4),
  },
  requiredTextBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(14),
    marginBottom: getResponsiveHeight(14),
  },
  requiredTextLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(12),
    color: '#6B7280',
    marginBottom: getResponsiveHeight(6),
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },
  requiredText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(16),
    color: '#111827',
    letterSpacing: 0.3,
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },
  inputLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: rf(13),
    color: '#374151',
    marginBottom: getResponsiveHeight(6),
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: getResponsiveWidth(10),
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(12)
        : getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(14),
    fontSize: rf(16),
    fontFamily: 'Pretendard-Regular',
    color: '#111827',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },
  inputError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  inputSuccess: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  helperText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: rf(12),
    color: '#DC2626',
    marginTop: getResponsiveHeight(6),
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  }));
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
        confirmText={step === 1 ? '탈퇴하기' : '탈퇴하기'}
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
            : '탈퇴 확인'
        }
        titleImage={
          step === 1
            ? require('../../../assets/icons/warning-light.png')
            : undefined
        }
        subText={
          step === 1
            ? '가족과의 모든 연결과 기록이 함께 사라집니다.'
            : '아래 문구를 정확히 입력하면 탈퇴가 진행됩니다.'
        }>
        {step === 2 && (
          <View style={styles.step2Content}>
            <View style={styles.requiredTextBox}>
              <AppText allowFontScaling={false} style={styles.requiredTextLabel}>
                입력할 문구
              </AppText>
              <AppText allowFontScaling={false} style={styles.requiredText}>
                {REQUIRED_TEXT}
              </AppText>
            </View>
            <AppText allowFontScaling={false} style={styles.inputLabel}>
              입력
            </AppText>
            <TextInput
              allowFontScaling={false}
              autoFocus
              placeholder={`"${REQUIRED_TEXT}" 입력`}
              placeholderTextColor="#9CA3AF"
              value={confirmationText}
              onChangeText={setConfirmationText}
              style={[
                styles.input,
                confirmationText.length > 0 && !isMatch && styles.inputError,
                isMatch && styles.inputSuccess,
              ]}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
            {confirmationText.length > 0 && !isMatch && (
              <AppText allowFontScaling={false} style={styles.helperText}>
                문구가 일치하지 않아요. 위와 똑같이 입력해주세요.
              </AppText>
            )}
          </View>
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

