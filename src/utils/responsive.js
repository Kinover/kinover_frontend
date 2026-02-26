// utils/responsive.js
import {Dimensions, Platform} from 'react-native';

const FIGMA = {w: 393, h: 852};
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/**
 * 핵심 포인트
 * - 앱 시작 시 단 한 번만 Dimensions를 읽는다
 * - 이후 폰트 크기 변경 / 접근성 변경(시스템 글자크기) / 일부 디바이스의 display size 변화에 영향 안 받게 "고정 비율" 사용
 * - 단, 회전(가로/세로)까지 대응하려면 이 방식은 의도적으로 포기한 것(요구사항이 '절대 흔들리지 않게'라서)
 */
const INITIAL_WINDOW = Dimensions.get('window');

const BASE_WIDTH_RATIO = INITIAL_WINDOW.width / FIGMA.w;
const BASE_HEIGHT_RATIO = INITIAL_WINDOW.height / FIGMA.h;
const BASE_MIN_RATIO = Math.min(BASE_WIDTH_RATIO, BASE_HEIGHT_RATIO);

/**
 * 폰트 전용 ratio
 * - width 기준(안정적)
 * - clamp로 폭주 방지
 * - 절대 다시 계산 안 함
 */
const BASE_FONT_RATIO = clamp(BASE_WIDTH_RATIO, 0.92, 1.06);

/**
 * 모드(일반/큰글씨/더큰글씨) 전역 상태
 */
export const RESPONSIVE_MODE = {
  NORMAL: 'NORMAL',
  LARGE: 'LARGE',
  EXTRA_LARGE: 'EXTRA_LARGE', // 추가
};

let currentMode = RESPONSIVE_MODE.NORMAL;

export const setResponsiveMode = mode => {
 // 허용 값만 통과
  currentMode =
    mode === RESPONSIVE_MODE.EXTRA_LARGE ||
    mode === RESPONSIVE_MODE.LARGE ||
    mode === RESPONSIVE_MODE.NORMAL
      ? mode
      : RESPONSIVE_MODE.NORMAL;
};

export const getResponsiveMode = () => currentMode;

/**
 * Android 미세 보정(같은 모드라도 Android를 살짝 크게)
 * - width는 레이아웃 깨짐 위험 때문에 1.0 유지
 */
const ANDROID_BONUS =
  Platform.OS === 'android'
    ? {width: 1.0, height: 1.02, icon: 1.02, font: 1.03}
    : {width: 1.0, height: 1.0, icon: 1.0, font: 1.0};

/**
 * 모드별 배수(앱 내부 설정만 반영)
 *
 * 포인트:
 * - width는 웬만하면 건드리지 말기(레이아웃 깨짐)
 * - font만 확실히 키우고, height/icon은 "조금"만 따라가게
 * - EXTRA_LARGE는 LARGE보다 한 단계 더
 */
const MODE_SCALE = {
  [RESPONSIVE_MODE.NORMAL]: {width: 1, height: 1, icon: 1, font: 1},
  [RESPONSIVE_MODE.LARGE]: {width: 1, height: 1.06, icon: 1.08, font: 1.12},
  [RESPONSIVE_MODE.EXTRA_LARGE]: {
    width: 1,
    height: 1.08,
    icon: 1.1,
    font: 1.25, // 여기 핵심(초대)
  },
};

/**
 * 최대 스케일(상한)
 *
 * 중요:
 * - EXTRA_LARGE를 쓸 거면 font 상한이 1.2면 "실제론 1.2에서 잘려서"
 * 1.25가 반영되지 않을 수 있음.
 * - 그래서 최소 1.3 정도로 올려두는 게 안전.
 */
const MAX = {
  width: 1.18,
  height: 1.18,
  icon: 1.25,
  font: 1.35, // 기존 1.2 → 1.35 권장
};

const modeScale = () => {
  const m = MODE_SCALE[currentMode] || MODE_SCALE[RESPONSIVE_MODE.NORMAL];
  return {
    width: m.width * ANDROID_BONUS.width,
    height: m.height * ANDROID_BONUS.height,
    icon: m.icon * ANDROID_BONUS.icon,
    font: m.font * ANDROID_BONUS.font,
  };
};

/* ---------- API ---------- */

export const getResponsiveWidth = (v, maxScale = MAX.width) => {
  const m = modeScale();
  const size = BASE_WIDTH_RATIO * v * m.width;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveHeight = (v, maxScale = MAX.height) => {
  const m = modeScale();
  const size = BASE_HEIGHT_RATIO * v * m.height;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveIconSize = (v, maxScale = MAX.icon) => {
  const m = modeScale();
  const size = BASE_MIN_RATIO * v * m.icon;
  return clamp(size, v, v * maxScale);
};

/**
 * 여기 핵심
 * - PixelRatio.getFontScale() 완전 무시
 * - Dimensions 변화 완전 무시(초기값만 사용)
 * - 오직 초기 비율 + 앱 모드만 반영
 */
export const getResponsiveFontSize = (v, options = {}) => {
  const {maxScale = MAX.font} = options;
  const m = modeScale();
  const size = BASE_FONT_RATIO * v * m.font;
  return clamp(size, v, v * maxScale);
};

export default {
  RESPONSIVE_MODE,
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  setResponsiveMode,
  getResponsiveMode,
};
