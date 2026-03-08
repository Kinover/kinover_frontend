// src/features/auth/hooks/useDeleteUser.js

import {useCallback, useState} from 'react';
import {useDispatch} from 'react-redux';
import {deleteUserThunk} from 'features/home/store/userThunk';
import {deleteLoginInfo} from 'utils/storage';
import {resetUi} from 'store/uiSlice';
import {setLogout} from '../store/loginSlice';
import {setUserlogout} from 'features/home/store/userSlice';
import {resetGuideShownKeys} from 'hooks/useGuide';

export function useDeleteUser(onSuccess) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const showToast = useCallback(message => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      setLoading(true);

      const result = await dispatch(deleteUserThunk()).unwrap();

 // 로컬 저장소 정리 (Keychain + hasFamily)
      await deleteLoginInfo();

 // 가이드 "봤음" 플래그 삭제 → 재가입 후 탭 진입 시 가이드 다시 노출
      await resetGuideShownKeys();

 // Redux 상태도 초기화 (글씨 크기·생체인식 앱잠금 포함)
      dispatch(resetUi());
      dispatch(setLogout());      // loginSlice
      dispatch(setUserlogout());  // userSlice

      showToast('회원 탈퇴가 정상적으로 처리되었어요.');
      onSuccess && onSuccess(result);
    } catch (error) {
      const msg =
        typeof error === 'string'
          ? error
          : '회원 탈퇴 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  }, [dispatch, onSuccess, showToast]);

  return {
    loading,
    deleteAccount,
    toastVisible,
    toastMessage,
    hideToast,
    showToast,
  };
}
