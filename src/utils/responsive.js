import {Dimensions, PixelRatio} from 'react-native';

// 현재 디바이스 크기
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

// 피그마 기준
const figmaWidth = 393;
const figmaHeight = 852;

// 공통 비율
const widthRatio = screenWidth / figmaWidth;
const heightRatio = screenHeight / figmaHeight;
const minRatio = Math.min(widthRatio, heightRatio);

/**
 * 너비 (최소값 = 피그마 값)
 */
export const getResponsiveWidth = figmaWidthValue => {
  const responsive = widthRatio * figmaWidthValue;
  return Math.max(responsive, figmaWidthValue);
};

/**
 * 높이 (최소값 = 피그마 값)
 */
export const getResponsiveHeight = figmaHeightValue => {
  const responsive = heightRatio * figmaHeightValue;
  return Math.max(responsive, figmaHeightValue);
};

/**
 * 아이콘 사이즈 (비율 + 최소값 보장)
 */
export const getResponsiveIconSize = figmaIconSize => {
  const responsive = minRatio * figmaIconSize;
  return Math.max(responsive, figmaIconSize);
};

/**
 * 폰트 사이즈
 * - responsive 적용
 * - 접근성 폰트 스케일 반영
 * - 최소값은 피그마 값
 */
export const getResponsiveFontSize = figmaFontSize => {
  const baseSize = minRatio * figmaFontSize;
  const scaledSize = baseSize * PixelRatio.getFontScale();
  return Math.max(scaledSize, figmaFontSize);
};

export default {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
};
