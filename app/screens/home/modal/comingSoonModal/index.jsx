import React from 'react';
import CustomModal from '../../../../utils/customModal';
import ComingSoonModalContent from './content';

export default function ComingSoonModal({visible, onClose}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onClose}
      modalBoxStyle={{
        borderRadius: 16,
        backgroundColor: 'white',
        padding: 27,
      }}
      confirmButtonStyle={{
        backgroundColor: '#FFC84D',
        width: '100%',
      }}
      confirmTextStyle={{
        color: 'black',
        fontFamily: 'Pretendard-Regular',
      }}
      confirmText="확인"
      closeText="닫기">
      <ComingSoonModalContent />
    </CustomModal>
  );
}
