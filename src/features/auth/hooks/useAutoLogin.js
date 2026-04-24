// src/features/auth/hooks/useAutoLogin.js
import {useEffect, useRef} from 'react';
import {useDispatch, useSelector, useStore} from 'react-redux';

import {
  getToken,
  deleteLoginInfo,
  setHasFamily,
  setStoredPhoneVerificationPending,
  getAuthRoutingMmkvSnapshotSync,
  SIGNUP_PROGRESS_STEP,
} from 'utils/storage';
import {baseApi} from 'services/baseApi';
import {homeApi} from 'features/home/services/homeApi';
import {
  ensureChatSocketIfSignedIn,
  stopChatSocket,
} from 'features/chat/hooks/ChatSocket';
import {
  setLoginSuccess,
  setLogout,
  setAuthChecked,
  setPhoneVerificationPending,
} from '../store/loginSlice';

const LEGACY_LOCAL_ONLY_ACCESS_TOKEN = 'GUEST_TOKEN_LOCAL_ONLY';
import {setUser} from 'features/home/store/userSlice';
import {syncMarketingNotificationFromServer} from 'features/home/store/userThunk';
import {setFamily} from 'features/home/store/familySlice';
import {setFamilyUserList} from 'features/home/store/userFamilySlice';

const withTimeout = (promise, ms = 6000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

const isAuthFailure = error => {
  const status = Number(error?.status ?? error?.response?.status);
  if (status === 401) return true;
  if (status === 403) {
    const d = error?.data ?? error?.response?.data;
    const c = d?.code;
    return c === 'ACCOUNT_INVALIDATED' || c === 'ACCOUNT_BANNED';
  }

  const raw =
    error?.data?.message ??
    (typeof error?.data === 'string' ? error.data : null) ??
    error?.response?.data?.message ??
    (typeof error?.response?.data === 'string' ? error.response.data : null) ??
    error?.message ??
    '';

  const msg = String(raw).toUpperCase();
  return (
    msg.includes('TOKEN_EXPIRED') ||
    msg.includes('INVALID_TOKEN') ||
    msg.includes('TOKEN_MISSING') ||
    msg.includes('UNAUTHORIZED')
  );
};

export function useAutoLogin(shouldRun = true) {
  const dispatch = useDispatch();
  const store = useStore();

  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);
  const authChecked = useSelector(state => state.login?.authChecked);
  const loginLoading = useSelector(state => !!state.login?.loading);
  const isLoggedIn = useSelector(state => !!state?.login?.isLoggedIn);

  const runningRef = useRef(false);
  const socketUnsubRef = useRef(null);

  useEffect(() => {
    if (!shouldRun || !rehydrated || !authChecked || !isLoggedIn) return;
    ensureChatSocketIfSignedIn(dispatch, store.getState);
  }, [shouldRun, rehydrated, authChecked, isLoggedIn, dispatch, store]);

  useEffect(() => {
    if (!shouldRun) return;
    if (!rehydrated) return;
    if (authChecked) return;
    if (loginLoading) return;

    if (runningRef.current) return;
    runningRef.current = true;

    let cancelled = false;

    const run = async () => {
      const isManualLoginCompleted = () =>
        !!store.getState()?.login?.isLoggedIn;

      try {
        const token = await withTimeout(getToken(), 6000);

        if (cancelled) return;

        const tokenStr = token != null ? String(token).trim() : '';
        if (tokenStr === LEGACY_LOCAL_ONLY_ACCESS_TOKEN) {
          await deleteLoginInfo();
          stopChatSocket();
          dispatch(setLogout());
          return;
        }

        if (!token) {
          if (isManualLoginCompleted()) return;
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
        } catch (e) {
          if (isManualLoginCompleted()) return;
          if (isAuthFailure(e)) {
            await deleteLoginInfo();
            stopChatSocket();
            dispatch(setLogout());
            return;
          }

          // 네트워크/서버 일시 오류에서는 토큰을 지우지 않고 세션 유지
          dispatch(setLoginSuccess());
          return;
        }

        if (cancelled) return;

        dispatch(setLoginSuccess());
        const raw = userResult?.data ?? userResult;
        if (raw && typeof raw === 'object') {
          dispatch(setUser(raw));
          dispatch(syncMarketingNotificationFromServer());
        }

        if (raw && typeof raw === 'object' && raw.phoneVerified === false) {
          const snap = getAuthRoutingMmkvSnapshotSync();
          const step = snap.signupProgressStep;
          const pastPhoneInSignupFlow =
            step === SIGNUP_PROGRESS_STEP.TERMS ||
            step === SIGNUP_PROGRESS_STEP.PROFILE ||
            step === SIGNUP_PROGRESS_STEP.FAMILY ||
            step === SIGNUP_PROGRESS_STEP.FINISH;
          if (!pastPhoneInSignupFlow) {
            try {
              await setStoredPhoneVerificationPending(true);
            } catch {
              null;
            }
            dispatch(setPhoneVerificationPending());
          }
        }

        // familyId 추출 보강 (DTO 구조 흔들려도 안전)
        const familyId = raw?.familyId ?? raw?.family?.familyId ?? null;

        const hasFamilyValue = familyId != null;

        await setHasFamily(hasFamilyValue);
        if (hasFamilyValue) {
          const familyReq = dispatch(
            homeApi.endpoints.getFamily.initiate(familyId, {
              forceRefetch: true,
            }),
          );
          const familyRes = await familyReq.unwrap();
          familyReq.unsubscribe();
          const familyData = familyRes?.data ?? familyRes;
          if (familyData && typeof familyData === 'object') {
            dispatch(setFamily(familyData));
          }

          const userId = raw?.userId ?? raw?.id ?? null;
          if (userId) {
            const familyUsersReq = dispatch(
              homeApi.endpoints.getFamilyUsers.initiate(familyId, {
                forceRefetch: true,
              }),
            );
            familyUsersReq
              .unwrap()
              .then(familyUsersRes => {
                const users =
                  (Array.isArray(familyUsersRes) && familyUsersRes) ||
                  familyUsersRes?.data ||
                  familyUsersRes?.users ||
                  familyUsersRes?.data?.users ||
                  [];
                if (Array.isArray(users)) {
                  dispatch(setFamilyUserList(users));
                }
              })
              .finally(() => familyUsersReq.unsubscribe());
            // RTK Query: ChatRoom 태그 무효화 → getChatRooms 자동 fetch
            dispatch(baseApi.util.invalidateTags(['ChatRoom']));
          }
        }

        if (cancelled) return;

        if (!socketUnsubRef.current) {
          const unsub = await ensureChatSocketIfSignedIn(
            dispatch,
            store.getState,
          );
          if (typeof unsub === 'function') {
            socketUnsubRef.current = unsub;
          }
        }
      } catch (err) {
        if (isManualLoginCompleted()) return;
        if (isAuthFailure(err)) {
          await deleteLoginInfo();
          stopChatSocket();
          dispatch(setLogout());
          return;
        }

        // getToken timeout 등 일시 오류는 강제 로그아웃하지 않음
        dispatch(setLoginSuccess());
      } finally {
        const checked = !!store.getState()?.login?.authChecked;
        if (!checked) {
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
