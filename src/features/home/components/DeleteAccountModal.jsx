/* eslint-disable no-alert */
/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {StyleSheet, TextInput, Platform} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import CustomModal from '../../../components/CustomModal';

import {useDeleteUser} from 'features/auth/hooks/useDeleteModal';
import {useNavigateToWhere} from 'hooks/useNatigateToWhere';
export default function DeleteAccountModal({visible, onClose}) {
  const navigateToWhere = useNavigateToWhere();

  const {deleteAccount} = useDeleteUser(() => {
    navigateToWhere({
      root: 'Auth', // 🔥 온보딩 화면이 속한 RootStack 이름
      screen: '온보딩화면', // 🔥 실제 온보딩 스크린 이름
    });
  });

  const [showConfirmInputModal, setShowConfirmInputModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleFirstConfirm = () => {
    setShowConfirmInputModal(true);
  };

  const handleFinalConfirm = () => {
    if (confirmationText === '탈퇴합니다') {
      deleteAccount(); // 🔥 계정 탈퇴 실행
      setConfirmationText('');
      setShowConfirmInputModal(false);
      onClose();
    } else {
      alert('정확히 "탈퇴합니다"를 입력해주세요.');
    }
  };

  const handleCloseAll = () => {
    setConfirmationText('');
    setShowConfirmInputModal(false);
    onClose();
  };

  return (
    <>
      <CustomModal
        visible={visible && !showConfirmInputModal}
        onClose={handleFirstConfirm}
        onConfirm={handleCloseAll}
        confirmText="취소"
        closeText="탈퇴"
        confirmButtonStyle={styles.closeButton}
        closeButtonStyle={styles.confirmButton}
        confirmTextStyle={styles.modalText}
        closeTextStyle={[styles.modalText, {color: '#fff'}]}
        buttonBottomStyle={styles.modalButtonRow}
        title={'계정을 삭제할까요?'}
        titleImage={require('../../../assets/icons/warning-light.png')}
        titleImageStyle={{
          width: getResponsiveIconSize(50),
          height: getResponsiveIconSize(50),
          alignSelf: 'center',
          borderRadius: 999,
          marginVertical: getResponsiveHeight(5),
        }}
        subText={'가족과의 모든 연결과 기록이 함께 사라집니다.'}
      />

      <CustomModal
        visible={visible && showConfirmInputModal}
        onClose={handleFinalConfirm}
        onConfirm={handleCloseAll}
        confirmText="취소"
        closeText="확인"
        confirmButtonStyle={styles.closeButton}
        closeButtonStyle={styles.inputConfirmButton}
        confirmTextStyle={styles.modalText}
        closeTextStyle={[styles.modalText, {color: '#fff'}]}
        buttonBottomStyle={styles.modalButtonRow}
        title={' 탈퇴 하시려면 아래에\n‘탈퇴합니다’를 입력해주세요'}>
        <TextInput
          placeholder="탈퇴합니다"
          placeholderTextColor="#ccc"
          value={confirmationText}
          onChangeText={setConfirmationText}
          style={styles.input}
        />
      </CustomModal>
    </>
  );
}

const styles = StyleSheet.create({
  modalTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(20)
        : getResponsiveFontSize(22),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    marginBottom: getResponsiveHeight(6),
    marginTop: getResponsiveHeight(12),
    lineHeight: getResponsiveHeight(24),
  },
  modalSubText: {
    textAlign: 'center',
    color: '#6E6E6E',
    fontFamily: 'Pretendard-SemiBold',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(15)
        : getResponsiveFontSize(16),
    lineHeight: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(5),
  },
  modalText: {
    fontFamily: 'Pretendard-Regular',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    justifyContent: 'space-between',
  },
  confirmButton: {
    backgroundColor: '#FF4D4D',
  },
  inputConfirmButton: {
    // flex: 1,
    backgroundColor: '#FF4D4D',
  },
  closeButton: {
    // flex: 1,
    backgroundColor: '#E0E0E0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-Regular',
    color: '#000',
    backgroundColor: '#fff',
    marginVertical: getResponsiveHeight(12),
  },
});
