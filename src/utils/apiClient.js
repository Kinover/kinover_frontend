// src/utils/apiClient.js
import axios from 'axios/dist/browser/axios.cjs';
import {getToken, deleteLoginInfo, getGuestMode} from './storage';
import {safeReset} from 'app/navigation/navigationService';

const BASE = 'https://kinover.shop/api';

export const apiClient = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

apiClient.interceptors.request.use(async config => {
  const isGuest = await getGuestMode();
  if (isGuest) {
    return Promise.reject({ isGuestBlocked: true, message: 'GUEST_MODE_BLOCKED', config });
  }

  const token = await getToken();
  if (token) {
    const t = String(token).trim().replace(/^Bearer\s+/i, '');

    // ✅ 기존 헤더를 유지하면서 Authorization만 주입
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${t}`,
    };
  }

  return config;
});


let isHandlingAuthError = false;

apiClient.interceptors.response.use(
  res => res,
  async error => {
    if (error?.isGuestBlocked) {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const data = error?.response?.data;
    const msg = String(data || '');

    if (status === 401) {
      const isExpired =
        msg.includes('TOKEN_EXPIRED') ||
        msg.includes('EXPIRED') ||
        msg.includes('UNAUTHORIZED') ||
        msg.includes('INVALID_TOKEN') ||
        msg.includes('TOKEN_MISSING');

      if (isExpired && !isHandlingAuthError) {
        isHandlingAuthError = true;

        try {
          await deleteLoginInfo();
          safeReset({
            index: 0,
            routes: [{name: 'Auth'}],
          });
        } catch {
          null;
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
