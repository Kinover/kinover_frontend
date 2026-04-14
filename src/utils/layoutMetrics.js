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
    normal: isAndroid ? ['75%', '88%'] : ['62%', '88%'],
    large: isAndroid ? ['78%', '89%'] : ['66%', '89%'],
    xl: isAndroid ? ['80%', '90%'] : ['70%', '90%'],
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
    normal: isAndroid ? ['70%', '92%'] : ['56.5%', '92%'],
    large:  isAndroid ? ['76%', '93%'] : ['68%', '93%'],
    xl:     isAndroid ? ['80%', '94%'] : ['72%', '94%'],
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
 * Android는 동일 Figma 스케일(107.5)이 네이티브 헤더 툴바만 유독 두껍게 보이는 경우가 많아
 * 총 높이만 소폭 줄인다. iOS는 기존과 동일.
 */
export const getTabStackHeaderHeight = () => {
  const base = getResponsiveHeight(107.5);
  if (Platform.OS !== 'android') {
    return base;
  }
  return getResponsiveHeight(70);
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
