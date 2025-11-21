import React, {useRef, useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';

import FamilyCodeModal from '../components/FamilyCodeModal';
import UserBottomSheetModal from '../components/UserBottomSheet';

import {fetchFamilyThunk} from '../store/familyThunk';
import {fetchFamilyUserListThunk} from '../store/familyUserThunk';
import {modifyUserThunk} from '../store/userThunk';

import {
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';

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
  const onlineUserIds = useSelector(state => state.status.onlineUserIds);
  const lastActiveMap = useSelector(state => state.family.lastActiveMap);

  const [isVisible, setIsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const familyLoaded = !!family?.familyId;
  const membersLoaded = familyUserList.length > 0;
  const isLoading = !familyLoaded || !membersLoaded;

  const familyMembers = familyUserList.filter(m => m.userId !== user.userId);

  // 🔔 알림 리스너 등록/해제
  useEffect(() => {
    const unsubscribe = handleNotificationListeners();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // 🔑 권한 요청 → FCM 토큰 발급/전송
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

  // 패밀리/멤버 데이터 로드
  useEffect(() => {
    if (user.userId && family.familyId) {
      dispatch(fetchFamilyThunk(family.familyId));
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, [dispatch, user.userId, family.familyId]);

  const handleUserPress = member => {
    setSelectedUser(member);
    setTimeout(() => userSheetRef.current?.present(), 100);
  };

  const handleSave = async (name, trait, imageUrl) => {
    await dispatch(
      modifyUserThunk({
        userId: selectedUser.userId,
        name,
        trait,
        image: imageUrl,
      }),
    );
    userSheetRef.current?.dismiss();
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <YellowSpinner />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* 노랑 배경 + 하단 곡선 */}
      <View style={styles.backgroundCurve} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
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
    // backgroundColor: '#FFF8E1', // 🔹 쨍한 노랑 → 아주 연한 노랑
  },
  scrollContent: {
    paddingBottom: getResponsiveHeight(40),
  },
  backgroundCurve: {
    position: 'absolute',
    bottom: -getResponsiveHeight(130), // 🔹 너무 아래까지 내려오지 않게 살짝 올림
    width: '220%', // 🔹 250 → 220 : 좀 더 자연스럽게
    left: '-60%',
    height: '100%',
    backgroundColor: '#F9F9F9', // 🔹 곡선은 완전 흰색
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
