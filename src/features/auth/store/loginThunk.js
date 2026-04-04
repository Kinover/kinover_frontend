// src/features/auth/store/loginThunk.js
import {saveToken, setHasFamily, getGuestMode, setNeedsSignup} from 'utils/storage';
import {setLoginLoading, setLoginError, setLoginSuccess} from './loginSlice';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {authApi} from '../services/authApi';

// 게스트 토큰(로컬 전용)
const GUEST_TOKEN = 'GUEST_TOKEN_LOCAL_ONLY';

/**
 * 공통: 로그인 후 userinfo를 가져와서 familyId 기준으로 hasFamily 확정
 * - SSOT: familyId
 * - store/home/user 또는 thunk 결과에서 familyId 추출
 */
async function finalizeHasFamilyAfterLogin(dispatch, getState) {
  const r = dispatch(fetchUserThunk());
  const userResult =
    typeof r?.unwrap === 'function' ? await r.unwrap() : await r;

  const state = getState?.();
  const userFromStore = state?.home?.user || state?.user || null;

  const familyId =
    userResult?.familyId ??
    userResult?.family?.familyId ??
    userFromStore?.familyId ??
    userFromStore?.family?.familyId ??
    null;

  const finalHasFamily = familyId != null;

 // setHasFamily 내부에서 emitAuthFlagsChanged()가 나가게 만들었으니, 여기서 emit은 제거 권장
  await setHasFamily(finalHasFamily);

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

      console.log('📤 [APPLE] send identityToken...');

 // baseURL이 https://kinover.shop/api 라면 여기서는 '/login/apple'가 맞음
      const req = dispatch(authApi.endpoints.loginApple.initiate({identityToken}));
      const response = await req.unwrap();

      const token = response?.token ?? null;
      if (!token) throw new Error('서버에서 토큰이 내려오지 않았어요(token 없음)');

 // 1) 토큰 저장
      await saveToken(token);

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

      console.log('✅ [APPLE] login done:', {
        token: token ? 'OK' : 'NO',
        familyId,
        hasFamily: finalHasFamily,
      });

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

      console.error('❌ [APPLE] login fail:', {
        message,
        status: error?.response?.status,
        response: error?.response?.data ?? null,
      });

      dispatch(setLoginError(String(message)));
      throw error;
    } finally {
      dispatch(setLoginLoading(false));
    }
  };
};
