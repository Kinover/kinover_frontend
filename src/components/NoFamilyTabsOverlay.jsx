import React, {useMemo} from 'react';
import {useNavigationState} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import NoFamilyOverlay from 'components/NoFamilyOverlay';
import {getMainTabBarHeightPx} from 'utils/layoutMetrics';
import {STORE_MOCK_ENABLED} from 'features/home/utils/storeMockData';

const TABS_WITH_OVERLAY = ['소통', '일정', '추억'];

function selectActiveMainTabName(state) {
  if (!state?.routes) {
    return null;
  }
  const route = state.routes[state.index];
  if (route?.name !== 'Tabs') {
    return null;
  }
  const tabState = route.state;
  if (!tabState?.routes?.length) {
    return null;
  }
  return tabState.routes[tabState.index]?.name ?? null;
}

function shouldShowOverlay(activeTab, reduxFamilyId) {
  if (!activeTab || !TABS_WITH_OVERLAY.includes(activeTab)) {
    return false;
  }
  if (activeTab === '일정' && STORE_MOCK_ENABLED) {
    return false;
  }
  const hasFamily =
    reduxFamilyId != null && String(reduxFamilyId).trim() !== '';
  return !hasFamily;
}

/**
 * 탭 네비게이터와 형제로 두어 헤더까지 덮되, 하단 탭바는 비운다.
 */
export default function NoFamilyTabsOverlay() {
  const activeTab = useNavigationState(selectActiveMainTabName);
  const reduxFamilyId = useSelector(
    state =>
      state.family?.familyId ??
      state.user?.familyId ??
      state.user?.family?.familyId ??
      null,
  );
  const show = useMemo(
    () => shouldShowOverlay(activeTab, reduxFamilyId),
    [activeTab, reduxFamilyId],
  );
  const insets = useSafeAreaInsets();
  const tabBarHeight = getMainTabBarHeightPx(insets);

  if (!show) {
    return null;
  }

  return <NoFamilyOverlay bottomInset={tabBarHeight} />;
}
