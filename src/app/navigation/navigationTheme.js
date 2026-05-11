import {DefaultTheme} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {useMemo} from 'react';
import {COLORS, DARK_COLORS} from 'styles/style';

const makeNavTheme = colors => ({
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.surfaceSecondary,
    card: colors.surfacePrimary,
    text: colors.textDefault,
    border: colors.borderSubtle,
  },
});

/** 네비게이션 기본 배경이 비어 일부 기기에서 검은 화면처럼 보이는 것 방지 */
export const kinoverNavigationTheme = makeNavTheme(COLORS);
export const kinoverNavigationThemeDark = makeNavTheme(DARK_COLORS);

export function useNavigationTheme() {
  const isDark = useSelector(state => !!state.ui?.isDarkMode);
  return useMemo(() => makeNavTheme(isDark ? DARK_COLORS : COLORS), [isDark]);
}

/**
 * RootNavigator에서 colors를 주입해 스택 카드 배경을 테마에 맞춤.
 * (일부 기기에서 기본 배경이 비어 검게 보이는 현상 방지)
 */
export function getStackCardScreenOption(colors) {
  const resolved = colors || COLORS;
  return {
    cardStyle: {backgroundColor: resolved.surfacePrimary},
  };
}

// 기존 사용처 호환용(정적 옵션)
export const stackCardScreenOption = getStackCardScreenOption(COLORS);
