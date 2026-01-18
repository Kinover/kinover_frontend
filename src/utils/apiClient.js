// src/utils/apiClient.js
import axios from 'axios';
import {getToken, deleteLoginInfo} from './storage';
import {safeReset} from 'app/navigation/navigationService';

const BASE = 'https://kinover.shop/api';

export const apiClient = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async config => {
    const token = await getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

let isHandlingAuthError = false;

apiClient.interceptors.response.use(
  res => res,
  async error => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const msg = String(data || '');

    // ✅ 토큰 만료/인증 실패 공통 처리
    if (status === 401) {
      const isExpired =
        msg.includes('TOKEN_EXPIRED') ||
        msg.includes('EXPIRED') ||
        msg.includes('UNAUTHORIZED') ||
        msg.includes('INVALID_TOKEN');

      if (isExpired && !isHandlingAuthError) {
        isHandlingAuthError = true;

        try {
          // ✅ 저장된 로그인 정보 제거(토큰 + hasFamily)
          await deleteLoginInfo();

          // ✅ Auth로 reset (네비 ready 전이면 큐에 쌓임)
          safeReset({
            index: 0,
            routes: [{name: 'Auth'}],
          });
        } catch {
          // 혹시 여기서 에러나도 앱 크래시 방지
          null;
        } finally {
          // 너무 오래 잠그지 않게
          setTimeout(() => {
            isHandlingAuthError = false;
          }, 800);
        }
      }
    }

    return Promise.reject(error);
  },
);
