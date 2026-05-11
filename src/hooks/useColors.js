import {useSelector} from 'react-redux';
import {
  COLORS,
  DARK_COLORS,
  BACKGROUND_COLORS,
  BUTTON_STYLES,
  HEADER_STYLES,
  SETTING_STYLES,
  CHATROOM_STYLE,
  EMPTY_STYLE,
  BOTTOMSHEET_STYLE,
  DEFAULT_STYLE,
  LAYOUT_STYLE,
} from 'styles/style';

export function useColors() {
  const isDark = useSelector(state => !!state.ui?.isDarkMode);
  return isDark ? DARK_COLORS : COLORS;
}

export function useIsDark() {
  return useSelector(state => !!state.ui?.isDarkMode);
}

/**
 * 스타일/토큰을 다크모드에 맞춰 한 번에 제공.
 * - 기존 코드에서 `useThemeStyleTokens()`로 `colors`, `BUTTON_STYLES` 등을 꺼내 쓰는 패턴을 유지.
 */
export function useThemeStyleTokens() {
  const colors = useColors();

  return {
    colors,
    // `styles/style.js`의 token.get은 "팔레트(colors)를 인자로 받는 getter" 자체임.
    // 함수(=>colors)를 넘기면 토큰 계산이 깨질 수 있어 반드시 팔레트를 직접 전달한다.
    BACKGROUND_COLORS: BACKGROUND_COLORS.get(colors),
    BUTTON_STYLES: BUTTON_STYLES.get(colors),
    HEADER_STYLES: HEADER_STYLES.get(colors),
    SETTING_STYLES: SETTING_STYLES.get(colors),
    CHATROOM_STYLE: CHATROOM_STYLE.get(colors),
    EMPTY_STYLE: EMPTY_STYLE.get(colors),
    BOTTOMSHEET_STYLE: BOTTOMSHEET_STYLE.get(colors),
    DEFAULT_STYLE: DEFAULT_STYLE.get(colors),
    LAYOUT_STYLE: LAYOUT_STYLE.get(colors),
  };
}
