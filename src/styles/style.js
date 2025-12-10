import {Platform} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

// src/styles/colors.ts
export const BACKGROUND_COLORS = {
  primaryBg: '#FF3B30',
  secondaryBg: '#F9F9F9',
};

export const BUTTON_STYLES = {
  // saveBg: '#FFC84D',
  // saveBg: '#111827',
  saveBg: '#23314F',
  cancelBg: ' #FFFFFF',
  fontSize: getResponsiveFontSize(14),
  fontFamily: 'Pretendard-Medium',
};

export const HEADER_STYLES = {
  mainTitleFontSize: getResponsiveFontSize(20),
  mainTitleFontColor: 'black',
  mainTitleFontFamily: 'Pretendard-Bold',
  mainTitleFontWeight: Platform.OS === 'android' ? '700' : undefined,
  mainTitleLineHeight: getResponsiveHeight(22), // 살짝만

  defaultTitleFontSize: getResponsiveFontSize(19),
  defaultTitleFontColor: '#333',
  defaultTitleFontFamily: 'Pretendard-Regular',

  headerLeftIconWidth: getResponsiveIconSize(24),
  headerLeftIconHeight: getResponsiveIconSize(24),
  headerLeftIconLeftPadding: getResponsiveWidth(16),

  headerRightIconWidth: getResponsiveIconSize(23),
  headerRightIconHeight: getResponsiveIconSize(23),
  headerRightIconRightPadding: getResponsiveWidth(16),
};

export const CHATROOM_STYLE = {
  messageFontSize: getResponsiveFontSize(13), // 🔽 15 → 14

  messageTimeFontSize: getResponsiveFontSize(10), // 🔽 10 → 9

  KinoMessageFontSize: getResponsiveFontSize(13),
};

export const EMPTY_STYLE={
  emptyFontSize: getResponsiveFontSize(13),
  emptyFontFamily: 'Pretendard-Regular',
  emptyColor: '#9CA3AF',
}
