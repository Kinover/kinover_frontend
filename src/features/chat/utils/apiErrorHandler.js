/**
 * API 에러 메시지 정규화 및 공통 알림
 */
import {Alert} from 'react-native';

export function getApiErrorMessage(error) {
  if (!error) return '';
  const data = error?.response?.data;
  const msg =
    data?.message ??
    (typeof data === 'string' ? data : null) ??
    error?.message ??
    '';
  if (msg) return String(msg).trim();
  const status = error?.response?.status;
  if (status === 500) return '서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
  if (status === 502 || status === 503) return '서비스를 일시적으로 사용할 수 없어요.';
  if (status === 404) return '요청한 내용을 찾을 수 없어요.';
  if (status === 403) return '권한이 없어요.';
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

