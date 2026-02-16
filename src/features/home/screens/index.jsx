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

// ✅✅✅ 여기 추가 (경로는 너 프로젝트에 맞게)
import {fetchUserThunk} from '../store/userThunk';

import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

import HeaderSection from '../components/HeaderSection';
import MemberGridSection from '../components/MemberGridSection';
import YellowSpinner from 'components/YellowSpinner';

import {
  requestNotificationPermission,
  getFcmTokenAndSend,
  handleNotificationListeners,
} from 'features/notification/utils/requestNotificationPermission';

import useWebSocketStatus from 'hooks/useWebSocketStatus';
import useFamilyStatusSocket from 'hooks/useFamilyStatusSocket';

import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeGuideModal from '../components/HomeGuideModal';
import AppAlertHost from 'components/modal/AppAlertHost';
import useActiveAppEvent from 'hooks/useActiveAppEvent';
import {isEmotionValid} from '../utils/emotionUtils';
import {KEY_FIRST_ENTRY_AFTER_SETUP} from 'hooks/useGuide';

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
  // ✅ 회원가입/설정 완료 직후 첫 진입 시에는 이벤트·감정 모달 숨김 (null = 아직 미확인)
  const [skipAppAlertForFirstEntry, setSkipAppAlertForFirstEntry] = useState(null);

  // 감정이 이미 선택된 상태(24h 유효)면 감정 선택 모달 이벤트는 제외
  const hasValidEmotion = isEmotionValid(user?.emotion, user?.emotionUpdatedAt);
  const activeEvent = useActiveAppEvent({
    screen: 'home',
    hideEmotionPickWhenHasEmotion: hasValidEmotion,
  });

  // ✅ 첫 진입 여부 확인 후 skip 플래그 설정 & 스토리지 키 삭제 (확인 전에는 미노출)
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

  // ✅ 디버깅 로그(원하면 유지)
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

  /**
   * ✅✅✅ 핵심 수정:
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
        // ✅ 1) 유저 최신화 먼저
        const r = dispatch(fetchUserThunk());
        if (r && typeof r.unwrap === 'function') {
          await r.unwrap();
        } else if (r && typeof r.then === 'function') {
          await r;
        }

        // ✅ 2) 그 다음 가족 데이터
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

    // ✅ 새로고침 때도 유저 최신화 한번 섞어주면 더 튼튼함
    try {
      const r = dispatch(fetchUserThunk());
      if (r && typeof r.unwrap === 'function') await r.unwrap();
      else if (r && typeof r.then === 'function') await r;
    } catch (e) {
      console.log('[HomeScreen] refresh fetchUser error:', e);
    }

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

  const canShowGuide = didInitialLoad && !isAppAlertVisible && !!familyId;

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

      <AppAlertHost
        enabled={skipAppAlertForFirstEntry === false}
        event={activeEvent}
        onVisibleChange={setIsAppAlertVisible}
      />

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
