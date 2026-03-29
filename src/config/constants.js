/**
 * 전역 상수 — API, 소켓, 애니메이션, UI 타이밍 등
 * 환경 변수(.env)는 react-native-config로 주입되며, 없을 경우 아래 기본값을 사용합니다.
 * 배포 시 .env 또는 ENVFILE로 설정해 민감 정보를 코드에 하드코딩하지 마세요.
 *
 * Android에서 네이티브 모듈이 null일 때 getConfig 크래시를 막기 위해
 * react-native-config를 직접 import하지 않고 NativeModules로 안전하게 읽습니다.
 */

import {NativeModules} from 'react-native';

function getConfigSafe() {
  try {
    const RNC = NativeModules.RNCConfigModule ?? NativeModules.ReactNativeConfig;
    if (!RNC) return {};
    if (typeof RNC.getConfig === 'function') {
      const res = RNC.getConfig();
      return (res && res.config) ? res.config : {};
    }
    if (typeof RNC.getConstants === 'function') {
      return RNC.getConstants() || {};
    }
    return {};
  } catch (e) {
    return {};
  }
}

const Config = getConfigSafe();

const env = (key, fallback) => {
  try {
    const v = Config?.[key];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  } catch (e) {
    /* Config 미주입 환경(테스트 등) */
  }
  return fallback;
};

// ==================== API (환경 변수 우선) ====================
export const API_BASE_URL = env('API_BASE_URL', 'https://kinover.shop/api');
export const API_TIMEOUT_MS = 15000;

// ==================== WebSocket (환경 변수 우선) ====================
export const WS_CHAT_BASE_URL = env('WS_CHAT_BASE_URL', 'ws://kinover.shop:9090');
export const WS_CHAT_PATH = '/chat';
/** 가족 온라인 상태 소켓 경로 (WS_CHAT_BASE_URL + WS_FAMILY_STATUS_PATH) */
export const WS_FAMILY_STATUS_PATH = '/family-status';
/** 접속 상태 소켓 경로 (WS_CHAT_BASE_URL + WS_STATUS_PATH) */
export const WS_STATUS_PATH = '/status';
/** 메시지 배칭 디바운스 (ms) */
export const CHAT_BATCH_DEBOUNCE_MS = 80;
/** 재연결 대기: base * (attempt+1), 최대 RECONNECT_DELAY_MAX_MS */
export const RECONNECT_DELAY_BASE_MS = 1000;
export const RECONNECT_DELAY_MAX_MS = 5000;
/** Heartbeat ping 전송 주기 (ms) */
export const WS_HEARTBEAT_INTERVAL_MS = 30000;
/** ping 전송 후 pong 대기 타임아웃 (ms) */
export const WS_HEARTBEAT_TIMEOUT_MS = 10000;

// ==================== 애니메이션 (ms) ====================
export const ANIM_DURATION_SHORT = 120;
export const ANIM_DURATION_MED = 140;
export const ANIM_DURATION_NORMAL = 180;
export const ANIM_DURATION_LONG = 220;
export const ANIM_DURATION_PANEL = 240;

// ==================== UI 타이밍 (ms) ====================
/** 토스트/알림 표시 시간 */
export const TOAST_VISIBLE_MS = 1800;
/** 401 처리 후 재시도 전 쿨다운 */
export const AUTH_ERROR_COOLDOWN_MS = 800;
/** 키보드/모달 닫힘 대기 등 */
export const UI_DEBOUNCE_SHORT_MS = 180;
export const UI_DEBOUNCE_MED_MS = 280;

// ==================== 문자열 (반복 사용) ====================
export const AUTH_EXCLUDE_PREFIXES = ['/login', '/signup', '/auth', '/oauth'];
