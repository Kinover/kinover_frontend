/**
 * 기기 시스템 테마(다크모드/라이트모드) 감지
 * kinoTheme.js와 함께 사용해 시스템 설정에 따른 테마 적용 가능
 */
import {useState, useEffect} from 'react';
import {Appearance} from 'react-native';

export function useAppTheme() {
  const [colorScheme, setColorScheme] = useState(
    () => Appearance.getColorScheme() ?? 'light',
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(prefs => {
      setColorScheme(prefs.colorScheme ?? 'light');
    });
    return () => sub.remove();
  }, []);

  return {
    colorScheme,
    isDark: colorScheme === 'dark',
  };
}
