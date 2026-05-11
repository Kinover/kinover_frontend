import {Dimensions, Platform, StatusBar} from 'react-native';
import {getResponsiveHeight} from 'utils/responsive';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const getFontModeTier = fontMode => {
  const fm = String(fontMode ?? '').toLowerCase();
  const isLarge = fm.includes('large') && !fm.includes('extra');
  const isXL = fm.includes('extra');
  if (isXL) return 'xl';
  if (isLarge) return 'large';
  return 'normal';
};

export const getSheetSnapPointsByTier = ({
  fontMode,
  normal,
  large,
  xl,
  fallback = ['66%', '92%'],
}) => {
  const tier = getFontModeTier(fontMode);
  const fromTier = tier === 'xl' ? xl : tier === 'large' ? large : normal;
  const raw = fromTier || fallback;
  const base = Number.parseFloat(raw?.[0]);
  const open = Number.parseFloat(raw?.[1]);

  if (!Number.isFinite(base) || !Number.isFinite(open)) return fallback;

  const safeBase = clamp(base, 45, 90);
  const safeOpen = clamp(Math.max(open, safeBase + 4), 80, 99);
  return [`${safeBase}%`, `${safeOpen}%`];
};

export const getUserBottomSheetSnapPoints = fontMode => {
  const isAndroid = Platform.OS === 'android';
  const [first] = getSheetSnapPointsByTier({
    fontMode,
    // 프로필 편집 — 시트가 화면을 덜 덮도록 스냅을 이전보다 약간 낮게
    normal: isAndroid ? ['84%', '94%'] : ['76%', '94%'],
    large: isAndroid ? ['86%', '95%'] : ['79%', '95%'],
    xl: isAndroid ? ['88%', '96%'] : ['82%', '96%'],
  });
  return [first];
};

export const getCreateRoomBottomSheetSnapPoints = (fontMode, externalSnapPoints) => {
  if (Array.isArray(externalSnapPoints) && externalSnapPoints.length >= 1) {
    return [externalSnapPoints[0]];
  }

  const isAndroid = Platform.OS === 'android';
  const [first] = getSheetSnapPointsByTier({
    fontMode,
    normal: isAndroid ? ['70%', '92%'] : ['49%', '92%'],
    large:  isAndroid ? ['76%', '93%'] : ['58%', '93%'],
    xl:     isAndroid ? ['80%', '94%'] : ['62%', '94%'],
  });
  return [first];
};

/** 구성원이 많을 때만 살짝 더 높게 (칩 스크롤 여유) */
const SCHEDULE_SNAP_MANY_MEMBERS = {
  normal: ['64%', '88%'],
  large: ['66%', '89%'],
  xl: ['68%', '90%'],
};

/** 일정 편집 바텀시트 — 기본은 화면을 덜 덮도록 낮은 스냅 */
export const getScheduleBottomSheetSnapPoints = (fontMode, memberCount = 0) => {
  const hasManyMembers = memberCount >= 5;
  const [first] = getSheetSnapPointsByTier({
    fontMode,
    normal: hasManyMembers ? SCHEDULE_SNAP_MANY_MEMBERS.normal : ['54%', '84%'],
    large: hasManyMembers ? SCHEDULE_SNAP_MANY_MEMBERS.large : ['56%', '85%'],
    xl: hasManyMembers ? SCHEDULE_SNAP_MANY_MEMBERS.xl : ['58%', '86%'],
  });
  return [first];
};

export const getKeyboardSafeGap = () => getResponsiveHeight(12);

/**
 * 탭·루트 스택의 `headerStyle.height`.
 * iOS·Android 동일 스케일(상단 헤더 높이 통일).
 */
export const getTabStackHeaderHeight = () => getResponsiveHeight(107.5);

/**
 * 메인 하단 탭바(AnimatedTabBar) 세로 점유 높이와 동일.
 * 탭바 터치를 남기고 오버레이 하단을 비울 때 사용.
 *
 * @param {{bottom?: number}} [insets] useSafeAreaInsets()
 * @returns {number}
 */
export const getMainTabBarHeightPx = (insets = {}) => {
  const rawInsetBottom = Number(insets?.bottom ?? 0);
  const navInset =
    Platform.OS === 'android'
      ? Math.max(rawInsetBottom, getAndroidNavBottomInsetEstimate())
      : 0;
  return 90 + navInset;
};

export const getAndroidNavBottomInsetEstimate = () => {
  if (Platform.OS !== 'android') return 0;

  const screenH = Number(Dimensions.get('screen')?.height || 0);
  const windowH = Number(Dimensions.get('window')?.height || 0);
  const statusH = Number(StatusBar.currentHeight || 0);

  const rawDiff = screenH - windowH - statusH;
  return Math.max(0, Math.round(rawDiff));
};

/**
 * 소통·일정·추억 탭 FAB `bottom`에 더할 Android 전용 오프셋.
 * `getResponsiveHeight(48)` 등을 또 넣으면 탭바용 110과 겹쳐 FAB이 과하게 위로 올라간다.
 *
 * @param {number} safeAreaBottom `useSafeAreaInsets().bottom`
 */
export const getFabAndroidNavInsetExtra = (safeAreaBottom = 0) => {
  if (Platform.OS !== 'android') {
    return 0;
  }
  const raw = Number(safeAreaBottom ?? 0);
  return Math.max(raw, getAndroidNavBottomInsetEstimate());
};

/**
 * @gorhom BottomSheetFooter `bottomInset` / 푸터 paddingBottom과 동일 정책.
 * 모달·오버레이에서 insets.bottom이 0으로 오는 기기(삼성 3버튼 내비 등) 대비.
 *
 * @param {number} rawBottomInset useSafeAreaInsets().bottom
 * @param {number} [extraMinBottom] 화면별 추가 최소값 (예: ScheduleEditor의 bottomSafe)
 */
export function getAndroidBottomSheetFooterInsetPx(
  rawBottomInset = 0,
  extraMinBottom = 0,
) {
  if (Platform.OS !== 'android') return 0;
  const raw = Number(rawBottomInset || 0);
  const fromScreen = getAndroidNavBottomInsetEstimate();

  // Samsung 3버튼 내비 + edge-to-edge 환경에서 raw·fromScreen 모두 0이 될 수 있음.
  // Android 내비게이션 바 표준 높이(48dp)를 최소 기준으로 보장한다.
  const NAV_BAR_MIN_DP = getResponsiveHeight(48);
  const navFallback = getResponsiveHeight(56);
  const footerBuffer = getResponsiveHeight(24);
  const core = Math.max(
    raw,
    fromScreen,
    NAV_BAR_MIN_DP,
    navFallback,
    Number(extraMinBottom || 0),
  );
  return core + footerBuffer;
}
