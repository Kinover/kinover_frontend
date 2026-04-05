// src/features/auth/hooks/useLogout.js
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {persistor} from 'store';
import {deleteFcmToken} from 'features/notification/utils/requestNotificationPermission';
import {deleteLoginInfo} from 'utils/storage';

import {stopChatSocket} from 'features/chat/hooks/ChatSocket';
import {resetUi} from 'store/uiSlice';
import {setLogout, setAuthChecked} from '../store/loginSlice';

const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const useLogout = () => {
  const dispatch = useDispatch();

  const logout = useCallback(async () => {
 // 0) 소켓 끊기
      stopChatSocket();

 // 1) 외부/서버 정리(실패해도 진행)
      await deleteFcmToken();
      await KakaoLogin.logout();

 // 2) 로컬 로그인정보 삭제 (needsSignup 포함)
      await deleteLoginInfo();

 // 3) persist 완전 초기화
      await persistor.purge();
      await persistor.flush();
  

 // 4) 타이밍 안정화
    await nextTick();
    dispatch(resetUi()); // 글씨 크기·생체인식 앱잠금 초기화
    dispatch(setLogout());
    dispatch(setAuthChecked(true));
  }, [dispatch]);

  return logout;
};
