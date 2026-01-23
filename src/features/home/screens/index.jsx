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

import {getResponsiveWidth} from '../../../utils/responsive';

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

export default function HomeScreen() {
  const dispatch = useDispatch();
  const userSheetRef = useRef(null);

  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const {onlineUserIds, lastActiveMap} = useSelector(state => state.family);

  // ✅ fontMode 구독
  const fontMode = useSelector(state => state.ui.fontMode);

  const [isVisible, setIsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [didInitialLoad, setDidInitialLoad] = useState(false);

  const familyLoaded = !!family?.familyId;

  const familyMembers = (familyUserList || []).filter(
    m => m.userId !== user.userId,
  );

  // ✅ 모드별 paddingBottom "확실히" 차이나게 (숫자 직접)
  const scrollPaddingBottom =
    fontMode === FONT_MODE.EXTRA_LARGE
      ? 90
      : fontMode === FONT_MODE.LARGE
      ? 70
      : 50;

  // 🔔 알림 리스너
  useEffect(() => {
    const unsubscribe = handleNotificationListeners();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // 🔑 권한 요청 → FCM 토큰
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

  // 웹소켓
  useWebSocketStatus(user.userId);
  useFamilyStatusSocket(family.familyId);

  // ✅ 데이터 로드
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (user.userId && family.familyId) {
        try {
          await dispatch(fetchFamilyThunk(family.familyId));
          await dispatch(fetchFamilyUserListThunk(family.familyId));
          await dispatch(fetchFamilyStatusThunk(family.familyId));
        } finally {
          if (mounted) setDidInitialLoad(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch, user.userId, family.familyId]);

  const doRefreshMembers = useCallback(async () => {
    if (!family?.familyId) return;

    await dispatch(fetchFamilyUserListThunk(family.familyId));
    await dispatch(fetchFamilyStatusThunk(family.familyId));
    await dispatch(fetchFamilyThunk(family.familyId));
  }, [dispatch, family?.familyId]);

  const onPullRefresh = useCallback(() => {
    if (!family?.familyId) return;
    if (refreshing) return;

    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 350);

    requestAnimationFrame(() => {
      doRefreshMembers();
    });
  }, [doRefreshMembers, family?.familyId, refreshing]);

  // ✅ selectedUser가 세팅되면 그때 열기
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

    if (family?.familyId) {
      dispatch(fetchFamilyUserListThunk(family.familyId));
      dispatch(fetchFamilyStatusThunk(family.familyId));
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

  return (
    <View style={styles.container}>
      <View style={styles.backgroundCurve} />

      {/* ✅ 디버그 필요하면 켜 */}
      {/* <Text style={{position:'absolute', top: 50, left: 20, zIndex: 999}}>
        fontMode: {String(fontMode)} / pb: {String(scrollPaddingBottom)}
      </Text> */}

      <ScrollView
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: scrollPaddingBottom},
        ]}>
        <HeaderSection user={user} onUserPress={handleUserPress} />

        <MemberGridSection
          members={familyMembers}
          onlineUserIds={onlineUserIds}
          lastActiveMap={lastActiveMap}
          onUserPress={handleUserPress}
          onAddPress={() => setIsVisible(true)}
        />
      </ScrollView>

      <FamilyCodeModal
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        familyCode={family.familyId}
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
