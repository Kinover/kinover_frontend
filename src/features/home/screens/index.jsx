// src/features/home/screens/HomeScreen.jsx
import React, {useRef, useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';

import {FONT_MODE} from 'store/uiSlice';

import FamilyCodeModal from '../components/FamilyCodeModal';
import UserBottomSheetModal from '../components/UserBottomSheet';

import {fetchFamilyThunk, fetchFamilyStatusThunk} from '../store/familyThunk';
import {fetchFamilyUserListThunk} from '../store/familyUserThunk';
import {modifyUserThunk} from '../store/userThunk';

import {fetchUserThunk} from '../store/userThunk';

import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

import HeaderSection from '../components/HeaderSection';
import MemberGridSection from '../components/MemberGridSection';
import YellowSpinner from 'components/yellowSpinner';

import {
  requestNotificationPermission,
  getFcmTokenAndSend,
  handleNotificationListeners,
} from 'features/notification/utils/requestNotificationPermission';

import useWebSocketStatus from 'hooks/useWebSocketStatus';
import useFamilyStatusSocket from 'hooks/useFamilyStatusSocket';
import {useDoubleBackToExit} from 'hooks/useDoubleBackToExit';

import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function HomeScreen() {
  const dispatch = useDispatch();
  const userSheetRef = useRef(null);
  const guideProfileRef = useRef(null);
  const guideMoodRef = useRef(null);
  const guideInviteRef = useRef(null);

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
        const value = await AsyncStorage.getItem(KEY_FIRST_ENTRY_AFTER_SETUP);
        if (value === '1') {
          if (mounted) setSkipAppAlertForFirstEntry(true);
          await AsyncStorage.removeItem(KEY_FIRST_ENTRY_AFTER_SETUP);
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

  const familyLoaded = !!familyId;

  const familyMembers = (familyUserList || []).filter(
    m => m.userId !== user?.userId,
  );

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
    console.log('[HomeScreen] user snapshot:', {
      userId: user?.userId,
      familyId: user?.familyId,
      status: user?.status,
      name: user?.name,
      birth: user?.birth,
    });
  }, [user]);

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
 * 핵심 수정:
 * Home 진입 시
 * 1) fetchUserThunk로 내 상태를 먼저 최신화
 * 2) 그 다음 family 관련 3개 fetch
 */
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!user?.userId) return;
      if (!familyId) return;

      try {
 // 1) 유저 최신화 먼저
        const r = dispatch(fetchUserThunk());
        if (r && typeof r.unwrap === 'function') {
          await r.unwrap();
        } else if (r && typeof r.then === 'function') {
          await r;
        }

 // 2) 그 다음 가족 데이터
        await dispatch(fetchFamilyThunk(familyId));
        await dispatch(fetchFamilyUserListThunk(familyId));
        await dispatch(fetchFamilyStatusThunk(familyId));
      } catch (e) {
        console.log('[HomeScreen] initial load error:', e);
 // 에러 나도 로딩 막지 말고 화면은 뜨게
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

 // 새로고침 때도 유저 최신화 한번 섞어주면 더 튼튼함
    try {
      const r = dispatch(fetchUserThunk());
      if (r && typeof r.unwrap === 'function') await r.unwrap();
      else if (r && typeof r.then === 'function') await r;
    } catch (e) {
      console.log('[HomeScreen] refresh fetchUser error:', e);
    }

    try {
      await dispatch(fetchFamilyUserListThunk(familyId));
      await dispatch(fetchFamilyStatusThunk(familyId));
      await dispatch(fetchFamilyThunk(familyId));
    } catch (e) {
      console.log('[HomeScreen] refresh family data error:', e);
    }
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

    await dispatch(modifyUserThunk(payload));

    if (familyId) {
      dispatch(fetchFamilyUserListThunk(familyId)).catch(e =>
        console.log('[HomeScreen] post-save family users refresh error:', e),
      );
      dispatch(fetchFamilyStatusThunk(familyId)).catch(e =>
        console.log('[HomeScreen] post-save family status refresh error:', e),
      );
    }

    dismissUserSheet();
  };

  const isLoading =
    !STORE_MOCK_ENABLED && (!familyLoaded || !didInitialLoad);

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

      {/* 이벤트 모달이 탭 터치를 막는지 확인하기 위해 임시로 비활성화 */}
      <AppAlertHost
        enabled={false}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC84D',
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
