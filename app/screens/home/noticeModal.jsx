import React from 'react';
import CustomModal from '../../utils/customModal';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';

export default function NoticeModal({visible, onClose, onConfirm, content}) {
  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      modalBoxStyle={{
        width: getResponsiveWidth(300),
        alignSelf: 'center', // ✅ 중앙 정렬 핵심
      }}
      buttonBottomStyle={{
        display: 'flex',
        width: '100%',
        flexDirection: 'row',
      }}
      closeText="취소하기"
      confirmText="저장하기"
      buttonRow={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: getResponsiveWidth(10),
      }}
      closeButtonStyle={{
        flex: 1,
        backgroundColor: '#E5E5E5',
        paddingVertical: getResponsiveHeight(10),
        borderRadius: 8,
      }}
      confirmButtonStyle={{
        flex: 1,
        backgroundColor: '#FFC84D',
        paddingVertical: getResponsiveHeight(10),
        borderRadius: 8,
      }}
      contentStyle={{gap: getResponsiveHeight(15)}}
      children={content}
    />
  );
}
