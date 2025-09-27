import React from 'react';
import CustomModal from '../../../components/common/customModal';

export default function KinoConfirmModal({visible, onConfirm, onClose}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={() => {
        onClose(); // 먼저 닫고
        onConfirm(); // 선택 로직 실행
      }}
      confirmText="선택"
      closeText="취소"
      buttonBottomStyle={{
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'space-between',
      }}
      title={'이 키노를 선택할까요?'}></CustomModal>
  );
}
