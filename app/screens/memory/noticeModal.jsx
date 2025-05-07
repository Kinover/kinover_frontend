import React from 'react';
import CustomModal from '../../utils/customModal';
import {useDispatch} from 'react-redux';
import NoticeModalContent from './noticeModalContent';
import {relationshipMapKoreanToEnglish} from '../home/familySettingScreen';
import {modifyFamily} from '../../redux/thunk/familyThunk';

export default function NoticeModal({
  visible,
  onClose,
  family,
  noticeInput,
  setNoticeInput,
}) {
  const dispatch = useDispatch();

  const handleConfirm = () => {
    const newFamily = {
      familyId: family.familyId,
      name: family.name,
      notice: noticeInput,
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
      <NoticeModalContent
        currentNotice={family.notice}
        noticeInput={noticeInput}
        setNoticeInput={setNoticeInput}
      />
    </CustomModal>
  );
}
