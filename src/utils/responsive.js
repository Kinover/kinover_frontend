// utils/responsive.js
import {Dimensions, PixelRatio, Platform} from 'react-native';

const FIGMA = {w: 393, h: 852};
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

let cachedRatios = (() => {
  const window = Dimensions.get('window');
  const widthRatio = window.width / FIGMA.w;
  const heightRatio = window.height / FIGMA.h;
  const minRatio = Math.min(widthRatio, heightRatio);
  return {widthRatio, heightRatio, minRatio};
})();

const refreshCachedRatios = () => {
  const window = Dimensions.get('window');
  const widthRatio = window.width / FIGMA.w;
  const heightRatio = window.height / FIGMA.h;
  const minRatio = Math.min(widthRatio, heightRatio);
  cachedRatios = {widthRatio, heightRatio, minRatio};
};

// RN 버전별로 addEventListener/removeEventListener 시그니처가 달라질 수 있어 방어적으로 처리
try {
  const sub = Dimensions.addEventListener?.('change', refreshCachedRatios);
  // remove는 RN 버전에 따라 존재
  if (sub?.remove == null && Dimensions.removeEventListener) {
    Dimensions.removeEventListener('change', refreshCachedRatios);
  }
} catch {
  // ignore
}

const getBaseFontRatio = widthRatio => clamp(widthRatio, 0.92, 1.06);

// dev에서 핫패스가 얼마나 호출되는지 간단히 계측할 수 있게끔 제공
const DEV_RESPONSIVE_STATS = typeof __DEV__ !== 'undefined' && __DEV__;
const responsiveStats = {
  width: 0,
  height: 0,
  icon: 0,
  font: 0,
  lastLogAt: 0,
  lastTotal: 0,
};

const bump = key => {
  if (!DEV_RESPONSIVE_STATS) return;
  responsiveStats[key] += 1;
  const total =
    responsiveStats.width +
    responsiveStats.height +
    responsiveStats.icon +
    responsiveStats.font;
  const now = Date.now();
  if (total - responsiveStats.lastTotal >= 3000 && now - responsiveStats.lastLogAt > 15000) {
    responsiveStats.lastTotal = total;
    responsiveStats.lastLogAt = now;
    // 콘솔로만 측정(프로덕션 영향 최소)
    // eslint-disable-next-line no-console
      width: responsiveStats.width,
      height: responsiveStats.height,
      icon: responsiveStats.icon,
      font: responsiveStats.font,
      mode: String(
        (typeof getResponsiveMode === 'function' && getResponsiveMode()) || '',
      ),
    });
  }
};

export const RESPONSIVE_MODE = {
  NORMAL: 'NORMAL',
  LARGE: 'LARGE',
  EXTRA_LARGE: 'EXTRA_LARGE',
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

const ANDROID_BONUS =
  Platform.OS === 'android'
    ? {width: 1.0, height: 1.02, icon: 1.02, font: 1.03}
    : {width: 1.0, height: 1.0, icon: 1.0, font: 1.0};

const MODE_SCALE = {
  // 일반 사용자 기준값
  [RESPONSIVE_MODE.NORMAL]: {width: 1, height: 1, icon: 1, font: 1},
  // 좀 더 크게 — 체감상 확실히 다르되 레이아웃이 무너지지 않는 수준
  [RESPONSIVE_MODE.LARGE]: {width: 1, height: 1.1, icon: 1.12, font: 1.2},
  // 노인/시력 약한 사용자 전용 — 16px 기준 약 24px, 접근성 등급 수준
  [RESPONSIVE_MODE.EXTRA_LARGE]: {
    width: 1,
    height: 1.2,
    icon: 1.22,
    font: 1.5,
  },
};

const MAX = {
  width: 1.18,
  height: 1.28, // EXTRA_LARGE height 1.2 + Android 보너스 허용
  icon: 1.35,   // EXTRA_LARGE icon 1.22 + Android 보너스 허용
  font: 1.6,    // EXTRA_LARGE font 1.5 + Android 보너스(×1.03) = 1.545, 여유 포함
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

export const getResponsiveWidth = (v, maxScale = MAX.width) => {
  bump('width');
  const {widthRatio} = cachedRatios;
  const m = modeScale();
  const size = widthRatio * v * m.width;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveHeight = (v, maxScale = MAX.height) => {
  bump('height');
  const {heightRatio} = cachedRatios;
  const m = modeScale();
  const size = heightRatio * v * m.height;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveIconSize = (v, maxScale = MAX.icon) => {
  bump('icon');
  const {minRatio} = cachedRatios;
  const m = modeScale();
  const size = minRatio * v * m.icon;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveFontSize = (v, options = {}) => {
  bump('font');
  const {
    maxScale = MAX.font,
    applySystemFontScale = true,
    systemFontScaleMax = 1.3,
  } = options;
  const {widthRatio} = cachedRatios;
  const m = modeScale();
  const baseRatio = getBaseFontRatio(widthRatio);
  const systemScale = applySystemFontScale
    ? clamp(PixelRatio.getFontScale() || 1, 1, systemFontScaleMax)
    : 1;
  const size = baseRatio * v * m.font * systemScale;
  return clamp(size, v, v * maxScale);
};

/**
 * 설정 > 글씨 크기(NORMAL/LARGE/XL) 배율을 쓰지 않음.
 * 온보딩·회원가입 등 “가입 전” 화면 전용 (화면 너비·시스템 글꼴 스케일은 유지).
 */
export const getResponsiveFontSizeIgnoreAppMode = (v, options = {}) => {
  bump('font');
  const {
    maxScale = MAX.font,
    applySystemFontScale = true,
    systemFontScaleMax = 1.3,
  } = options;
  const {widthRatio} = cachedRatios;
  const baseM = MODE_SCALE[RESPONSIVE_MODE.NORMAL];
  const fontMult = baseM.font * ANDROID_BONUS.font;
  const baseRatio = getBaseFontRatio(widthRatio);
  const systemScale = applySystemFontScale
    ? clamp(PixelRatio.getFontScale() || 1, 1, systemFontScaleMax)
    : 1;
  const size = baseRatio * v * fontMult * systemScale;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveWidthIgnoreAppMode = (v, maxScale = MAX.width) => {
  bump('width');
  const {widthRatio} = cachedRatios;
  const baseM = MODE_SCALE[RESPONSIVE_MODE.NORMAL];
  const mult = baseM.width * ANDROID_BONUS.width;
  const size = widthRatio * v * mult;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveHeightIgnoreAppMode = (v, maxScale = MAX.height) => {
  bump('height');
  const {heightRatio} = cachedRatios;
  const baseM = MODE_SCALE[RESPONSIVE_MODE.NORMAL];
  const mult = baseM.height * ANDROID_BONUS.height;
  const size = heightRatio * v * mult;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveIconSizeIgnoreAppMode = (v, maxScale = MAX.icon) => {
  bump('icon');
  const {minRatio} = cachedRatios;
  const baseM = MODE_SCALE[RESPONSIVE_MODE.NORMAL];
  const mult = baseM.icon * ANDROID_BONUS.icon;
  const size = minRatio * v * mult;
  return clamp(size, v, v * maxScale);
};

export default {
  RESPONSIVE_MODE,
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  getResponsiveFontSizeIgnoreAppMode,
  getResponsiveWidthIgnoreAppMode,
  getResponsiveHeightIgnoreAppMode,
  getResponsiveIconSizeIgnoreAppMode,
  setResponsiveMode,
  getResponsiveMode,
};
