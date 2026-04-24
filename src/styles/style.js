// styles/style.js
import {Platform} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';
import {getBottomSheetTypography} from 'styles/bottomSheetTypography';
import {FONTS} from 'styles/typography';

export const COLORS = {
  brandPrimary: '#FFC84D',
  brandPrimaryStrong: '#F59E0B',
  brandPrimarySoft: '#FEF3C7',

  textPrimary: 'black',
  textDefault: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  iconPrimary: '#111827',
  iconSecondary: '#525252',

  surfacePrimary: '#FFFFFF',
  surfaceSecondary: '#F9FAFB',
  surfaceMuted: '#F3F4F6',
  surfaceDisabled: '#F3F4F6',

  borderSubtle: '#E5E7EB',
  borderStrong: '#111827',

  shadowBase: '#000000',
};

export const getBackgroundColors = () => ({
  primaryBg: COLORS.brandPrimary,
  secondaryBg: '#F9F9F9',
  surfaceBg: COLORS.surfaceSecondary,
  overlayBg:
    Platform.OS === 'android' ? 'rgba(17,24,39,0.55)' : 'rgba(17,24,39,0.45)',
});

export const getButtonStyles = () => ({
  saveBg: COLORS.textPrimary,
  cancelBg: COLORS.surfacePrimary,
  fontSize: getResponsiveFontSize(14),
  fontFamily: FONTS.MEDIUM,
  border_radius: getResponsiveIconSize(14),
});

export const getHeaderStyles = () => ({
  mainTitleFontSize: getResponsiveFontSize(23),
  mainTitleFontColor: COLORS.textPrimary,
  mainTitleFontFamily: FONTS.SEMI_BOLD,
  mainTitleFontWeight: Platform.OS === 'android' ? '700' : undefined,
  mainTitleLineHeight: getResponsiveFontSize(27),

  defaultTitleFontSize: getResponsiveFontSize(20),
  defaultTitleFontColor: COLORS.textDefault,
  defaultTitleFontFamily: FONTS.MEDIUM,

  headerLeftIconWidth:
    Platform.OS === 'ios'
      ? getResponsiveIconSize(26)
      : getResponsiveIconSize(28),
  headerLeftIconHeight:
    Platform.OS === 'ios'
      ? getResponsiveIconSize(26)
      : getResponsiveIconSize(28),
  headerLeftIconLeftPadding: getResponsiveWidth(14),

  headerRightIconWidth:
    Platform.OS === 'ios'
      ? getResponsiveIconSize(25)
      : getResponsiveIconSize(27),
  headerRightIconHeight:
    Platform.OS === 'ios'
      ? getResponsiveIconSize(25)
      : getResponsiveIconSize(27),
  headerRightIconRightPadding: getResponsiveWidth(14),
});

export const getSettingStyles = () => ({
  titleFontSize: getResponsiveFontSize(21),
  titleFontColor: COLORS.textPrimary,
  titleFontFamily: FONTS.BOLD,
  titleFontWeight: '700',

  labelFontSize: getResponsiveFontSize(16),
  labelFontColor: COLORS.textDefault,
  labelFontFamily: FONTS.MEDIUM,
});

export const getChatRoomStyle = () => ({
  messageFontFamily:
    Platform.OS === 'android' ? FONTS.REGULAR : FONTS.LIGHT,
  messageFontSize: getResponsiveFontSize(13.5),
  messageTimeFontSize: getResponsiveFontSize(10.5),
  KinoMessageFontSize: getResponsiveFontSize(13.5),
});

export const getEmptyStyle = () => ({
  emptyFontSize: getResponsiveFontSize(12),
  emptyFontFamily: FONTS.REGULAR,
  emptyColor: COLORS.textTertiary,
});

export const getBottomSheetStyle = () => ({
  ...getBottomSheetTypography(),
  inactive: {
    // color: ' #F6F7FB',
    color: COLORS.surfaceDisabled,
  },
});

export const getDefaultStyle = () => ({
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    marginTop: getResponsiveHeight(3),
    fontSize: getResponsiveFontSize(12),
    fontFamily: FONTS.REGULAR,
    color: COLORS.textSecondary,
  },
});

export const getLayoutStyle = () => ({
  screenPaddingHorizontal: getResponsiveWidth(14),
});

/**
 * "진짜 호환" 유틸
 * - token() 호출도 되고
 * - token.xxx 접근도 되게(기존 코드 안 깨짐)
 */
const makeToken = getter => {
  const fn = () => getter();
  const value = getter();

  Object.assign(fn, value);

  fn.get = getter;

  return fn;
};

export const BACKGROUND_COLORS = makeToken(getBackgroundColors);
export const BUTTON_STYLES = makeToken(getButtonStyles);
export const HEADER_STYLES = makeToken(getHeaderStyles);
export const SETTING_STYLES = makeToken(getSettingStyles);
export const CHATROOM_STYLE = makeToken(getChatRoomStyle);
export const EMPTY_STYLE = makeToken(getEmptyStyle);
export const BOTTOMSHEET_STYLE = makeToken(getBottomSheetStyle);
export const DEFAULT_STYLE = makeToken(getDefaultStyle);
export const DEFAULT_STYLES = makeToken(getDefaultStyle);
export const LAYOUT_STYLE = makeToken(getLayoutStyle);
