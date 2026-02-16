/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import CustomModal from 'components/modal/CustomModal';

export default function KinoConfirmModal({visible, onConfirm, onClose}) {
  return (
    <CustomModal
    showCloseButton

      visible={visible}
      onClose={onClose}
      onConfirm={() => {
        onClose(); // 먼저 닫고
        onConfirm(); // 선택 로직 실행
      }}
      confirmText="선택"
      closeText="취소"
      title={'이 키노를 선택할까요?'}
    />
  );
}
