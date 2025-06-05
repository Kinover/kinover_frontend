import React from 'react';

import UserDeleteModalContent from './content';
import CustomModal from '../../customModal';

export default function UserDeleteModal({visible, onClose, user}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onClose} // 취소하기 누르면 닫힘
      modalBoxStyle={{
        borderRadius: 16,
        backgroundColor: 'white',
        padding: 27,
      }}
      confirmButtonStyle={{
        backgroundColor: '#E5E5E5',
        width: '100%',
      }}
      confirmTextStyle={{
        color: 'black',
        fontFamily: 'Pretendard-Regular',
      }}
      closeButtonStyle={{
        backgroundColor: '#FFC84D',
        width: '100%',
      }}
      closeTextStyle={{
        color: 'black',
        fontFamily: 'Pretendard-Regular',
      }}
      confirmText="취소하기"
      closeText="삭제하기">
      <UserDeleteModalContent user={user} />
    </CustomModal>
  );
}
