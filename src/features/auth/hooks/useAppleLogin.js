// src/features/auth/hooks/useAppleLogin.js
import {useCallback, useRef} from 'react';
import {Platform, Alert} from 'react-native';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {useDispatch, useStore} from 'react-redux';

import {appleLoginThunk} from '../store/loginThunk';
import {
  ensureChatSocketIfSignedIn,
  stopChatSocket,
} from 'features/chat/hooks/ChatSocket';
import {getApiErrorMessage} from 'features/chat/utils/apiErrorHandler';

import {
  setLoginError,
  setLoginLoading,
  setAuthChecked,
  setLogout,
} from '../store/loginSlice';

import {deleteLoginInfo} from 'utils/storage';
import {applySignupRoutingAfterSocialLogin} from '../utils/applySignupRoutingAfterSocialLogin';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {updateUser} from 'features/home/store/userSlice';

/**
 * Apple credential → POST /api/login/apple 바디 (값이 있을 때만 선택 필드 포함)
 * @param {import('@invertase/react-native-apple-authentication').AppleRequestResponse} res
 * @returns {object|null} identityToken 없으면 null
 */
export function buildAppleLoginPayloadFromCredential(res) {
  const identityToken = res?.identityToken;
  if (!identityToken) {
    return null;
  }
  const payload = {identityToken};
  const email = res?.email;
  if (typeof email === 'string' && email.trim()) {
    payload.email = email.trim();
  }
  const fn = res?.fullName;
  const familyName = fn?.familyName;
  const givenName = fn?.givenName;
  if (typeof familyName === 'string' && familyName.trim()) {
    payload.familyName = familyName.trim();
  }
  if (typeof givenName === 'string' && givenName.trim()) {
    payload.givenName = givenName.trim();
  }
  return payload;
}

/**
 * Sign in with Apple이 이미 준 이름·이메일을 Redux에 반영 (App Review 4.x — 동일 정보 재수집 방지)
 * @param {import('@invertase/react-native-apple-authentication').AppleRequestResponse} res
 * @returns {Record<string, string>|null}
 */
export function buildAppleCredentialUserPatch(res) {
  if (!res || typeof res !== 'object') return null;
  const fn = res.fullName;
  const familyRaw =
    typeof fn?.familyName === 'string' ? fn.familyName.trim() : '';
  const givenRaw =
    typeof fn?.givenName === 'string' ? fn.givenName.trim() : '';
  const noSpace =
    familyRaw && givenRaw
      ? `${familyRaw}${givenRaw}`.trim()
      : familyRaw || givenRaw || '';
  const spaced = [givenRaw, familyRaw].filter(Boolean).join(' ').trim();
  const displayName = (noSpace || spaced).trim();

  const patch = {};
  if (displayName) patch.name = displayName;
  if (typeof res.email === 'string' && res.email.trim()) {
    patch.email = res.email.trim();
  }
  return Object.keys(patch).length ? patch : null;
}

async function hydrateUserAfterAppleLogin(dispatch, store, appleRes) {
  try {
    await dispatch(fetchUserThunk()).unwrap();
  } catch {
    null;
  }
  const patch = buildAppleCredentialUserPatch(appleRes);
  if (!patch) return;
  const u = store.getState()?.user;
  const next = {};
  if (patch.name && !String(u?.name ?? '').trim()) {
    next.name = patch.name;
  }
  if (patch.email && !String(u?.email ?? '').trim()) {
    next.email = patch.email;
  }
  if (Object.keys(next).length) {
    dispatch(updateUser(next));
  }
}

function applyAppleCredentialIfUserFieldsEmpty(dispatch, store, appleRes) {
  const patch = buildAppleCredentialUserPatch(appleRes);
  if (!patch) return;
  const u = store.getState()?.user;
  const next = {};
  if (patch.name && !String(u?.name ?? '').trim()) {
    next.name = patch.name;
  }
  if (patch.email && !String(u?.email ?? '').trim()) {
    next.email = patch.email;
  }
  if (Object.keys(next).length) {
    dispatch(updateUser(next));
  }
}

function normalizeRequestError(e) {
  const status = e?.response?.status ?? e?.status;
  const data = e?.response?.data ?? e?.data;
  return {status, data};
}

function isDuplicateSocialProviderError(e) {
  const {status, data} = normalizeRequestError(e);
  const code = data?.code;
  const codeStr = code != null ? String(code) : '';
  return (
    status === 409 &&
    (code === 'DUPLICATE_SOCIAL_PROVIDER' ||
      code === 'DuplicateSocialProviderException' ||
      codeStr.includes('DuplicateSocialProvider'))
  );
}

function isUserCanceledAppleError(e) {
  const c = e?.code ?? e?.error ?? e?.nativeErrorCode;
  return (
    c === appleAuth.Error.CANCELED ||
    c === '1001' ||
    String(c) === '1001'
  );
}

function toApiErrorShape(e) {
  if (e?.response) {
    return e;
  }
  const {status, data} = normalizeRequestError(e);
  return {response: {status, data}};
}

/**
 * 애플 로그인: Sign in with Apple → 즉시 POST /api/login/apple (RTK → apiClient)
 * 로그인 성공 후 홈(탭) 진입은 RootScreen이 로그인 상태로 앱 루트를 그리면서 처리합니다.
 *
 * @param {object} options
 * @param {import('redux').Dispatch} options.dispatch
 * @param {import('redux').Store} options.store
 */
export async function onAppleButtonPress({dispatch, store} = {}) {
  if (Platform.OS !== 'ios') {
    const msg = '애플 로그인은 iOS에서만 지원돼요.';
    dispatch(setLoginError(msg));
    Alert.alert('애플 로그인', msg);
    return;
  }

  if (!appleAuth.isSupported) {
    const msg =
      '이 기기/환경에서는 애플 로그인을 지원하지 않아요. (시뮬레이터/Capability/서명 설정 확인)';
    dispatch(setLoginError(msg));
    Alert.alert('애플 로그인', msg);
    return;
  }

  dispatch(setLoginLoading(true));
  dispatch(setLoginError(null));
  let loginConfirmed = false;

  try {
    const res = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    const payload = buildAppleLoginPayloadFromCredential(res);
    if (!payload?.identityToken) {
      throw new Error(
        'identityToken이 없습니다. (실기기/Sign In with Apple Capability/서명 설정 확인 필요)',
      );
    }

    const loginAction = dispatch(appleLoginThunk(payload));
    const loginResult =
      typeof loginAction?.unwrap === 'function'
        ? await loginAction.unwrap()
        : await loginAction;
    loginConfirmed = true;

    await applySignupRoutingAfterSocialLogin(loginResult, dispatch);

    if (loginResult?.needsSignup || loginResult?.phoneVerified === false) {
      await hydrateUserAfterAppleLogin(dispatch, store, res);
    } else {
      applyAppleCredentialIfUserFieldsEmpty(dispatch, store, res);
    }

    await ensureChatSocketIfSignedIn(dispatch, store.getState);

    if (loginResult?.needsSignup) {
      dispatch(setAuthChecked(true));
      return;
    }

    if (loginResult?.phoneVerified === false) {
      dispatch(setAuthChecked(true));
      return;
    }

    dispatch(setAuthChecked(true));
  } catch (e) {
    if (isUserCanceledAppleError(e)) {
      dispatch(setLoginError(null));
      return;
    }

    const alreadyLoggedIn = loginConfirmed || !!store.getState()?.login?.isLoggedIn;
    if (alreadyLoggedIn) {
      dispatch(setLoginError(null));
      dispatch(setAuthChecked(true));
      return;
    }

    const dup = isDuplicateSocialProviderError(e);

    try {
      await deleteLoginInfo();
    } catch {
      null;
    }
    try {
      stopChatSocket();
    } catch {
      null;
    }
    dispatch(setLogout());

    if (dup) {
      dispatch(setLoginError(null));
      // apiClient 인터셉터(showApiError)가 이미 안내 Alert 표시
    } else {
      const message =
        getApiErrorMessage(toApiErrorShape(e)) ||
        e?.message ||
        '애플 로그인 실패';
      dispatch(setLoginError(String(message)));
      Alert.alert('애플 로그인 실패', String(message));
    }
    dispatch(setAuthChecked(true));
  } finally {
    dispatch(setLoginLoading(false));
  }
}

export function useAppleLogin() {
  const dispatch = useDispatch();
  const store = useStore();
  const inFlightRef = useRef(false);

  const login = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    try {
      await onAppleButtonPress({dispatch, store});
    } finally {
      inFlightRef.current = false;
    }
  }, [dispatch, store]);

  const boundAppleButtonPress = useCallback(
    () => onAppleButtonPress({dispatch, store}),
    [dispatch, store],
  );

  return {login, onAppleButtonPress: boundAppleButtonPress};
}
