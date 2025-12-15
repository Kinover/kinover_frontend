// src/hooks/auth/useAutoLogin.js
import {useEffect, useRef} from 'react';
import {useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import {getToken, getHasFamily, setHasFamily} from '../../../utils/storage';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {fetchFamilyThunk} from 'features/home/store/familyThunk';
import {setLoginSuccess} from '../store/authSlice';

import store from 'store/store';
import {deleteLoginInfo} from 'utils/storage';
import {startChatSocket, stopChatSocket} from 'features/chat/hooks/ChatSocket'; // ✅ 경로 통일

export function useAutoLogin() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const unsubscribeAppStateRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      try {
        const token = await getToken();
        const localHasFamily = await getHasFamily();

        console.log('🔐 AutoLogin - token:', token);
        console.log('📦 AutoLogin - local hasFamily:', localHasFamily);

        if (!token) {
          console.log('❗ 토큰 없음 → 자동 로그인 스킵');
          return;
        }

        dispatch(setLoginSuccess());

        // 1) 유저 조회 (여기서 진짜 토큰 유효성 확정)
        try {
          const result = await dispatch(fetchUserThunk());
          console.log('✅ 자동 로그인 - 유저 조회 성공:', result);
        } catch (e) {
          console.log(
            '❌ 자동 로그인 중 유저 조회 실패, 토큰 삭제',
            e?.response?.status,
            e?.message,
          );
          await deleteLoginInfo();

          // ✅ 혹시라도 열려있던 소켓이 있다면 닫기
          stopChatSocket();
          return;
        }

        // ✅ 여기까지 왔으면 토큰 유효 → 전역 소켓 시작 (딱 1번)
        if (!unsubscribeAppStateRef.current) {
          unsubscribeAppStateRef.current = startChatSocket(dispatch);
        }

        // 2) 최신 state에서 user/familyId 읽기
        const state = store.getState();
        const userState = state.user;
        const user = userState.user ?? userState;
        const familyId = user?.familyId ?? null;

        console.log('👤 AutoLogin 유저 정보:', user);
        console.log('🏠 AutoLogin familyId:', familyId);

        const hasFamily = !!familyId;
        await setHasFamily(hasFamily);

        if (hasFamily && familyId) {
          await dispatch(fetchFamilyThunk(familyId));
          navigation.reset({
            index: 0,
            routes: [{name: 'Tabs', params: {screen: 'Home'}}],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{name: '약관동의화면'}],
          });
        }
      } catch (err) {
        console.error('🚨 자동 로그인 전체 실패:', err);
        await deleteLoginInfo();
        stopChatSocket();
      }
    };

    run();

    return () => {
      // 앱 루트에서 useAutoLogin이 언마운트 되는 경우 대비
      if (unsubscribeAppStateRef.current) {
        unsubscribeAppStateRef.current();
        unsubscribeAppStateRef.current = null;
      }
    };
  }, [dispatch, navigation]);
}
