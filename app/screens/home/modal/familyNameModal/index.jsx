import React from 'react';
import {useDispatch} from 'react-redux';

import {relationshipMapKoreanToEnglish} from '../../familySettingScreen';
import CustomModal from '../../../../utils/customModal';
import FamilyNameModalContent from './content';
import { modifyFamily } from '../../../../redux/thunk/familyThunk';

export default function FamilyNameModal({ 
  visible,
  onClose, 
  family,
  familyNameInput,
  setFamilyNameInput,
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
        borderRadius: 16,
        backgroundColor: 'white',
        padding: 27,
      }}
      confirmButtonStyle={{
        backgroundColor: '#FFC84D',
        width: '50%',
      }}
      confirmTextStyle={{
        color: 'black',
        fontFamily: 'Pretendard-Regular',
      }}
      closeButtonStyle={{
        backgroundColor: '#E5E5E5',
        width: '50%',
      }}
      closeTextStyle={{
        color: 'black',
        fontFamily: 'Pretendard-Regular',
      }}
      buttonBottomStyle={{
        display: 'flex',
        flexDirection: 'row',
      }}
      confirmText="적용하기"
      closeText="취소하기">
      <FamilyNameModalContent
        currentFamilyName={family.name}
        familyNameInput={familyNameInput}
        setFamilyNameInput={setFamilyNameInput}
      />
    </CustomModal>
  );
}
