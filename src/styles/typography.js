import {Platform} from 'react-native';

export const FONTS = {
  LIGHT: 'Pretendard-Light',
  REGULAR: 'Pretendard-Regular',
  MEDIUM: 'Pretendard-Medium',
  SEMI_BOLD: 'Pretendard-SemiBold',
  BOLD: 'Pretendard-Bold',
  /** 나눔손글씨펜(나눔펜스크립트) */
  // RN은 파일명이 아니라 "폰트 내부 이름"으로 매칭됨.
  // NanumPenScript-Regular.ttf 의 PostScript name(nameID 6) = "NanumPen"
  HANDWRITING: Platform.select({
    ios: 'NanumPen',
    // Android는 보통 assets/fonts 아래 "파일명(확장자 제외)"로 매칭되는 경우가 많음
    android: 'NanumPenScript-Regular',
    default: 'NanumPenScript-Regular',
  }),
};
