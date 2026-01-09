import {Platform} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

// src/styles/colors.ts
export const BACKGROUND_COLORS = {
  primaryBg: '#FFC84D',
  secondaryBg: '#F9F9F9',
  overlayBg:
    Platform.OS === 'android' ? 'rgba(17,24,39,0.55)' : 'rgba(17,24,39,0.45)',
  // overlayBg: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.22)',
};

export const BUTTON_STYLES = {
  // saveBg: '#FFC84D',
  saveBg: '#111827',
  // saveBg: '#23314F',
  // saveBg: '#1F2B45',
  cancelBg: ' #FFFFFF',
  fontSize: getResponsiveFontSize(14),
  fontFamily: 'Pretendard-Medium',
};

export const HEADER_STYLES = {
  mainTitleFontSize: getResponsiveFontSize(23),
  mainTitleFontColor: 'black',
  mainTitleFontFamily: 'Pretendard-Bold',
  mainTitleFontWeight: Platform.OS === 'android' ? '700' : undefined,
  mainTitleLineHeight: getResponsiveFontSize(27), // 살짝만

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

export const SETTING_STYLES = {
  titleFontSize: getResponsiveFontSize(21),
  titleFontColor: '#000',
  titleFontFamily: 'Pretendard-Bold',
  titleFontWeight: '700',

  labelFontSize: getResponsiveFontSize(16),
  labelFontColor: '#222',
  labelFontFamily: 'Pretendard-Medium',
};

export const CHATROOM_STYLE = {
  messageFontFamily:
    Platform.OS === 'android' ? 'Pretendard-Regular' : 'Pretendard-Light',
  messageFontSize: getResponsiveFontSize(14), // 🔽 15 → 14
  messageTimeFontSize: getResponsiveFontSize(11), // 🔽 10 → 9
  KinoMessageFontSize: getResponsiveFontSize(14),
};

export const EMPTY_STYLE = {
  emptyFontSize: getResponsiveFontSize(13),
  emptyFontFamily: 'Pretendard-Regular',
  emptyColor: '#9CA3AF',
};

export const BOTTOMSHEET_STYLE = {
  title: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  subtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
  sectionLabel: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: 'black',
    marginBottom: getResponsiveHeight(6),
    marginTop: getResponsiveHeight(10),
  },
};

export const DEFAULT_STYLE = {
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    marginTop: getResponsiveHeight(3),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
  
};
