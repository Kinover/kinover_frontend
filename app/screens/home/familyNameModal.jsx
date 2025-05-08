import React from 'react';
import {useDispatch} from 'react-redux';

import {relationshipMapKoreanToEnglish} from './familySettingScreen';
import CustomModal from '../../utils/customModal';
import {modifyFamily} from '../../redux/thunk/familyThunk';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../utils/responsive';

export default function FamilyNameModal({
  visible,
  onClose,
  family,
  familyNameInput,
  setFamilyNameInput,
  content,
}) {
  const dispatch = useDispatch();

  const handleConfirm = () => {
    const newFamily = {
      familyId: family.familyId,
      name: familyNameInput,
      notice: family.notice,
      relationship: relationshipMapKoreanToEnglish[family.relationship],
    };

    dispatch(modifyFamily(newFamily));
    onClose();
  };

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      onConfirm={handleConfirm}
      modalBoxStyle={{
        width: getResponsiveWidth(300),
        alignSelf: 'center', // ✅ 중앙 정렬 핵심
      }}
      buttonRow={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: getResponsiveWidth(10),
      }}
      confirmButtonStyle={{
        flex: 1,
        backgroundColor: '#FFC84D',
        paddingVertical: getResponsiveHeight(10),
        borderRadius: 8,
      }}
      confirmTextStyle={{
        color: 'black',
        fontFamily: 'Pretendard-Regular',
      }}
      closeButtonStyle={{
        flex: 1,
        backgroundColor: '#E5E5E5',
        paddingVertical: getResponsiveHeight(10),
        borderRadius: 8,
      }}
      closeTextStyle={{
        color: 'black',
        fontFamily: 'Pretendard-Regular',
      }}
      buttonBottomStyle={{
        display: 'flex',
        width: '100%',
        flexDirection: 'row',
      }}
      confirmText="적용하기"
      closeText="취소하기"
      children={content}></CustomModal>
  );
}
