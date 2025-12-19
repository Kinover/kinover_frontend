// styles/kinoTheme.ts

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

    // (선택) 배경 원도 같이 쓰고 싶으면
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
