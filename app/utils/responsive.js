import { Dimensions } from 'react-native';

// 현재 디바이스의 너비와 높이
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 피그마 기준 너비와 높이
const figmaWidth = 393;  // 피그마에서의 기준 너비 (예: 375px)
const figmaHeight = 852; // 피그마에서의 기준 높이 (예: 667px)

// 너비 계산 함수
export const getResponsiveWidth = (figmaComponentWidth) => {
  // 피그마 기준 너비와 현재 디바이스의 너비 비율을 계산하여 현재 디바이스의 너비로 변환
  return (screenWidth / figmaWidth) * figmaComponentWidth;
};

// 높이 계산 함수
export const getResponsiveHeight = (figmaComponentHeight) => {
  // 피그마 기준 높이와 현재 디바이스의 높이 비율을 계산하여 현재 디바이스의 높이로 변환
  return (screenHeight / figmaHeight) * figmaComponentHeight;
};

// 아이콘 크기 계산 함수
export const getResponsiveIconSize = (figmaIconSize) => {
    // 피그마 기준 크기와 화면 크기의 비율을 계산하여 아이콘 크기 변환
    const widthRatio = screenWidth / figmaWidth;
    const heightRatio = screenHeight / figmaHeight;
    
    // 화면 크기 비율을 아이콘 크기에도 적용
    return Math.min(widthRatio, heightRatio) * figmaIconSize;
  };
  
  // 폰트 크기 계산 함수
  export const getResponsiveFontSize = (figmaFontSize) => {
    // 피그마 기준 크기와 화면 크기의 비율을 계산하여 폰트 크기 변환
    const widthRatio = screenWidth / figmaWidth;
    const heightRatio = screenHeight / figmaHeight;
    
    // 화면 크기 비율을 폰트 크기에도 적용
    return Math.min(widthRatio, heightRatio) * figmaFontSize;
  };


  export default getResponsiveFontSize