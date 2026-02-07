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

  // ✅ familyId를 "family slice"만 보지 말고 "user"에도 있으면 그걸 우선 활용
  // (백엔드 UserDTO에 familyId를 넣어둔 경우가 많음)
  const familyId =
    family?.familyId ||
    user?.familyId ||
    user?.family?.familyId ||
    null;

  // ✅ FamilyCodeModal 표시 상태
  const [isVisible, setIsVisible] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [didInitialLoad, setDidInitialLoad] = useState(false);

  // ✅ AppAlertModal 상태 (뜩! 알림)
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertPayload, setAlertPayload] = useState({
    title: '가이드 완료!',
    message: '이제 홈 기능을 편하게 써볼 수 있어요 🙂',
  });

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

  // ✅ 소켓도 familyId 기준으로
  useWebSocketStatus(user?.userId);
  useFamilyStatusSocket(familyId);

  // ✅ 초기 로딩: userId + familyId가 준비되면 무조건 한 번 로딩하고 didInitialLoad를 true로 바꾼다
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!user?.userId) return;

      // ✅ 가족이 있는 유저인데 familyId가 아직 안 들어온 상태면
      // 여기서 무한스피너 방지용으로 "상태 확인" 로그를 찍어두면 디버깅이 빨라짐
      if (!familyId) {
        // familyId가 늦게 들어오는 구조라면, 여기서 setDidInitialLoad를 true로 해버리면
        // 화면은 뜨지만 데이터는 비어있을 수 있음.
        // 지금은 "정상 로딩을 위해 familyId가 필요"하니 일단 기다리되,
        // 무한 대기를 막고 싶다면 타임아웃 처리도 가능.
        return;
      }

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

  const showGuideDoneAlert = useCallback(() => {
    setAlertPayload({
      title: '가이드 완료!',
      message: '프로필을 눌러 편집도 해보고, 가족도 초대해봐요 🙂',
    });
    setAlertVisible(true);

    setTimeout(() => {
      setAlertVisible(false);
    }, 1200);
  }, []);

  // ✅ 로딩 조건도 familyId 기준으로
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

      <HomeGuideModal
        enabled={true}
        ready={didInitialLoad}
        forceVisible={false}
        onDone={showGuideDoneAlert}
      />

      <AppAlertHost enabled={true} event={activeEvent} />

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
