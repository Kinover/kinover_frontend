// src/features/auth/hooks/useAutoLogin.js
import {useEffect, useRef} from 'react';
import {useDispatch, useSelector, useStore} from 'react-redux';

import {getToken, deleteLoginInfo, setHasFamily} from 'utils/storage';
import {baseApi} from 'services/baseApi';
import {homeApi} from 'features/home/services/homeApi';
import {startChatSocket, stopChatSocket} from 'features/chat/hooks/ChatSocket';
import {setLoginSuccess, setLogout, setAuthChecked} from '../store/loginSlice';

const withTimeout = (promise, ms = 6000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

export function useAutoLogin(shouldRun = true) {
  const dispatch = useDispatch();
  const store = useStore();

  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);
  const authChecked = useSelector(state => state.login?.authChecked);
  const loginLoading = useSelector(state => !!state.login?.loading);

  const runningRef = useRef(false);
  const socketUnsubRef = useRef(null);

  useEffect(() => {
    if (!shouldRun) return;
    if (!rehydrated) return;
    if (authChecked) return;
    if (loginLoading) return;

    if (runningRef.current) return;
    runningRef.current = true;

    let cancelled = false;

    const run = async () => {
      console.log('🚀 AutoLogin start');

      try {
        const token = await withTimeout(getToken(), 6000);
        console.log('🔐 token:', token ? 'YES' : 'NO');

        if (cancelled) return;

        if (!token) {
          stopChatSocket();
          dispatch(setLogout());
          return;
        }

        let userResult = null;
        try {
          const req = dispatch(
            homeApi.endpoints.getUser.initiate(undefined, {
              forceRefetch: true,
            }),
          );
          userResult = await withTimeout(req.unwrap(), 8000);
          req.unsubscribe();

          console.log('✅ fetchUser ok');
        } catch (e) {
          console.log('❌ fetchUser fail => logout', e?.message);
          await deleteLoginInfo();
          stopChatSocket();
          dispatch(setLogout());
          return;
        }

        if (cancelled) return;

        dispatch(setLoginSuccess());

        try {
 // familyId 추출 보강 (DTO 구조 흔들려도 안전)
          const raw = userResult?.data ?? userResult;
          const familyId = raw?.familyId ?? raw?.family?.familyId ?? null;
          
          const hasFamilyValue = familyId != null;
          console.log('🏷️ [AUTOLOGIN] familyId=', familyId, 'hasFamily=', hasFamilyValue);
          
          await setHasFamily(hasFamilyValue);
          if (hasFamilyValue) {
            const familyReq = dispatch(
              homeApi.endpoints.getFamily.initiate(familyId, {forceRefetch: true}),
            );
            await familyReq.unwrap();
            familyReq.unsubscribe();
            console.log('✅ fetchFamily ok');

            const userId = raw?.userId ?? raw?.id ?? null;
            if (userId) {
              const familyUsersReq = dispatch(
                homeApi.endpoints.getFamilyUsers.initiate(familyId, {
                  forceRefetch: true,
                }),
              );
              familyUsersReq.unwrap().finally(() => familyUsersReq.unsubscribe());
              // RTK Query: ChatRoom 태그 무효화 → getChatRooms 자동 fetch
              dispatch(baseApi.util.invalidateTags(['ChatRoom']));
            }
          } else {
            console.log('👀 familyId is null -> no family (create/join flow)');
          }
        } catch (e) {
          console.log('⚠️ fetchFamily skip/fail:', e?.message);
        }

        if (cancelled) return;

        if (!socketUnsubRef.current) {
          socketUnsubRef.current = startChatSocket(dispatch, store.getState);
        }
      } catch (err) {
        console.log('🚨 AutoLogin fatal:', err?.message);
        await deleteLoginInfo();
        stopChatSocket();
        dispatch(setLogout());
      } finally {
        if (!cancelled) {
          console.log('✅ AutoLogin done -> authChecked true');
          dispatch(setAuthChecked(true));
        }
        runningRef.current = false;
      }
    };

    run();

    return () => {
      cancelled = true;
      runningRef.current = false;
    };
  }, [dispatch, store, rehydrated, authChecked, shouldRun, loginLoading]);

 // 언마운트 시에만 소켓 정리
  useEffect(() => {
    return () => {
      if (socketUnsubRef.current) {
        socketUnsubRef.current();
        socketUnsubRef.current = null;
      }
    };
  }, []);
}
