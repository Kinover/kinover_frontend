// src/features/home/screens/HomeScreen.jsx
import React, {useRef, useEffect, useState, useCallback} from 'react';
import {View, StyleSheet, ScrollView, RefreshControl, Platform} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';

import {FONT_MODE} from 'store/uiSlice';

import FamilyCodeModal from '../components/FamilyCodeModal';
import UserBottomSheetModal from '../components/UserBottomSheet';

import {fetchFamilyThunk, fetchFamilyStatusThunk} from '../store/familyThunk';
import {fetchFamilyUserListThunk} from '../store/familyUserThunk';
import {modifyUserThunk} from '../store/userThunk';

import {getResponsiveHeight, getResponsiveWidth} from '../../../utils/responsive';

import HeaderSection from '../components/HeaderSection';
import MemberGridSection from '../components/MemberGridSection';
import YellowSpinner from '../../../components/YellowSpinner';

import {
  requestNotificationPermission,
  getFcmTokenAndSend,
  handleNotificationListeners,
} from '../../notification/utils/requestNotificationPermission';

import useWebSocketStatus from '../../../hooks/useWebSocketStatus';
import useFamilyStatusSocket from '../../../hooks/useFamilyStatusSocket';

import HomeGuideModal from '../components/HomeGuideModal';
import AppAlertHost from 'components/modal/AppAlertHost';
import useActiveAppEvent from 'hooks/useActiveAppEvent';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const userSheetRef = useRef(null);

  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const {onlineUserIds, lastActiveMap} = useSelector(state => state.family);

  const fontMode = useSelector(state => state.ui.fontMode);

  const familyId =
    family?.familyId || user?.familyId || user?.family?.familyId || null;

  const [isVisible, setIsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [didInitialLoad, setDidInitialLoad] = useState(false);

  // ✅ AppAlert "실제 표시 여부"를 HomeScreen에서 추적
  const [isAppAlertVisible, setIsAppAlertVisible] = useState(false);

  const activeEvent = useActiveAppEvent({screen: 'home'});

  const familyLoaded = !!familyId;

  const familyMembers = (familyUserList || []).filter(
    m => m.userId !== user.userId,
  );

  const scrollPaddingBottom =
    fontMode === FONT_MODE.EXTRA_LARGE
      ? getResponsiveHeight(130)
      : fontMode === FONT_MODE.LARGE
      ? getResponsiveHeight(110)
      : getResponsiveHeight(100);

  const openInviteCodeModal = useCallback(() => {
    setIsVisible(true);
  }, []);

  const closeInviteCodeModal = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const unsubscribe = handleNotificationListeners();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.userId) return;

    let mounted = true;
    (async () => {
      const granted = await requestNotificationPermission();
      if (!mounted) return;
      if (granted) await getFcmTokenAndSend(user.userId);
    })();

    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  useWebSocketStatus(user?.userId);
  useFamilyStatusSocket(familyId);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!user?.userId) return;
      if (!familyId) return;

      try {
        await dispatch(fetchFamilyThunk(familyId));
        await dispatch(fetchFamilyUserListThunk(familyId));
        await dispatch(fetchFamilyStatusThunk(familyId));
      } finally {
        if (mounted) setDidInitialLoad(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch, user?.userId, familyId]);

  const doRefreshMembers = useCallback(async () => {
    if (!familyId) return;

    await dispatch(fetchFamilyUserListThunk(familyId));
    await dispatch(fetchFamilyStatusThunk(familyId));
    await dispatch(fetchFamilyThunk(familyId));
  }, [dispatch, familyId]);

  const onPullRefresh = useCallback(() => {
    if (!familyId) return;
    if (refreshing) return;

    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 350);

    requestAnimationFrame(() => {
      doRefreshMembers();
    });
  }, [doRefreshMembers, familyId, refreshing]);

  useEffect(() => {
    if (!selectedUser) return;
    requestAnimationFrame(() => {
      userSheetRef.current?.present?.();
    });
  }, [selectedUser]);

  const handleUserPress = member => {
    setSelectedUser(null);
    requestAnimationFrame(() => setSelectedUser(member));
  };

  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const dismissUserSheet = useCallback(() => {
    userSheetRef.current?.dismiss?.();
  }, []);

  const handleSave = async (name, trait, imageUrl) => {
    if (!selectedUser) return;

    const payload = {
      userId: selectedUser.userId,
      name,
      trait,
    };

    const trimmedImage = (imageUrl || '').trim();
    if (trimmedImage) payload.image = trimmedImage;

    await dispatch(modifyUserThunk(payload));

    if (familyId) {
      dispatch(fetchFamilyUserListThunk(familyId));
      dispatch(fetchFamilyStatusThunk(familyId));
    }

    dismissUserSheet();
  };

  const isLoading = !familyLoaded || !didInitialLoad;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <YellowSpinner />
      </SafeAreaView>
    );
  }

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onPullRefresh}
      progressViewOffset={Platform.OS === 'ios' ? 0 : 8}
    />
  );

  /**
   * ✅✅✅ 모달 우선순위:
   * 1) AppAlert (activeEvent 있고, 실제 visible 중이면)
   * 2) HomeGuide
   *
   * - AppAlert가 떠있는 동안 가이드는 enabled=false로 "절대 못 뜨게" 막기
   * - AppAlert가 닫히면 다음 렌더에서 가이드가 뜰 수 있음
   */
  const canShowGuide =
    didInitialLoad &&
    !isAppAlertVisible &&
    !!familyId; // (원하면 조건 더 추가 가능)

  return (
    <View style={styles.container}>
      <View style={styles.backgroundCurve} />

      <ScrollView
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: scrollPaddingBottom},
        ]}>
        <HeaderSection
          user={user}
          onUserPress={handleUserPress}
          onInvitePress={openInviteCodeModal}
        />

        <MemberGridSection
          members={familyMembers}
          onlineUserIds={onlineUserIds}
          lastActiveMap={lastActiveMap}
          onUserPress={handleUserPress}
          onAddPress={openInviteCodeModal}
        />
      </ScrollView>

      {/* ✅ 1) AppAlert가 먼저 뜸 */}
      <AppAlertHost
        enabled={true}
        event={activeEvent}
        onVisibleChange={setIsAppAlertVisible}
      />

      {/* ✅ 2) AppAlert가 안 떠 있을 때만 가이드 모달 허용 */}
      <HomeGuideModal
        enabled={canShowGuide}
        ready={didInitialLoad}
        forceVisible={false}
      />

      <FamilyCodeModal
        visible={isVisible}
        onClose={closeInviteCodeModal}
        familyCode={familyId}
      />

      <UserBottomSheetModal
        ref={userSheetRef}
        selectedUser={selectedUser}
        onSave={handleSave}
        onCancel={dismissUserSheet}
        onDismiss={clearSelectedUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC84D',
    overflow: 'visible',
  },
  scrollContent: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? '22%' : '13%',
    alignItems: 'center',
  },
  backgroundCurve: {
    position: 'absolute',
    bottom: '-28%',
    width: '220%',
    left: '-60%',
    height: '100%',
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: getResponsiveWidth(600),
    borderTopRightRadius: getResponsiveWidth(600),
    zIndex: -1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
