// src/features/auth/store/loginThunk.js
import axios from 'axios';
import {saveToken, setHasFamily} from 'utils/storage';
import {setLoginLoading, setLoginError, setLoginSuccess} from './loginSlice';
import {fetchUserThunk} from 'features/home/store/userThunk';

export const loginThunk = kakaoAccessToken => {
  return async dispatch => {
    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    try {
      const apiUrl = 'https://kinover.shop/api/login/kakao';

      const requestBody =
        typeof kakaoAccessToken === 'string'
          ? {accessToken: kakaoAccessToken}
          : kakaoAccessToken;

      console.log('📤 전송할 데이터:', JSON.stringify(requestBody));

      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      const token = response?.data?.token ?? null;
      const hasFamily = !!response?.data?.hasFamily;

      if (!token) {
        throw new Error('서버에서 토큰이 내려오지 않았어요(token 없음)');
      }

      // ✅ 1) 저장
      await saveToken(token);
      await setHasFamily(hasFamily);

      // ✅ 2) 로그인 상태 true (RootScreen이 이거 보고 Tabs로 감)
      dispatch(setLoginSuccess());

      // ✅ 3) 유저 조회 (토큰 유효성 및 user/familyId 채우기)
      const r = dispatch(fetchUserThunk());
      if (typeof r?.unwrap === 'function') await r.unwrap();
      else await r;

      console.log('✅ 로그인 완료:', response.data);

      return response.data;
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
