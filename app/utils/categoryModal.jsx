import React from 'react';
import CustomModal from './customModal';
import {View, Text, TextInput} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from './responsive';

export default function CategoryModal({visible, onClose, onConfirm, content}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      closeText="취소하기"
      confirmText="추가하기"
      modalBoxStyle={{width: getResponsiveWidth(300)}}
      closeTextStyle={{
        fontFamily: 'Pretendard-Regular',
        fontSize: getResponsiveFontSize(14),
      }}
      confirmTextStyle={{
        fontFamily: 'Pretendard-Regular',
        fontSize: getResponsiveFontSize(14),
        color: 'black',
      }}
      confirmButtonStyle={{
        flex: 1,
        backgroundColor: '#FFC84D',
        paddingVertical: getResponsiveHeight(10),
        borderRadius: 8,
      }}
      closeButtonStyle={{
        // backgroundColor: '#E0E0E0',
        flex: 1,
        backgroundColor: '#E0E0E0',
        paddingVertical: getResponsiveHeight(10),
        borderRadius: 8,
      }}
      buttonBottomStyle={{
        flexDirection: 'row',
        gap: getResponsiveWidth(10),
        justifyContent: 'space-between',
      }}
      
      children={content}>
    </CustomModal>
  );
}
