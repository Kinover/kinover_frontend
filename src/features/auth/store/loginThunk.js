// src/features/auth/store/loginThunk.js
import {apiClient} from 'utils/apiClient';
import {
  saveToken,
  setHasFamily,
  getGuestMode,
} from 'utils/storage';
import {setLoginLoading, setLoginError, setLoginSuccess} from './loginSlice';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';

// ✅ 게스트 토큰
const GUEST_TOKEN = 'GUEST_TOKEN_LOCAL_ONLY';

export const loginThunk = kakaoAccessToken => {
  return async (dispatch, getState) => {
    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    try {
      // ✅ 0) 게스트 모드면: 카카오/서버 로그인 스킵
      const isGuest = await getGuestMode?.();
      if (isGuest) {
        const hasFamily = true;

        await saveToken(GUEST_TOKEN);
        await setHasFamily(hasFamily);

        // ✅ RootScreen에 즉시 반영
        emitAuthFlagsChanged({hasFamily});

        dispatch(setLoginSuccess());

        const r = dispatch(fetchUserThunk());
        if (typeof r?.unwrap === 'function') await r.unwrap();
        else await r;

        console.log('🟡 [GUEST] loginThunk: server skipped');
        return {token: GUEST_TOKEN, hasFamily, guest: true};
      }

      // ✅ 1) 일반 로그인(서버)
      const apiUrl = 'https://kinover.shop/api/login/kakao';

      const requestBody =
        typeof kakaoAccessToken === 'string'
          ? {accessToken: kakaoAccessToken}
          : kakaoAccessToken;

      console.log('📤 전송할 데이터:', JSON.stringify(requestBody));

      const response = await apiClient.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      const token = response?.data?.token ?? null;
      const hasFamilyFromLogin = !!response?.data?.hasFamily;

      if (!token) {
        throw new Error('서버에서 토큰이 내려오지 않았어요(token 없음)');
      }

      // ✅ 2) 토큰 먼저 저장
      await saveToken(token);

      // ✅ 3) 로그인 성공(토큰 인증 성공)
      dispatch(setLoginSuccess());

      // ✅ 4) 유저 조회 (SSOT: familyId)
      const r = dispatch(fetchUserThunk());
      let userResult = null;

      if (typeof r?.unwrap === 'function') userResult = await r.unwrap();
      else userResult = await r;

      const state = getState?.();
      const userFromStore = state?.home?.user || state?.user || null;

      const familyId =
        userResult?.familyId ??
        userFromStore?.familyId ??
        null;

      const finalHasFamily = familyId != null;

      // ✅ 5) 로컬 저장 + Root 즉시 반영(중요!)
      await setHasFamily(finalHasFamily);
      emitAuthFlagsChanged({hasFamily: finalHasFamily});

      console.log('✅ 로그인 완료:', {
        token: token ? 'OK' : 'NO',
        hasFamilyFromLogin,
        familyId,
        finalHasFamily,
      });

      return {
        ...response.data,
        hasFamily: finalHasFamily,
        familyId,
      };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        '로그인에 실패했어요';

      console.error('❌ 로그인 실패:', {
        message,
        status: error?.response?.status,
        response: error?.response?.data ?? null,
      });

      dispatch(setLoginError(message));
      throw error;
    } finally {
      dispatch(setLoginLoading(false));
    }
  };
};
