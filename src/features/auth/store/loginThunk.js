// src/features/auth/store/loginThunk.js
import {apiClient} from 'utils/apiClient';
import {saveToken, setHasFamily, getGuestMode} from 'utils/storage';
import {setLoginLoading, setLoginError, setLoginSuccess} from './loginSlice';
import {fetchUserThunk} from 'features/home/store/userThunk';

// ✅ 게스트 토큰(로컬 전용)
const GUEST_TOKEN = 'GUEST_TOKEN_LOCAL_ONLY';

/**
 * ✅ 공통: 로그인 후 userinfo를 가져와서 familyId 기준으로 hasFamily 확정
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

  // ✅ setHasFamily 내부에서 emitAuthFlagsChanged()가 나가게 만들었으니, 여기서 emit은 제거 권장
  await setHasFamily(finalHasFamily);

  return {familyId, finalHasFamily};
}

/**
 * ✅ 카카오 로그인 thunk
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

      const response = await apiClient.post('/login/kakao', requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      const token = response?.data?.token ?? null;
      if (!token) throw new Error('서버에서 토큰이 내려오지 않았어요(token 없음)');

      await saveToken(token);

      dispatch(setLoginSuccess());

      const {familyId, finalHasFamily} = await finalizeHasFamilyAfterLogin(
        dispatch,
        getState,
      );

      return {
        ...response.data,
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
 * ✅ 애플 로그인 thunk
 * @param {string} identityToken - Apple에서 받은 identityToken
 */
export const appleLoginThunk = identityToken => {
  return async (dispatch, getState) => {
    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    try {
      // ✅ 0) 게스트 모드면 애플 로그인도 스킵 (정책상 막는 게 맞음)
      const isGuest = await getGuestMode?.();
      if (isGuest) {
        throw new Error('게스트 모드에서는 애플 로그인을 사용할 수 없어요.');
      }

      if (!identityToken) {
        throw new Error('identityToken이 없습니다.');
      }

      console.log('📤 [APPLE] send identityToken...');

      // ⚠️ baseURL이 https://kinover.shop/api 라면 여기서는 '/login/apple'가 맞음
      const response = await apiClient.post(
        '/login/apple',
        {identityToken},
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        },
      );

      const token = response?.data?.token ?? null;
      if (!token) throw new Error('서버에서 토큰이 내려오지 않았어요(token 없음)');

      // ✅ 1) 토큰 저장
      await saveToken(token);

      // ✅ 2) 토큰 인증 성공 처리
      dispatch(setLoginSuccess());

      // ✅ 3) userinfo로 hasFamily 확정(SSOT: familyId)
      const {familyId, finalHasFamily} = await finalizeHasFamilyAfterLogin(
        dispatch,
        getState,
      );

      console.log('✅ [APPLE] login done:', {
        token: token ? 'OK' : 'NO',
        familyId,
        hasFamily: finalHasFamily,
      });

      return {
        ...response.data,
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
