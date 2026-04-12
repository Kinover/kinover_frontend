/**
 * 일정 편집(ScheduleEditorBottomSheet) · 프로필 편집(UserBottomSheet) 공통
 * — 간격(FLOW), 컬러, 섹션 라벨, 푸터, 언더라인/박스 입력 토큰 통일
 */
import {Platform, StyleSheet} from 'react-native';
import {BOTTOMSHEET_STYLE} from 'styles/style';

export const BOTTOM_SHEET_EDITOR_FLOW = 18;

export const BOTTOM_SHEET_EDITOR_COLORS = {
  bg: '#FFFFFF',
  text: '#0B1220',
  /** 메인 CTA·칩 선택 등 — BottomSheetButtons와 동일한 검정 톤 */
  navy: '#000000',
  primary: '#000000',
  sub: '#566073',
  muted: '#98A2B3',
  caption: '#8E8E93',
  segmentTrack: '#E5E5EA',
  chipBorder: '#C7C7CC',
  line: 'rgba(15, 23, 42, 0.08)',
  brand: '#FFC84D',
  brandDeep: '#FFB020',
  danger: '#EF4444',
  pill: '#000000',
  pillText: '#FFFFFF',
};

export function getBottomSheetEditorBottomSafe(insetsBottom, getResponsiveHeight) {
  return Math.max(Number(insetsBottom || 0), getResponsiveHeight(24));
}

/**
 * BottomSheetButtons 기본과 동일한 메인 버튼 터치 영역·모서리
 * @param {typeof import('utils/responsive').getResponsiveHeight} rh
 * @param {typeof import('utils/responsive').getResponsiveIconSize} ri
 */
export function getBottomSheetPrimarySaveButtonStyle(rh, ri) {
  return {
    backgroundColor: BOTTOM_SHEET_EDITOR_COLORS.primary,
    minHeight: rh(46),
    borderRadius: ri(14),
    paddingVertical: rh(14),
  };
}

/**
 * @param {typeof import('utils/responsive').getResponsiveFontSize} rf
 * @param {typeof import('utils/responsive').getResponsiveHeight} rh
 * @param {typeof import('utils/responsive').getResponsiveWidth} rw
 */
export function getBottomSheetEditorSharedStyles(rf, rh, rw) {
  const C = BOTTOM_SHEET_EDITOR_COLORS;

  return {
    content: {
      paddingTop: rh(6),
      paddingBottom: rh(6),
      width: '100%',
      alignSelf: 'stretch',
    },

    sectionLabel: {
      alignSelf: 'flex-start',
      ...BOTTOMSHEET_STYLE().sectionLabel,
    },

    fieldBlock: {
      alignSelf: 'stretch',
      width: '100%',
      marginBottom: rh(BOTTOM_SHEET_EDITOR_FLOW),
    },

    /** 상단 폼과 푸터 사이 간격 */
    footerFlow: {
      alignSelf: 'stretch',
      width: '100%',
      paddingTop: rh(20),
      paddingBottom: rh(2),
    },

    /** 일정 제목 · 프로필 별명 · 채팅방명 — 단일 입력 공통 외곽 */
    singleLineUnderlineWrap: {
      alignSelf: 'stretch',
      borderWidth: 1,
      borderColor: '#DADADA',
      borderRadius: rw(12),
      backgroundColor: '#F5F5F5',
      paddingHorizontal: rw(12),
      paddingVertical: rh(5),
      marginTop: rh(4),
    },
    singleLineUnderlineWrapFocused: {
      borderColor: '#FFC84D',
    },

    /** 멀티라인 필드 박스 (프로필 한 줄 소개 등) */
    fieldBoxWrap: {
      alignSelf: 'stretch',
      backgroundColor: 'rgba(120, 120, 128, 0.08)',
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(60, 60, 67, 0.12)',
      paddingHorizontal: rw(12),
      paddingTop: rh(6),
      paddingBottom: rh(6),
    },

    /** 일정 제목 입력 (멀티라인, 언더라인) */
    scheduleTitleInput: {
      minHeight: rh(36),
      maxHeight: rh(96),
      paddingHorizontal: 0,
      paddingTop: Platform.OS === 'android' ? 2 : 4,
      paddingBottom: 2,
      borderWidth: 0,
      backgroundColor: 'transparent',
      includeFontPadding: false,
      fontSize: rf(15),
      fontFamily: 'Pretendard-Regular',
      color: C.text,
      lineHeight: rf(22),
      letterSpacing: -0.18,
      textAlign: 'left',
      textAlignVertical: 'top',
    },

    /** 프로필 별명 */
    profileNicknameInput: {
      minHeight: rh(30),
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
      includeFontPadding: false,
      fontSize: rf(15),
      fontFamily: 'Pretendard-Regular',
      color: C.text,
      lineHeight: rf(20),
      letterSpacing: -0.18,
      textAlignVertical: 'center',
    },

    /** 프로필 한 줄 소개 (2줄 고정 + 내부 스크롤) */
    profileTraitInput: {
      height: rf(20) * 2 + rh(8),
      paddingHorizontal: 0,
      paddingTop: Platform.OS === 'ios' ? 2 : 0,
      paddingBottom: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
      includeFontPadding: false,
      fontSize: rf(14),
      fontFamily: 'Pretendard-Medium',
      color: C.text,
      lineHeight: rf(20),
      letterSpacing: -0.18,
      textAlignVertical: 'top',
    },
  };
}
