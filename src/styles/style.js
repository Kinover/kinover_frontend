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
  /** 브랜드 노랑 배경(CTA, 칩 선택 등) 위 라벨 — 라이트/다크 동일 */
  textOnBrandPrimary: '#111827',

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

  textStrong: '#111827',
  error: '#DC2626',
  disabled: '#D1D5DB',
};

export const DARK_COLORS = {
  brandPrimary: '#FFC84D',
  brandPrimaryStrong: '#F59E0B',
  brandPrimarySoft: '#422006',
  textOnBrandPrimary: '#111827',

  textPrimary: '#F9FAFB',
  textDefault: '#E5E7EB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textInverse: '#111827',

  iconPrimary: '#F9FAFB',
  iconSecondary: '#9CA3AF',

  surfacePrimary: '#1F2937',
  surfaceSecondary: '#111827',
  surfaceMuted: '#374151',
  surfaceDisabled: '#374151',

  borderSubtle: '#374151',
  borderStrong: '#E5E7EB',

  shadowBase: '#000000',

  textStrong: '#F9FAFB',
  error: '#EF4444',
  disabled: '#4B5563',
};

/** 탭 화면 공통 서피스 카드 (홈 메인 카드와 동일 톤) */
export const TAB_SURFACE_CARD_RADIUS = () => getResponsiveIconSize(22);

export const TAB_CARD_DROP_SHADOW = {
  shadowColor: COLORS.shadowBase,
  shadowOffset: {width: 0, height: 1},
  shadowOpacity: 0.04,
  shadowRadius: 3,
  elevation: 1,
};

export const getBackgroundColors = (palette = COLORS) => ({
  primaryBg: palette.brandPrimary,
  secondaryBg: palette.surfaceSecondary,
  surfaceBg: palette.surfaceSecondary,
  overlayBg:
    Platform.OS === 'android' ? 'rgba(17,24,39,0.55)' : 'rgba(17,24,39,0.45)',
});

export const getButtonStyles = (palette = COLORS) => ({
  saveBg: palette.brandPrimary,
  saveLabelColor: palette.textOnBrandPrimary,
  cancelBg: palette.surfacePrimary,
  fontSize: getResponsiveFontSize(14),
  fontFamily: FONTS.MEDIUM,
  border_radius: getResponsiveIconSize(14),
});

export const getHeaderStyles = (palette = COLORS) => ({
  mainTitleFontSize: getResponsiveFontSize(23),
  mainTitleFontColor: palette.textPrimary,
  mainTitleFontFamily: FONTS.SEMI_BOLD,
  mainTitleFontWeight: Platform.OS === 'android' ? '700' : undefined,
  mainTitleLineHeight: getResponsiveFontSize(27),
  mainTitleLetterSpacing: -1.0,

  defaultTitleFontSize: getResponsiveFontSize(20),
  defaultTitleFontColor: palette.textDefault,
  defaultTitleFontFamily: FONTS.MEDIUM,
  defaultTitleLetterSpacing: -0.5,

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

export const getSettingStyles = (palette = COLORS) => ({
  titleFontSize: getResponsiveFontSize(21),
  titleFontColor: palette.textPrimary,
  titleFontFamily: FONTS.BOLD,
  titleFontWeight: '700',

  labelFontSize: getResponsiveFontSize(16),
  labelFontColor: palette.textDefault,
  labelFontFamily: FONTS.MEDIUM,
});

export const getChatRoomStyle = () => ({
  messageFontFamily:
    Platform.OS === 'android' ? FONTS.REGULAR : FONTS.LIGHT,
  messageFontSize: getResponsiveFontSize(13.5),
  messageTimeFontSize: getResponsiveFontSize(10.5),
  KinoMessageFontSize: getResponsiveFontSize(13.5),
});

export const getEmptyStyle = (palette = COLORS) => ({
  emptyFontSize: getResponsiveFontSize(12),
  emptyFontFamily: FONTS.REGULAR,
  emptyColor: palette.textTertiary,
});

export const getBottomSheetStyle = (palette = COLORS) => ({
  ...getBottomSheetTypography(),
  inactive: {
    color: palette.surfaceDisabled,
  },
});

export const getDefaultStyle = (palette = COLORS) => ({
  sectionTitle: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: FONTS.SEMI_BOLD,
    color: palette.textPrimary,
    letterSpacing: -0.8,
  },
  sectionSubtitle: {
    marginTop: getResponsiveHeight(3),
    fontSize: getResponsiveFontSize(12),
    fontFamily: FONTS.REGULAR,
    color: palette.textSecondary,
    letterSpacing: -0.2,
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
