// src/utils/apiClient.js
import axios from 'axios';
import {getToken, deleteLoginInfo, getGuestMode} from './storage';
import {safeReset} from 'app/navigation/navigationService';

// ✅ 방식 1) baseURL에 /api 포함 (추천)
const BASE = 'https://kinover.shop/api';

export const apiClient = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

// ✅ Authorization 제외할 경로들
const AUTH_EXCLUDE_PREFIXES = [
  '/login',
  '/signup',
  '/auth',
  '/oauth',
];

// 요청 URL(path)이 제외대상인지 체크
const isAuthExcluded = (url = '') => {
  // url은 보통 "/login/apple" 형태로 들어옴
  return AUTH_EXCLUDE_PREFIXES.some(prefix => String(url).startsWith(prefix));
};

apiClient.interceptors.request.use(async config => {
  const isGuest = await getGuestMode();
  if (isGuest) {
    return Promise.reject({
      isGuestBlocked: true,
      message: 'GUEST_MODE_BLOCKED',
      config,
    });
  }

  // ✅ 로그인/회원가입 계열은 Authorization 주입하지 않음
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

    // ✅ 로그인/회원가입 요청은 401이어도 앱 reset 금지
    const reqUrl = error?.config?.url || '';
    const excluded = isAuthExcluded(reqUrl);

    if (status === 401 && !excluded) {
      // ✅ 토큰 만료/무효일 때만 처리(너무 넓은 UNAUTHORIZED는 빼는 걸 추천)
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
          }, 800);
        }
      }
    }

    return Promise.reject(error);
  },
);
