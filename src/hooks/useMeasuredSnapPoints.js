// src/hooks/useMeasuredSnapPoints.js
import {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getResponsiveHeight} from 'utils/responsive';
import {makeSnapWithFooterPx} from 'utils/makeSnapWithFooterPx';

/**
 * @typedef {Object} UseMeasuredSnapPointsOptions
 * @property {number} windowH
 * @property {string|number=} fontModeKey
 * @property {any[]=} extraResetKeys
 * @property {(string|number)[]=} externalSnapPoints
 * @property {[string,string]=} fallbackSnapPoints
 * @property {number=} extraPx
 * @property {number=} minPct
 * @property {number=} maxPct
 * @property {boolean=} includeAndroidBottomSafeInFooter
 *
 * NEW
 * @property {boolean=} lockMeasureToFontMode // 기본 true: 폰트모드 변경 때만 측정값 갱신
 * @property {boolean=} resetOnExtraKeys // 기본 false: extraResetKeys로 reset 안 함
 */

export function useMeasuredSnapPoints({
  windowH,
  fontModeKey,
  extraResetKeys = [],
  externalSnapPoints,
  fallbackSnapPoints = ['65%', '99%'],
  extraPx = getResponsiveHeight(8),
  minPct = 52,
  maxPct = 92,
  includeAndroidBottomSafeInFooter = true,

 // NEW defaults
  lockMeasureToFontMode = true,
  resetOnExtraKeys = false,
}) {
  const insets = useSafeAreaInsets();

 // Android bottom safe (네비게이션바에 버튼 가리지 않도록 fallback 48dp 수준)
  const bottomSafe = useMemo(() => {
    if (Platform.OS !== 'android') return Math.max(insets.bottom || 0, 0);
    const fallback = getResponsiveHeight(48);
    return Math.max(insets.bottom || 0, fallback);
  }, [insets.bottom]);

 // 실측 ref/state
  const headerHRef = useRef(0);
  const contentHRef = useRef(0);
  const footerHRef = useRef(0);

  const [headerH, setHeaderH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const [footerH, setFooterH] = useState(0);

 // 측정 업데이트 허용 플래그
  const allowMeasureRef = useRef(true);

  const resetMeasures = useCallback(() => {
    headerHRef.current = 0;
    contentHRef.current = 0;
    footerHRef.current = 0;
    setHeaderH(0);
    setContentH(0);
    setFooterH(0);
  }, []);

 /**
 * 폰트모드 변경 시에만 reset + 재측정 허용
 * - 지윤 요구사항 핵심: 폰트모드에만 높이 반응
 */
  useEffect(() => {
 // 외부 snapPoints 강제면 측정 자체 의미 없음 → 그냥 잠그기
    if (Array.isArray(externalSnapPoints) && externalSnapPoints.length) {
      allowMeasureRef.current = false;
      return;
    }

    allowMeasureRef.current = true;
    resetMeasures();
  }, [fontModeKey, resetMeasures, externalSnapPoints]);

 /**
 * extraResetKeys는 기본적으로 "reset 트리거"가 아님
 * - 진짜 필요한 화면만 resetOnExtraKeys=true로 사용
 */
  useEffect(() => {
    if (!resetOnExtraKeys) return;
    if (Array.isArray(externalSnapPoints) && externalSnapPoints.length) return;

    allowMeasureRef.current = true;
    resetMeasures();
 // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetOnExtraKeys, resetMeasures, externalSnapPoints, ...extraResetKeys]);

 // “한 번만” 실측 핸들러들 (락 반영)
  const onHeaderLayout = useCallback(h => {
    if (lockMeasureToFontMode && !allowMeasureRef.current) return;

    const height = Number(h || 0);
    if (!height || height < 10) return;
    if (headerHRef.current > 0) return;

    headerHRef.current = height;
    setHeaderH(height);
  }, [lockMeasureToFontMode]);

  const onContentLayout = useCallback(h => {
    if (lockMeasureToFontMode && !allowMeasureRef.current) return;

    const height = Number(h || 0);
    if (!height || height < 10) return;
    if (contentHRef.current > 0) return;

    contentHRef.current = height;
    setContentH(height);
  }, [lockMeasureToFontMode]);

  const onFooterLayout = useCallback(
    h => {
      if (lockMeasureToFontMode && !allowMeasureRef.current) return;

      const height = Number(h || 0);
      if (!height || height < 10) return;
      if (footerHRef.current > 0) return;

      const addSafe = includeAndroidBottomSafeInFooter ? bottomSafe : 0;

      footerHRef.current = height + addSafe;
      setFooterH(height + addSafe);
    },
    [bottomSafe, includeAndroidBottomSafeInFooter, lockMeasureToFontMode],
  );

 // snapPoints 결정
  const snapPoints = useMemo(() => {
 // 외부 스냅 우선
    if (Array.isArray(externalSnapPoints) && externalSnapPoints.length >= 2) {
      return externalSnapPoints;
    }
    if (Array.isArray(externalSnapPoints) && externalSnapPoints.length === 1) {
      return [externalSnapPoints[0], '99%'];
    }

 // 실측 전
    if (!headerH || !contentH || !footerH) return fallbackSnapPoints;

    return makeSnapWithFooterPx({
      windowH,
      headerPx: headerH,
      minContentPx: contentH,
      footerPx: footerH,
      bottomSafePx: 0,
      extraPx,
      minPct,
      maxPct,
    });
  }, [
    externalSnapPoints,
    headerH,
    contentH,
    footerH,
    fallbackSnapPoints,
    windowH,
    extraPx,
    minPct,
    maxPct,
  ]);

  const measuredReady = !!(headerH && contentH && footerH);

 /**
 * 측정이 끝나면 잠금(폰트모드 변경 전까지 유지)
 */
  useEffect(() => {
    if (!lockMeasureToFontMode) return;
    if (!measuredReady) return;

    allowMeasureRef.current = false;
  }, [measuredReady, lockMeasureToFontMode]);

  return {
    snapPoints,
    bottomSafe,
    measuredReady,
    resetMeasures,
    measureHandlers: {
      onHeaderLayout,
      onContentLayout,
      onFooterLayout,
    },
  };
}
