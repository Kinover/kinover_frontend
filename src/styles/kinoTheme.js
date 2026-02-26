// styles/kinoTheme.js
// 시스템 테마 감지는 hooks/useAppTheme.js 사용

export const KINO_THEME = {
  YELLOW_KINO: {
    bubbleMineBg: '#FFE7C4',
    bubbleMineText: '#1F2937',

    bubbleOtherBg: '#FFFFFF',
    bubbleOtherText: '#111827',
    bubbleOtherBorder: 'rgba(244,226,208,0.9)',

    systemText: '#B45309',

    inputBorder: 'rgba(244,226,208,0.95)',
    sendBtnBg: '#F59E0B',
    sendBtnIcon: '#FFFFFF',

    circleSoft: '#FFF3DE',
    circleStrong: '#FFE7C4',
  },

  BLUE_KINO: {
    bubbleMineBg: '#D7E9FF',
    bubbleMineText: '#0F172A',

    bubbleOtherBg: '#FFFFFF',
    bubbleOtherText: '#111827',
    bubbleOtherBorder: 'rgba(205,228,255,0.95)',

    systemText: '#2563EB',

    inputBorder: 'rgba(205,228,255,0.95)',
    sendBtnBg: '#3B82F6',
    sendBtnIcon: '#FFFFFF',

    circleSoft: '#EAF4FF',
    circleStrong: '#D7E9FF',
  },

  PINK_KINO: {
    bubbleMineBg: '#FFD6E5',
    bubbleMineText: '#111827',

    bubbleOtherBg: '#FFFFFF',
    bubbleOtherText: '#111827',
    bubbleOtherBorder: 'rgba(255,214,229,0.95)',

    systemText: '#DB2777',

    inputBorder: 'rgba(255,214,229,0.95)',
    sendBtnBg: '#EC4899',
    sendBtnIcon: '#FFFFFF',

    circleSoft: '#FFEAF2',
    circleStrong: '#FFD6E5',
  },
};

export const getKinoThemeByType = (kinoType) => {
  if (kinoType === 'BLUE_KINO') return KINO_THEME.BLUE_KINO;
  if (kinoType === 'PINK_KINO') return KINO_THEME.PINK_KINO;
  return KINO_THEME.YELLOW_KINO; // 기본
};

/** 시스템 다크모드 확장 시 사용할 테마 키 (useAppTheme().isDark 와 함께 사용) */
export const SYSTEM_THEME_KEYS = { light: 'light', dark: 'dark' };
