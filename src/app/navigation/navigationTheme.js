import {DefaultTheme} from '@react-navigation/native';
import {COLORS} from 'styles/style';

/** 네비게이션 기본 배경이 비어 일부 기기에서 검은 화면처럼 보이는 것 방지 */
export const kinoverNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.surfacePrimary,
    card: COLORS.surfacePrimary,
  },
};

export const stackCardScreenOption = {
  cardStyle: {backgroundColor: COLORS.surfacePrimary},
};
