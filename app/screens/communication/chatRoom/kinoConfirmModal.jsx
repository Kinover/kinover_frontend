import React from 'react';
import {Text} from 'react-native';
import CustomModal from '../../../components/customModal';
import getResponsiveFontSize, {
  getResponsiveHeight,
} from '../../../utils/responsive';

export default function KinoConfirmModal({visible, onConfirm, onClose}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={() => {
        onClose(); // 먼저 닫고
        onConfirm(); // 선택 로직 실행
      }}
      confirmText="선택하기"
      closeText="취소하기"
      buttonBottomStyle={{
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'space-between',
      }}
      confirmButtonStyle={{backgroundColor: '#FFC84D', flex: 1}}
      closeButtonStyle={{backgroundColor: '#F2F2F2', flex: 1}}
      confirmTextStyle={{color: 'black', fontFamily: 'Pretendard-Regular'}}
      closeTextStyle={{fontFamily: 'Pretendard-Regular'}}>
      <Text
        style={{
          fontSize: getResponsiveFontSize(16),
          fontFamily: 'Pretendard-SemiBold',
          color: '#333',
          textAlign: 'center',
          lineHeight: 24,
          marginTop: getResponsiveHeight(5),
        }}>
        정말 이 키노를 선택하시겠습니까?
      </Text>
    </CustomModal>
  );
}
