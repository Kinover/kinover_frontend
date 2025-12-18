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

import FamilyCodeModal from '../components/FamilyCodeModal';
import UserBottomSheetModal from '../components/UserBottomSheet';

import {fetchFamilyThunk, fetchFamilyStatusThunk} from '../store/familyThunk';
import {fetchFamilyUserListThunk} from '../store/familyUserThunk';
import {modifyUserThunk} from '../store/userThunk';

import {getResponsiveWidth, getResponsiveHeight} from '../../../utils/responsive';

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

// import useGuide from 'hooks/useGuide';
// import GuideModal from 'components/GuideModal';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const userSheetRef = useRef(null);

  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);

  const {onlineUserIds, lastActiveMap} = useSelector(state => state.family);

  const [isVisible, setIsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ Pull-to-refresh 상태
  const [refreshing, setRefreshing] = useState(false);

  // ✅ “최초 로딩 완료 여부” (0명이어도 완료로 봐야 함)
  const [didInitialLoad, setDidInitialLoad] = useState(false);

  const familyLoaded = !!family?.familyId;

  // ✅ 홈에서 보여줄 멤버: 본인 제외
  const familyMembers = (familyUserList || []).filter(m => m.userId !== user.userId);

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
      if (granted) {
        await getFcmTokenAndSend(user.userId);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  // 웹소켓
  useWebSocketStatus(user.userId);
  useFamilyStatusSocket(family.familyId);

  // ✅ 패밀리/멤버 데이터 로드
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

  // ✅ 멤버/상태 갱신
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

  const handleUserPress = member => {
    setSelectedUser(member);
    setTimeout(() => userSheetRef.current?.present(), 100);
  };

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

    userSheetRef.current?.dismiss();
    setSelectedUser(null);
  };

  // ✅ 여기 핵심: “멤버가 0명”이어도 로딩 끝나면 화면을 보여줘야 함
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
        contentContainerStyle={styles.scrollContent}>
        <HeaderSection user={user} onUserPress={handleUserPress} />

        <MemberGridSection
          members={familyMembers} // ✅ 0명이면 MemberGridSection emptyState가 떠야 정상
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
        onCancel={() => {
          setSelectedUser(null);
          userSheetRef.current?.dismiss();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC84D',
  },
  scrollContent: {
    width: '100%',
    // ✅ height 고정은 비추 (빈 상태 문구가 아래로 밀리거나 잘릴 수 있음)
    // height: getResponsiveHeight(200),
    paddingBottom: getResponsiveHeight(30),
    alignItems: 'center',
  },
  backgroundCurve: {
    position: 'absolute',
    bottom: -getResponsiveHeight(130),
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
