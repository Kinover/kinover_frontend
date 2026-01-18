// utils/responsive.js
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
 * ✅ Clamp 유틸
 */
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/**
 * ✅ 최대 스케일 정책 (프로젝트 기본값)
 * - 너무 보수적이면 답답하고, 너무 높으면 폭주가 남
 * - 아래 값은 “대부분의 안드로이드/아이폰에서 자연스럽고 안전”한 쪽
 */
const MAX_SCALE = {
  width: 1.18, // 가로 레이아웃은 18%까지만 키움
  height: 1.18, // 세로 레이아웃도 동일
  icon: 1.25, // 아이콘/아바타는 조금 더 여유 줌(시각적 요소라)
  font: 1.20, // 폰트 자체 스케일의 상한(최종 결과 기준)
  fontScale: 1.15, // 접근성 폰트 스케일(PixelRatio)의 상한
};

/**
 * 너비
 * - 최소값 = 피그마 값
 * - 최대값 = 피그마 * maxScale
 */
export const getResponsiveWidth = (figmaWidthValue, maxScale = MAX_SCALE.width) => {
  const responsive = widthRatio * figmaWidthValue;

  const minValue = figmaWidthValue; // ✅ 피그마보다 작아지지 않게
  const maxValue = figmaWidthValue * maxScale; // ✅ 폭주 방지

  return clamp(responsive, minValue, maxValue);
};

/**
 * 높이
 * - 최소값 = 피그마 값
 * - 최대값 = 피그마 * maxScale
 */
export const getResponsiveHeight = (figmaHeightValue, maxScale = MAX_SCALE.height) => {
  const responsive = heightRatio * figmaHeightValue;

  const minValue = figmaHeightValue;
  const maxValue = figmaHeightValue * maxScale;

  return clamp(responsive, minValue, maxValue);
};

/**
 * 아이콘 사이즈
 * - 비율(minRatio) 기반
 * - 최소값 = 피그마 값
 * - 최대값 = 피그마 * maxScale
 */
export const getResponsiveIconSize = (figmaIconSize, maxScale = MAX_SCALE.icon) => {
  const responsive = minRatio * figmaIconSize;

  const minValue = figmaIconSize;
  const maxValue = figmaIconSize * maxScale;

  return clamp(responsive, minValue, maxValue);
};

/**
 * 폰트 사이즈
 * - responsive 적용 (minRatio)
 * - 접근성 폰트 스케일 반영
 * - 최소값 = 피그마 값
 * - ✅ 상한 적용(최종 폰트 폭주 방지)
 */
export const getResponsiveFontSize = (figmaFontSize, options = {}) => {
  const {
    maxScale = MAX_SCALE.font, // 최종 폰트의 상한(피그마 대비)
    maxFontScale = MAX_SCALE.fontScale, // PixelRatio.getFontScale() 상한
  } = options;

  // 1) 비율 기반 기본 사이즈
  const baseSize = minRatio * figmaFontSize;

  // 2) 접근성 폰트 스케일(너무 크면 레이아웃 깨져서 상한 캡)
  const deviceFontScale = PixelRatio.getFontScale();
  const safeFontScale = clamp(deviceFontScale, 1, maxFontScale);

  // 3) 최종 스케일 적용
  const scaledSize = baseSize * safeFontScale;

  // 4) 최소/최대 보정
  const minValue = figmaFontSize; // 피그마보다 작아지지 않게
  const maxValue = figmaFontSize * maxScale; // 피그마 대비 최대 배수

  return clamp(scaledSize, minValue, maxValue);
};

export default {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
};
