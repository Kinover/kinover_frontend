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
  }
};

const ANDROID_BONUS =
  Platform.OS === 'android'
    ? {width: 1.0, height: 1.02, icon: 1.02, font: 1.03}
    : {width: 1.0, height: 1.0, icon: 1.0, font: 1.0};

const MAX = {
  width: 1.18,
  height: 1.18,
  icon: 1.25,
  font: 1.6,
};

export const getResponsiveWidth = (v, maxScale = MAX.width) => {
  bump('width');
  const {widthRatio} = cachedRatios;
  const size = widthRatio * v * ANDROID_BONUS.width;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveHeight = (v, maxScale = MAX.height) => {
  bump('height');
  const {heightRatio} = cachedRatios;
  const size = heightRatio * v * ANDROID_BONUS.height;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveIconSize = (v, maxScale = MAX.icon) => {
  bump('icon');
  const {minRatio} = cachedRatios;
  const size = minRatio * v * ANDROID_BONUS.icon;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveFontSize = (v, options = {}) => {
  bump('font');
  const {
    maxScale = MAX.font,
    applySystemFontScale = true,
    systemFontScaleMax = 2.0,
  } = options;
  const {widthRatio} = cachedRatios;
  const baseRatio = getBaseFontRatio(widthRatio);
  const systemScale = applySystemFontScale
    ? clamp(PixelRatio.getFontScale() || 1, 1, systemFontScaleMax)
    : 1;
  const size = baseRatio * v * ANDROID_BONUS.font * systemScale;
  return clamp(size, v, v * maxScale);
};

export const getResponsiveFontSizeIgnoreAppMode = getResponsiveFontSize;
export const getResponsiveWidthIgnoreAppMode = getResponsiveWidth;
export const getResponsiveHeightIgnoreAppMode = getResponsiveHeight;
export const getResponsiveIconSizeIgnoreAppMode = getResponsiveIconSize;

export default {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  getResponsiveFontSizeIgnoreAppMode,
  getResponsiveWidthIgnoreAppMode,
  getResponsiveHeightIgnoreAppMode,
  getResponsiveIconSizeIgnoreAppMode,
};
