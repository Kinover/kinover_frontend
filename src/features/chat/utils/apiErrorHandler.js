/**
 * API 에러 메시지 정규화 및 공통 알림
 */
import {Alert} from 'react-native';

export function getApiErrorMessage(error) {
  if (!error) return '';
  const status = error?.response?.status;
  // 5xx는 서버 내부 메시지(SQL 등)를 절대 노출하지 않음
  if (status >= 500) return '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
  const data = error?.response?.data;
  // 중복 소셜 프로바이더 가입 시도
  if (status === 409 && data?.code === 'DUPLICATE_SOCIAL_PROVIDER') {
    if (data?.provider === 'KAKAO') return '이미 카카오톡으로 가입된 계정이에요. 카카오톡으로 로그인해 주세요.';
    if (data?.provider === 'APPLE') return '이미 Apple로 가입된 계정이에요. Apple 로그인을 이용해 주세요.';
    return '이미 다른 방법으로 가입된 계정이에요.';
  }
  if (status === 404) return '요청한 내용을 찾을 수 없어요.';
  if (status === 403) return '권한이 없어요.';
  const msg =
    data?.message ??
    (typeof data === 'string' ? data : null) ??
    error?.message ??
    '';
  if (msg) return String(msg).trim();
  if (status >= 400) return `오류가 발생했어요. (${status})`;
  return '네트워크 오류가 발생했어요.';
}

export function showApiError(error, options = {}) {
  const {skipAlert = false} = options;
  const message = getApiErrorMessage(error);
  if (!skipAlert && message) {
    Alert.alert('오류', message, [{text: '확인'}]);
  }
  return message;
}

