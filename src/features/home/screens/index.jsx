// src/features/home/screens/HomeScreen.jsx
import React, {useRef, useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useReduxFontMode} from 'hooks/useReduxFontMode';
import {SafeAreaView} from 'react-native-safe-area-context';

import {FONT_MODE} from 'store/uiSlice';

import FamilyCodeModal from '../components/FamilyCodeModal';
import UserBottomSheetModal from '../components/UserBottomSheet';
import {
  useGetFamilyQuery,
  useGetFamilyStatusQuery,
  useGetFamilyUsersQuery,
  useGetUserQuery,
  useModifyUserMutation,
} from '../services/homeApi';

import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {BACKGROUND_COLORS} from 'styles/style';

import HeaderSection from '../components/HeaderSection';
import MemberGridSection from '../components/MemberGridSection';
import YellowSpinner from 'components/yellowSpinner';
import ToastModal from 'components/modal/ToastModal';

import {
  requestNotificationPermission,
  getFcmTokenAndSend,
  handleNotificationListeners,
} from 'features/notification/utils/requestNotificationPermission';

import useWebSocketStatus from 'hooks/useWebSocketStatus';
import useFamilyStatusSocket from 'hooks/useFamilyStatusSocket';
import {useDoubleBackToExit} from 'hooks/useDoubleBackToExit';

import mmkvStorage from 'utils/mmkvStorage';
import HomeGuideModal from '../components/HomeGuideModal';
import AppAlertHost from 'components/modal/AppAlertHost';
import useActiveAppEvent from 'hooks/useActiveAppEvent';
import {isEmotionValid} from '../utils/emotionUtils';
import {KEY_FIRST_ENTRY_AFTER_SETUP} from 'hooks/useGuide';
import {useGuideOverlay} from 'contexts/GuideOverlayContext';
import {
  STORE_MOCK_ENABLED,
  getStoreMockUser,
  getStoreMockFamilyMembers,
  getStoreMockOnlineUserIds,
  getStoreMockLastActiveMap,
} from '../utils/storeMockData';
import {blockedIdSetFromStateIds} from 'features/moderation/utils/blockedUserFilter';
const parseFamilyStatus = data => {
  if (!Array.isArray(data)) {
    return {onlineUserIds: [], lastActiveMap: {}};
  }

  const onlineUserIds = data.filter(u => u?.online).map(u => u.userId);
  const lastActiveMap = data.reduce((acc, curr) => {
    if (curr?.userId != null) {
      acc[curr.userId] = curr.lastActiveAt;
    }
    return acc;
  }, {});

  return {onlineUserIds, lastActiveMap};
};

export default function HomeScreen() {
  const userSheetRef = useRef(null);
  const guideProfileRef = useRef(null);
  const guideMoodRef = useRef(null);
  const guideInviteRef = useRef(null);

  const fallbackUser = useSelector(state => state.user);
  const [modifyUser] = useModifyUserMutation();
  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
    refetch: refetchUser,
  } = useGetUserQuery(undefined, {skip: STORE_MOCK_ENABLED});
  const user = userData ?? fallbackUser;

  const fontMode = useReduxFontMode();

  const familyId = user?.familyId || user?.family?.familyId || null;
  const {
    data: familyData,
    isLoading: isFamilyLoading,
    isError: isFamilyError,
    refetch: refetchFamily,
  } = useGetFamilyQuery(familyId, {
    skip: STORE_MOCK_ENABLED || !familyId,
  });
  const {
    data: familyUserList = [],
    isLoading: isFamilyUsersLoading,
    isError: isFamilyUsersError,
    refetch: refetchFamilyUsers,
  } = useGetFamilyUsersQuery(familyId, {
    skip: STORE_MOCK_ENABLED || !familyId,
  });
  const {
    data: familyStatusData = [],
    isLoading: isFamilyStatusLoading,
    isError: isFamilyStatusError,
    refetch: refetchFamilyStatus,
  } = useGetFamilyStatusQuery(familyId, {
    skip: STORE_MOCK_ENABLED || !familyId,
  });
  const {onlineUserIds, lastActiveMap} = parseFamilyStatus(familyStatusData);

  const [isVisible, setIsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [didInitialLoad, setDidInitialLoad] = useState(false);
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const [blockedProfileToastVisible, setBlockedProfileToastVisible] =
    useState(false);

 // AppAlert "실제 표시 여부"를 HomeScreen에서 추적
  const [isAppAlertVisible, setIsAppAlertVisible] = useState(false);
 // 회원가입/설정 완료 직후 첫 진입 시에는 이벤트·감정 모달 숨김 (null = 아직 미확인)
  const [skipAppAlertForFirstEntry, setSkipAppAlertForFirstEntry] = useState(null);

  const hasValidEmotion = isEmotionValid(user?.emotion, user?.emotionUpdatedAt);
  const activeEvent = useActiveAppEvent({
    screen: 'home',
    hideEmotionPickWhenHasEmotion: hasValidEmotion,
    hideEmotionPickOnFirstEntry: skipAppAlertForFirstEntry !== false,
  });

 // 가이드 모달이 떠 있는 동안에는 이벤트 모달 숨김 (iOS: guideProps, Android: setAnyGuideVisible)
  const {isGuideVisible} = useGuideOverlay() || {};

 // 첫 진입 여부 확인 후 skip 플래그 설정 & 스토리지 키 삭제 (확인 전에는 미노출)
  useEffect(() => {
    if (!familyId) return;
    let mounted = true;
    (async () => {
      try {
        const value = await mmkvStorage.getItem(KEY_FIRST_ENTRY_AFTER_SETUP);
        if (value === '1') {
          if (mounted) setSkipAppAlertForFirstEntry(true);
          await mmkvStorage.removeItem(KEY_FIRST_ENTRY_AFTER_SETUP);
        } else {
          if (mounted) setSkipAppAlertForFirstEntry(false);
        }
      } catch {
        if (mounted) setSkipAppAlertForFirstEntry(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [familyId]);

  const blockedIds = useSelector(s => s.blockedUsers?.ids ?? []);
  const blockedSet = useMemo(
    () => blockedIdSetFromStateIds(blockedIds),
    [blockedIds],
  );

  const familyMembers = useMemo(() => {
    return (familyUserList || [])
      .filter(m => m.userId !== user?.userId)
      .filter(m => !blockedSet.has(Number(m?.userId)));
  }, [familyUserList, user?.userId, blockedSet]);

 // 앱스토어 캡처용 더미 (STORE_MOCK_ENABLED 시 표시용 데이터만 치환)
  const displayUser = STORE_MOCK_ENABLED ? getStoreMockUser() : user;
  const displayFamilyMembers = STORE_MOCK_ENABLED
    ? getStoreMockFamilyMembers()
    : familyMembers;
  const displayOnlineUserIds = STORE_MOCK_ENABLED
    ? getStoreMockOnlineUserIds()
    : onlineUserIds;
  const displayLastActiveMap = STORE_MOCK_ENABLED
    ? getStoreMockLastActiveMap()
    : lastActiveMap;

  const scrollPaddingBottom =
    fontMode === FONT_MODE.EXTRA_LARGE
      ? getResponsiveHeight(130)
      : fontMode === FONT_MODE.LARGE
      ? getResponsiveHeight(110)
      : getResponsiveHeight(100);

 // iOS: 가이드 모달 닫은 뒤 터치 복구용 — early return 앞에 두어 훅 개수 고정
  const [contentKey, setContentKey] = useState(0);
  const handleGuideAfterClose = useCallback(() => setContentKey(k => k + 1), []);

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
  useDoubleBackToExit(true);

 /**
 * Home 진입 시:
 * - 화면은 먼저 보여주고(체감속도 개선),
 * - 데이터는 백그라운드에서 병렬 갱신
 */
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!user?.userId) return;
      if (!familyId) {
        if (mounted) setDidInitialLoad(true);
        return;
      }

      if (mounted) setDidInitialLoad(true);

      if (
        mounted &&
        (isUserError || isFamilyError || isFamilyUsersError || isFamilyStatusError)
      ) {
        setErrorToastVisible(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    user?.userId,
    familyId,
    isUserError,
    isFamilyError,
    isFamilyUsersError,
    isFamilyStatusError,
  ]);

  const doRefreshMembers = useCallback(async () => {
    if (!familyId) return;

    try {
      const results = await Promise.allSettled([
        refetchUser(),
        refetchFamily(),
        refetchFamilyUsers(),
        refetchFamilyStatus(),
      ]);
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) setErrorToastVisible(true);
    } catch (e) {
      setErrorToastVisible(true);
    }
  }, [familyId, refetchFamily, refetchFamilyStatus, refetchFamilyUsers, refetchUser]);

  const onPullRefresh = useCallback(async () => {
    if (!familyId) return;
    if (refreshing) return;

    setRefreshing(true);
    try {
      await doRefreshMembers();
    } finally {
      setRefreshing(false);
    }
  }, [doRefreshMembers, familyId, refreshing]);

  useEffect(() => {
    if (!selectedUser) return;
    requestAnimationFrame(() => {
      userSheetRef.current?.present?.();
    });
  }, [selectedUser]);

  const handleUserPress = member => {
    const oid = Number(member?.userId);
    if (Number.isFinite(oid) && blockedSet.has(oid)) {
      setBlockedProfileToastVisible(true);
      return;
    }
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
    if (STORE_MOCK_ENABLED) {
      dismissUserSheet();
      return;
    }

    const payload = {
      userId: selectedUser.userId,
      name,
      trait,
    };

    const trimmedImage = (imageUrl || '').trim();
    if (trimmedImage) payload.image = trimmedImage;

    await modifyUser(payload).unwrap();

    if (familyId) {
      refetchFamilyUsers();
      refetchFamilyStatus();
    }

    dismissUserSheet();
  };

  const isLoading =
    !STORE_MOCK_ENABLED &&
    (!didInitialLoad ||
      isUserLoading ||
      (familyId &&
        (isFamilyLoading || isFamilyUsersLoading || isFamilyStatusLoading)));

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

  const canShowGuide = didInitialLoad && !!familyId;

  return (
    <View style={styles.container}>
      <View key={contentKey} style={styles.contentWrap}>
        <View style={styles.backgroundCurve} />

        <ScrollView
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: scrollPaddingBottom},
          ]}>
          <HeaderSection
            user={displayUser}
            onUserPress={handleUserPress}
            onInvitePress={openInviteCodeModal}
            guideRefs={{
              family_status: guideProfileRef,
              my_mood: guideMoodRef,
            }}
          />

          <MemberGridSection
            members={displayFamilyMembers}
            onlineUserIds={displayOnlineUserIds}
            lastActiveMap={displayLastActiveMap}
            onUserPress={handleUserPress}
            onAddPress={openInviteCodeModal}
            guideInviteRef={guideInviteRef}
          />
        </ScrollView>
      </View>

      <AppAlertHost
        enabled={true}
        event={activeEvent}
        onVisibleChange={setIsAppAlertVisible}
      />

      <HomeGuideModal
        enabled={canShowGuide}
        ready={didInitialLoad}
        forceVisible={false}
        onAfterClose={handleGuideAfterClose}
        targetRefsByKey={{
          family_status: guideProfileRef,
          family_edit: guideProfileRef,
          my_mood: guideMoodRef,
          family_invite: guideInviteRef,
        }}
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

      <ToastModal
        visible={errorToastVisible}
        message="데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요."
        onClose={() => setErrorToastVisible(false)}
        duration={3000}
      />
      <ToastModal
        visible={blockedProfileToastVisible}
        message="차단한 구성원의 프로필은 볼 수 없어요."
        onClose={() => setBlockedProfileToastVisible(false)}
        duration={2200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLORS.primaryBg,
    overflow: 'visible',
  },
  contentWrap: {
    flex: 1,
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
    backgroundColor: BACKGROUND_COLORS.secondaryBg,
    borderTopLeftRadius: getResponsiveWidth(600),
    borderTopRightRadius: getResponsiveWidth(600),
    zIndex: -1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
