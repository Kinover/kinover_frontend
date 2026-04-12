// src/features/auth/hooks/useDeleteUser.js

import {useCallback, useState} from 'react';
import * as Keychain from 'react-native-keychain';
import {useDispatch} from 'react-redux';
import {useDeleteUserMutation} from 'features/home/services/homeApi';
import {deleteLoginInfo} from 'utils/storage';
import {RESET_ALL_STATE} from 'store/rootReducer';
import {baseApi} from 'services/baseApi';
import {persistor} from 'store';
import {resetGuideShownKeys} from 'hooks/useGuide';
import mmkvStorage from 'utils/mmkvStorage';
import {stopChatSocket} from 'features/chat/hooks/ChatSocket';

const FONT_MODE_STORAGE_KEY = 'ui:fontMode';
const FONT_MODE_KEYCHAIN_SERVICE = 'kinover.ui.fontMode';

export function useDeleteUser(onSuccess) {
  const dispatch = useDispatch();
  const [deleteUser] = useDeleteUserMutation();
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

      const result = await deleteUser().unwrap();

      // 소켓 끊기
      try { stopChatSocket(); } catch { null; }

      // 로컬 저장소 정리 (Keychain + hasFamily)
      await deleteLoginInfo();
      await mmkvStorage.setItem(FONT_MODE_STORAGE_KEY, 'NORMAL');
      try {
        await Keychain.resetInternetCredentials(FONT_MODE_KEYCHAIN_SERVICE);
      } catch {
        null;
      }

      // 가이드 "봤음" 플래그 삭제 → 재가입 후 탭 진입 시 가이드 다시 노출
      await resetGuideShownKeys();

      // persist 완전 초기화
      try { await persistor.purge(); } catch { null; }
      try { await persistor.flush(); } catch { null; }

      // 모든 슬라이스(family/schedule/memory/chatRoom 등) + RTK Query 캐시를 한 번에 초기화
      dispatch({type: RESET_ALL_STATE});
      dispatch(baseApi.util.resetApiState());

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
  }, [deleteUser, dispatch, onSuccess, showToast]);

  return {
    loading,
    deleteAccount,
    toastVisible,
    toastMessage,
    hideToast,
    showToast,
  };
}
