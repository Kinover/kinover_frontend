// src/utils/apiClient.js
// baseURL·timeout: config/constants.js
// 엔드포인트 경로: config/apiEndpoints.js
// 401 인증 만료 시: 로그아웃 후 Auth 화면 리셋
// 그 외 API 에러 시: apiErrorHandler.showApiError() 로 공통 알림
//
// reject 시 config 객체를 넘기지 말 것(config.headers에 토큰 포함될 수 있음).
import axios from 'axios';
import {getToken, deleteLoginInfo, getGuestMode} from './storage';
import {safeReset} from 'app/navigation/navigationService';
import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  AUTH_EXCLUDE_PREFIXES,
  AUTH_ERROR_COOLDOWN_MS,
} from 'config/constants';
import {showApiError} from 'features/chat/utils/apiErrorHandler';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

// 요청 URL(path)이 제외대상인지 체크
const isAuthExcluded = (url = '') => {
  return (AUTH_EXCLUDE_PREFIXES ?? []).some(prefix =>
    String(url).startsWith(prefix),
  );
};

apiClient.interceptors.request.use(async config => {
  const isGuest = await getGuestMode();
  if (isGuest) {
    return Promise.reject({
      isGuestBlocked: true,
      message: 'GUEST_MODE_BLOCKED',
 // config 제외: headers에 Authorization 등 민감 정보가 들어갈 수 있음
    });
  }

 // 로그인/회원가입 계열은 Authorization 주입하지 않음
  if (!isAuthExcluded(config?.url)) {
    const token = await getToken();
    if (token) {
      const t = String(token).trim().replace(/^Bearer\s+/i, '');
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${t}`,
      };
    }
  }

  return config;
});

let isHandlingAuthError = false;

apiClient.interceptors.response.use(
  res => res,
  async error => {
    if (error?.isGuestBlocked) return Promise.reject(error);

    const status = error?.response?.status;
    const data = error?.response?.data;
    const msg = String(
      data?.message ??
        (typeof data === 'string' ? data : '') ??
        '',
    );

 // 로그인/회원가입 요청은 401이어도 앱 reset 금지
    const reqUrl = error?.config?.url || '';
    const excluded = isAuthExcluded(reqUrl);

    if (status === 401 && !excluded) {
      const isExpired =
        msg.includes('TOKEN_EXPIRED') ||
        msg.includes('EXPIRED') ||
        msg.includes('INVALID_TOKEN') ||
        msg.includes('TOKEN_MISSING');

      if (isExpired && !isHandlingAuthError) {
        isHandlingAuthError = true;
        try {
          await deleteLoginInfo();
          safeReset({index: 0, routes: [{name: 'Auth'}]});
        } finally {
          setTimeout(() => {
            isHandlingAuthError = false;
          }, AUTH_ERROR_COOLDOWN_MS ?? 800);
        }
      }
    }

 // 401(리다이렉트) 제외한 모든 API 에러에 대해 공통 알림 (401은 위에서 처리했으면 알림 생략)
    if (!(status === 401 && !excluded)) {
      showApiError(error);
    }
    return Promise.reject(error);
  },
);
