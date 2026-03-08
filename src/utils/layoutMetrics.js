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

export const getUserBottomSheetSnapPoints = fontMode =>
  getSheetSnapPointsByTier({
    fontMode,
    normal: ['66%', '92%'],
    large: ['70%', '93%'],
    xl: ['74%', '94%'],
  });

export const getCreateRoomBottomSheetSnapPoints = (fontMode, externalSnapPoints) => {
  if (Array.isArray(externalSnapPoints) && externalSnapPoints.length >= 2) {
    return externalSnapPoints;
  }
  if (Array.isArray(externalSnapPoints) && externalSnapPoints.length === 1) {
    return [externalSnapPoints[0], '92%'];
  }

  return getSheetSnapPointsByTier({
    fontMode,
    normal: ['56.5%', '92%'],
    large: ['68%', '93%'],
    xl: ['72%', '94%'],
  });
};

/** 구성원 칩이 많아서 다음 줄로 넘어갈 때 바텀시트를 더 높게 열기 위한 스냅 */
const SCHEDULE_SNAP_MANY_MEMBERS = {
  normal: ['78%', '97%'],
  large: ['80%', '98%'],
  xl: ['82%', '99%'],
};

export const getScheduleBottomSheetSnapPoints = (fontMode, memberCount = 0) => {
  const hasManyMembers = memberCount >= 5;
  return getSheetSnapPointsByTier({
    fontMode,
    normal: hasManyMembers ? SCHEDULE_SNAP_MANY_MEMBERS.normal : ['70%', '97%'],
    large: hasManyMembers ? SCHEDULE_SNAP_MANY_MEMBERS.large : ['72%', '98%'],
    xl: hasManyMembers ? SCHEDULE_SNAP_MANY_MEMBERS.xl : ['74%', '99%'],
  });
};

export const getKeyboardSafeGap = () => getResponsiveHeight(12);

export const getChatKeyboardVerticalOffset = topInset => {
  const insetTop = Number(topInset || 0);
  const iosHeader = getResponsiveHeight(56);
  const extraGap = getResponsiveHeight(6);

  if (Platform.OS !== 'ios') return 0;
  return Math.round(insetTop + iosHeader + extraGap);
};

export const getAndroidNavBottomInsetEstimate = () => {
  if (Platform.OS !== 'android') return 0;

  const screenH = Number(Dimensions.get('screen')?.height || 0);
  const windowH = Number(Dimensions.get('window')?.height || 0);
  const statusH = Number(StatusBar.currentHeight || 0);

  const rawDiff = screenH - windowH - statusH;
  return Math.max(0, Math.round(rawDiff));
};
