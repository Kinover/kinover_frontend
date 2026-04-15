// src/features/auth/hooks/useLogout.js
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import * as Keychain from 'react-native-keychain';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {persistor} from 'store';
import {RESET_ALL_STATE} from 'store/rootReducer';
import {baseApi} from 'services/baseApi';
import {deleteFcmToken} from 'features/notification/utils/requestNotificationPermission';
import {deleteLoginInfo} from 'utils/storage';
import mmkvStorage from 'utils/mmkvStorage';
import {clearEmotionPickAlertDismissMmkvForLogout} from 'utils/appEventDismissStorage';

import {stopChatSocket} from 'features/chat/hooks/ChatSocket';
import {setAuthChecked} from '../store/loginSlice';
import {setLocalBlockedUserIds} from 'features/moderation/utils/blockedUsersStorage';

const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));
const FONT_MODE_STORAGE_KEY = 'ui:fontMode';
const FONT_MODE_KEYCHAIN_SERVICE = 'kinover.ui.fontMode';

export const useLogout = () => {
  const dispatch = useDispatch();

  const logout = useCallback(async () => {
    // 0) 소켓 끊기
    try { stopChatSocket(); } catch { null; }

    // 1) 외부/서버 정리 (실패해도 반드시 진행)
    try { await deleteFcmToken(); } catch { null; }
    try { await KakaoLogin.logout(); } catch { null; }

    // 2) 로컬 로그인정보 삭제
    try { await deleteLoginInfo(); } catch { null; }
    try { await setLocalBlockedUserIds([]); } catch { null; }
    try { await mmkvStorage.setItem(FONT_MODE_STORAGE_KEY, 'NORMAL'); } catch { null; }
    try { await Keychain.resetInternetCredentials(FONT_MODE_KEYCHAIN_SERVICE); } catch { null; }

    // 3) persist 완전 초기화
    try { await persistor.purge(); } catch { null; }
    try { await persistor.flush(); } catch { null; }
    try { await clearEmotionPickAlertDismissMmkvForLogout(); } catch { null; }

    // 4) 타이밍 안정화 후 상태 초기화
    await nextTick();

    // 모든 슬라이스(family/schedule/memory/chatRoom 등) + RTK Query 캐시를 한 번에 초기화
    dispatch({type: RESET_ALL_STATE});
    dispatch(baseApi.util.resetApiState());

    // 로그인 화면으로 라우팅되도록 authChecked 복원
    dispatch(setAuthChecked(true));
  }, [dispatch]);

  return logout;
};
