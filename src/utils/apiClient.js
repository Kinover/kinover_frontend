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
import {notifyAccountBanned} from 'utils/accountBannedEvent';
import {notifySessionInvalidated} from 'utils/sessionInvalidatedEvent';

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
    config.__hadAuthToken = !!token;
    if (token) {
      const t = String(token).trim().replace(/^Bearer\s+/i, '');
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${t}`,
      };
    }
  } else {
    config.__hadAuthToken = false;
  }

  return config;
});

let isHandlingAuthError = false;
let isHandlingAccountBanned = false;
let isHandlingSessionInvalidated = false;

/**
 * GET .../posts/:id/... 단건·댓글 등 "게시글 없음" 응답 시 공통 Alert 생략
 * - baseURL이 /api 인 경우 pathname이 /api/posts/uuid 형태라 ^/posts/ 만 보면 매칭 실패함 → /posts/<id> 세그먼트 존재 여부로 판별
 * - 서버가 404 대신 400 등 + message "게시물 없음" 인 경우도 동일하게 스팸 방지
 */
function shouldSkipCommonAlertForPostSubresource404(error) {
  const method = String(error?.config?.method ?? 'get').toLowerCase();
  if (method !== 'get') return false;

  let path = String(error?.config?.url ?? '');
  try {
    if (path.includes('://')) {
      path = new URL(path).pathname || '';
    }
  } catch {
    // ignore
  }
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  // 목록 GET /posts , /api/posts (쿼리만) 은 제외 — /posts/<id> 가 있을 때만
  if (!/\/posts\/[^/?]+/.test(path)) {
    return false;
  }

  const status = error?.response?.status;
  const data = error?.response?.data;
  const msg = String(
    data?.message ?? (typeof data === 'string' ? data : '') ?? '',
  ).trim();

  if (status === 404 || status === 410) {
    return true;
  }
  if (msg.includes('게시물 없음') || msg.includes('게시글 없음')) {
    return true;
  }
  return false;
}

function sessionInvalidatedUserMessage(data) {
  const m =
    typeof data?.message === 'string' ? String(data.message).trim() : '';
  if (m) return m;
  const code = data?.code;
  const provider = data?.provider;
  if (code === 'DUPLICATE_PHONE_NUMBER') {
    if (provider === 'KAKAO') {
      return '이 번호는 이미 카카오 계정으로 가입되어 있어요. 카카오로 로그인해 주세요.';
    }
    if (provider === 'APPLE') {
      return '이 번호는 이미 Apple 계정으로 가입되어 있어요. Apple로 로그인해 주세요.';
    }
    return '이미 등록된 전화번호예요. 해당 계정으로 로그인해 주세요.';
  }
  if (code === 'ACCOUNT_INVALIDATED') {
    return '가입이 취소되었거나 다시 로그인해야 해요.';
  }
  return '다시 로그인해 주세요.';
}

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

    const hadAuthToken = Boolean(
      error?.config?.__hadAuthToken ||
      error?.config?.headers?.Authorization,
    );

    const isAccountBanned = status === 403 && data?.code === 'ACCOUNT_BANNED';
    if (isAccountBanned) {
      if (!isHandlingAccountBanned) {
        isHandlingAccountBanned = true;
        const banMsg =
          typeof data?.message === 'string' && data.message.trim()
            ? data.message.trim()
            : '';
        notifyAccountBanned(banMsg);
        setTimeout(() => {
          isHandlingAccountBanned = false;
        }, 2500);
      }
      return Promise.reject(error);
    }

    const isSessionInvalidatedResponse =
      (status === 403 && data?.code === 'ACCOUNT_INVALIDATED') ||
      (status === 409 && data?.code === 'DUPLICATE_PHONE_NUMBER');
    if (isSessionInvalidatedResponse && !isHandlingSessionInvalidated) {
      isHandlingSessionInvalidated = true;
      try {
        const message = sessionInvalidatedUserMessage(data);
        await deleteLoginInfo();
        notifySessionInvalidated({
          message,
          code: data?.code,
          provider: data?.provider,
        });
      } finally {
        setTimeout(() => {
          isHandlingSessionInvalidated = false;
        }, AUTH_ERROR_COOLDOWN_MS ?? 800);
      }
      return Promise.reject(error);
    }

    if (status === 401 && !excluded && hadAuthToken) {
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
    const skipCommonAlertForHandledSession =
      (status === 403 && data?.code === 'ACCOUNT_INVALIDATED') ||
      (status === 409 && data?.code === 'DUPLICATE_PHONE_NUMBER');
    if (
      !(status === 401 && !excluded) &&
      !skipCommonAlertForHandledSession &&
      !shouldSkipCommonAlertForPostSubresource404(error)
    ) {
      showApiError(error);
    }
    return Promise.reject(error);
  },
);
