import React, {useCallback} from 'react';
import {Platform} from 'react-native';
import CustomModal from 'components/modal/CustomModal';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveWidth,
} from 'utils/responsive';
import {FONTS} from 'styles/typography';

export default function CategoryModal({
  visible,
  content,
  onClose,
  onConfirm,
  confirmDisabled = false,
}) {
  const styles = useScaledStyleSheet(rf => ({
    confirmBtn: {
      backgroundColor: '#FFC84D',
      borderWidth: 1,
      borderColor: '#FFC84D',
      minHeight: getResponsiveWidth(46),
      borderRadius: getResponsiveWidth(12),
    },
    confirmText: {
      fontFamily: FONTS.SEMI_BOLD,
      fontSize: rf(14),
      color: '#111827',
      ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
    },
    confirmDisabled: {
      opacity: 0.45,
    },
  }));

  const handleConfirmPress = useCallback(() => {
    if (confirmDisabled) return;
    onConfirm?.();
  }, [confirmDisabled, onConfirm]);

  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={onClose}
      onRequestClose={onClose}
      closeOnBackdropPress={true}
      onConfirm={handleConfirmPress}
      confirmText="추가하기"
      confirmButtonStyle={[
        styles.confirmBtn,
        confirmDisabled && styles.confirmDisabled,
      ]}
      confirmTextStyle={styles.confirmText}
      title="새 카테고리를 입력해주세요">
      {content}
    </CustomModal>
  );
}

