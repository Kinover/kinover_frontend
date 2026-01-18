import {Platform} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

export const COLORS = {
  /* ================= 브랜드 ================= */
  brandPrimary: '#FFC84D', // 키노버 노랑
  brandPrimaryStrong: '#F59E0B',
  brandPrimarySoft: '#FEF3C7',

  /* ================= 텍스트 ================= */
  // textPrimary: '#111827',
  textPrimary: 'black',

  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF', //👉 힌트·보조·비활성 느낌 텍스트
  textInverse: '#FFFFFF', //👉 어두운 배경 위에 올라가는 글자 색
};

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
  saveBg: 'black',
  // saveBg: '#111827',

  // saveBg: '#23314F',
  // saveBg: '#1F2B45',
  cancelBg: ' #FFFFFF',
  fontSize: getResponsiveFontSize(14),
  fontFamily: 'Pretendard-Medium',
};

export const HEADER_STYLES = {
  mainTitleFontSize: getResponsiveFontSize(23),
  mainTitleFontColor: 'black',
  mainTitleFontFamily: 'Pretendard-SemiBold',
  mainTitleFontWeight: Platform.OS === 'android' ? '700' : undefined,
  mainTitleLineHeight: getResponsiveFontSize(27), // 살짝만

  defaultTitleFontSize: getResponsiveFontSize(19),
  defaultTitleFontColor: '#333',
  defaultTitleFontFamily: 'Pretendard-Regular',

  headerLeftIconWidth: getResponsiveIconSize(26),
  headerLeftIconHeight: getResponsiveIconSize(26),
  headerLeftIconLeftPadding: getResponsiveWidth(14),

  headerRightIconWidth: getResponsiveIconSize(25),
  headerRightIconHeight: getResponsiveIconSize(25),
  headerRightIconRightPadding: getResponsiveWidth(14),
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
  messageFontSize: getResponsiveFontSize(13), // 🔽 15 → 14
  messageTimeFontSize: getResponsiveFontSize(10), // 🔽 10 → 9
  KinoMessageFontSize: getResponsiveFontSize(13),
};

export const EMPTY_STYLE = {
  emptyFontSize: getResponsiveFontSize(12),
  emptyFontFamily: 'Pretendard-Regular',
  emptyColor: COLORS.textTertiary,
};

export const BOTTOMSHEET_STYLE = {
  title: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: COLORS.textSecondary,
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
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    marginTop: getResponsiveHeight(3),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: COLORS.textSecondary,
  },
};

export const LAYOUT_STYLE = {
  screenPaddingHorizontal: getResponsiveWidth(14),
};
