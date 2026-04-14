// src/features/auth/store/loginThunk.js
import {saveToken, setHasFamily, getGuestMode, setNeedsSignup, getNeedsSignup} from 'utils/storage';
import {setLoginLoading, setLoginError, setLoginSuccess} from './loginSlice';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {authApi} from '../services/authApi';
import {resetFamilyState, setFamily} from 'features/home/store/familySlice';
import {setFamilyUserList} from 'features/home/store/userFamilySlice';
import {resetUser} from 'features/home/store/userSlice';
import {homeApi} from 'features/home/services/homeApi';
import {baseApi} from 'services/baseApi';

// 게스트 토큰(로컬 전용)
const GUEST_TOKEN = 'GUEST_TOKEN_LOCAL_ONLY';

/**
 * 다른 계정으로 로그인할 때 이전 세션의 가족/유저/RTK 캐시가 남지 않도록 초기화
 * (userSlice·familySlice의 `??` 병합 + 미갱신 family slice로 인한 오가족 표시 방지)
 */
function clearSessionIdentity(dispatch) {
  dispatch(resetFamilyState());
  dispatch(setFamilyUserList([]));
  dispatch(resetUser());
  dispatch(baseApi.util.resetApiState());
}

/**
 * 공통: 로그인 후 userinfo를 가져와서 familyId 기준으로 hasFamily 확정
 * - SSOT: familyId
 * - 수동 로그인 시에도 useAutoLogin처럼 getFamily / getFamilyUsers로 Redux 동기화
 */
async function finalizeHasFamilyAfterLogin(dispatch, getState) {
  const r = dispatch(fetchUserThunk());
  const userResult =
    typeof r?.unwrap === 'function' ? await r.unwrap() : await r;

  const state = getState?.();
  const userFromStore = state?.user || state?.home?.user || null;

  const familyId =
    userResult?.familyId ??
    userResult?.family?.familyId ??
    userFromStore?.familyId ??
    userFromStore?.family?.familyId ??
    null;

  const finalHasFamily = familyId != null;

  await setHasFamily(finalHasFamily);

  if (finalHasFamily && familyId != null) {
    try {
      const freq = dispatch(
        homeApi.endpoints.getFamily.initiate(familyId, {
          forceRefetch: true,
        }),
      );
      const familyRes = await freq.unwrap();
      freq.unsubscribe();
      const familyData = familyRes?.data ?? familyRes;
      if (familyData && typeof familyData === 'object') {
        dispatch(setFamily(familyData));
      }

      const uid =
        userResult?.userId ??
        userResult?.id ??
        userFromStore?.userId ??
        null;
      if (uid != null) {
        const fur = dispatch(
          homeApi.endpoints.getFamilyUsers.initiate(familyId, {
            forceRefetch: true,
          }),
        );
        try {
          const familyUsersRes = await fur.unwrap();
          const users =
            (Array.isArray(familyUsersRes) && familyUsersRes) ||
            familyUsersRes?.data ||
            familyUsersRes?.users ||
            familyUsersRes?.data?.users ||
            [];
          if (Array.isArray(users)) {
            dispatch(setFamilyUserList(users));
          }
        } finally {
          fur.unsubscribe();
        }
      }
    } catch {
      dispatch(resetFamilyState());
      dispatch(setFamilyUserList([]));
    }
  } else {
    dispatch(resetFamilyState());
    dispatch(setFamilyUserList([]));
  }

  return {familyId, finalHasFamily};
}

const inferNeedsSignup = response => {
  return !!(
    response?.needsSignup ||
    response?.needSignup ||
    response?.signupRequired ||
    response?.isNewUser
  );
};

const isSignupRequiredError = error => {
  const status = Number(error?.response?.status);
  const msg = String(
    error?.response?.data?.message ??
      (typeof error?.response?.data === 'string' ? error?.response?.data : '') ??
      error?.message ??
      '',
  ).toUpperCase();

  return (
    status === 404 ||
    msg.includes('SIGNUP') ||
    msg.includes('NEEDS_SIGNUP') ||
    msg.includes('USER_NOT_FOUND')
  );
};

/**
 * 카카오 로그인 thunk
 * @param {string|object} kakaoAccessToken - 보통 string(accessToken)
 */
export const loginThunk = kakaoAccessToken => {
  return async (dispatch, getState) => {
    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    try {
      const isGuest = await getGuestMode?.();
      if (isGuest) {
        await saveToken(GUEST_TOKEN);

        dispatch(setLoginSuccess());
        clearSessionIdentity(dispatch);
        const {familyId, finalHasFamily} = await finalizeHasFamilyAfterLogin(
          dispatch,
          getState,
        );

        return {token: GUEST_TOKEN, hasFamily: finalHasFamily, familyId, guest: true};
      }

      const requestBody =
        typeof kakaoAccessToken === 'string'
          ? {accessToken: kakaoAccessToken}
          : kakaoAccessToken;

      const req = dispatch(authApi.endpoints.loginKakao.initiate(requestBody));
      const response = await req.unwrap();

      const token = response?.token ?? null;
      if (!token) throw new Error('서버에서 토큰이 내려오지 않았어요(token 없음)');

      await saveToken(token);
      clearSessionIdentity(dispatch);
      const needsSignup = inferNeedsSignup(response);

      dispatch(setLoginSuccess());

      if (needsSignup) {
        await setNeedsSignup(true);
        await setHasFamily(false);

        return {
          ...response,
          token,
          hasFamily: false,
          familyId: null,
          needsSignup: true,
        };
      }

      await setNeedsSignup(false);

      // 전화번호 미인증 상태 — finalizeHasFamilyAfterLogin을 건너뛰고 인증 화면으로 분기
      if (response?.phoneVerified === false) {
        await setHasFamily(false);
        return {
          ...response,
          token,
          hasFamily: false,
          familyId: null,
          phoneVerified: false,
        };
      }

      let familyId = null;
      let finalHasFamily = false;
      try {
        const resolved = await finalizeHasFamilyAfterLogin(dispatch, getState);
        familyId = resolved?.familyId ?? null;
        finalHasFamily = !!resolved?.finalHasFamily;
      } catch (e) {
        if (!isSignupRequiredError(e)) throw e;
        await setNeedsSignup(true);
        await setHasFamily(false);
        familyId = null;
        finalHasFamily = false;
      }

      return {
        ...response,
        token,
        hasFamily: finalHasFamily,
        familyId,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        '로그인에 실패했어요';

      dispatch(setLoginError(String(message)));
      throw error;
    } finally {
      dispatch(setLoginLoading(false));
    }
  };
};

/**
 * 애플 로그인 thunk
 * @param {string} identityToken - Apple에서 받은 identityToken
 */
export const appleLoginThunk = identityToken => {
  return async (dispatch, getState) => {
    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    try {
 // 0) 게스트 모드면 애플 로그인도 스킵 (정책상 막는 게 맞음)
      const isGuest = await getGuestMode?.();
      if (isGuest) {
        throw new Error('게스트 모드에서는 애플 로그인을 사용할 수 없어요.');
      }

      if (!identityToken) {
        throw new Error('identityToken이 없습니다.');
      }


 // baseURL이 https://kinover.shop/api 라면 여기서는 '/login/apple'가 맞음
      const req = dispatch(authApi.endpoints.loginApple.initiate({identityToken}));
      const response = await req.unwrap();

      const token = response?.token ?? null;
      if (!token) throw new Error('서버에서 토큰이 내려오지 않았어요(token 없음)');

 // 1) 토큰 저장
      await saveToken(token);
      clearSessionIdentity(dispatch);

 // 2) 토큰 인증 성공 처리
      dispatch(setLoginSuccess());

      const needsSignup = inferNeedsSignup(response);
      if (needsSignup) {
        await setNeedsSignup(true);
        await setHasFamily(false);
        return {
          ...response,
          token,
          hasFamily: false,
          familyId: null,
          needsSignup: true,
        };
      }

      await setNeedsSignup(false);

      // 전화번호 미인증 상태 — finalizeHasFamilyAfterLogin을 건너뛰고 인증 화면으로 분기
      if (response?.phoneVerified === false) {
        await setHasFamily(false);
        return {
          ...response,
          token,
          hasFamily: false,
          familyId: null,
          phoneVerified: false,
        };
      }

 // 3) userinfo로 hasFamily 확정(SSOT: familyId)
      let familyId = null;
      let finalHasFamily = false;
      try {
        const resolved = await finalizeHasFamilyAfterLogin(dispatch, getState);
        familyId = resolved?.familyId ?? null;
        finalHasFamily = !!resolved?.finalHasFamily;
      } catch (e) {
        if (!isSignupRequiredError(e)) throw e;
        await setNeedsSignup(true);
        await setHasFamily(false);
        familyId = null;
        finalHasFamily = false;
      }

      return {
        ...response,
        token,
        hasFamily: finalHasFamily,
        familyId,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        '애플 로그인에 실패했어요';

      dispatch(setLoginError(String(message)));
      throw error;
    } finally {
      dispatch(setLoginLoading(false));
    }
  };
};

/**
 * 전화번호 인증 완료 후 hasFamily/needsSignup을 확정하는 thunk
 * PhoneVerificationScreen에서 인증 성공 후 dispatch한다.
 * setHasFamily() 호출 → emitAuthFlagsChanged() → rootScreen.refreshAuthFlags() 자동 트리거
 */
export const finalizeAfterPhoneVerificationThunk = () => {
  return async (dispatch, getState) => {
    try {
      const needsSignup = await getNeedsSignup();
      if (needsSignup) {
        await setHasFamily(false);
        try {
          await dispatch(fetchUserThunk()).unwrap();
        } catch {
          // userinfo 실패 시에도 MMKV·updateUser로 라우팅은 유지
        }
        return;
      }
      await finalizeHasFamilyAfterLogin(dispatch, getState);
    } catch {
      // 라우팅 fallback이 처리함 — 여기서 throw하지 않음
    }
  };
};
