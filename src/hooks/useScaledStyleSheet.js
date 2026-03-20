import {useMemo, useRef} from 'react';
import {StyleSheet} from 'react-native';
import {getResponsiveFontSize} from 'utils/responsive';
import {useReduxFontMode} from 'hooks/useReduxFontMode';

/**
 * Redux `fontMode`가 바뀔 때마다 StyleSheet를 다시 만듭니다.
 * 파일 최상단 `StyleSheet.create({ fontSize: getResponsiveFontSize(14) })`는
 * 첫 로드 시 숫자만 박혀 이후 글씨 크기 설정과 무관해지는 문제를 피합니다.
 *
 * factory는 ref로 최신을 참조하므로 인라인 함수를 넘겨도 됩니다.
 * factory가 props 등을 캡처하면 `deps`에 해당 값을 넣어 스타일이 갱신되게 하세요.
 *
 * @param {(rf: typeof getResponsiveFontSize) => import('react-native').StyleSheet.NamedStyles<any>} factory
 * @param {any[]} [deps]
 * @returns ReturnType<typeof StyleSheet.create>
 *
 * @example
 * const styles = useScaledStyleSheet(rf => ({
 *   title: { fontSize: rf(21) },
 *   body: { fontSize: rf(14) },
 * }));
 */
export function useScaledStyleSheet(factory, deps = []) {
  const fontMode = useReduxFontMode();
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  return useMemo(() => {
    return StyleSheet.create(factoryRef.current(getResponsiveFontSize));
  }, [fontMode, ...deps]);
}
