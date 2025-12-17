// src/features/home/screens/HomeScreen.jsx
import React, {useRef, useEffect, useState, useCallback} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';

import FamilyCodeModal from '../components/FamilyCodeModal';
import UserBottomSheetModal from '../components/UserBottomSheet';

import {fetchFamilyThunk, fetchFamilyStatusThunk} from '../store/familyThunk';
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

import useGuide from 'hooks/useGuide';
import GuideModal from 'components/GuideModal';

const GUIDE_STORAGE_KEY = 'HOME_GUIDE_SHOWN_V1';

const GUIDE_STEPS = [
  {
    title: '프로필 카드',
    description:
      '상단의 프로필 카드를 눌러 자신의 이름, 한 줄 소개, 프로필 사진을 편집할 수 있어요.',
  },
  {
    title: '감정 상태 선택',
    description:
      '프로필 사진을 눌러 오늘의 감정을 선택하고 가족과 기분을 공유해보세요.',
  },
  {
    title: '접속 상태 확인',
    description:
      '가족이 현재 접속 중인지, 마지막으로 활동한 시간까지 한눈에 확인할 수 있어요.',
  },
  {
    title: '가족 정보 관리',
    description:
      '가족 카드를 눌러 구성원 정보를 수정하고, + 버튼으로 초대 코드를 공유할 수 있어요.',
  },
];

export default function HomeScreen() {
  const dispatch = useDispatch();
  const userSheetRef = useRef(null);

  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);

  const {onlineUserIds, lastActiveMap} = useSelector(state => state.family);

  const [isVisible, setIsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ 새로고침 로딩 상태 (멤버 영역 오버레이용)
  const [isRefreshingMembers, setIsRefreshingMembers] = useState(false);

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
      dispatch(fetchFamilyStatusThunk(family.familyId));
    }
  }, [dispatch, user.userId, family.familyId]);

  // ✅ 새로고침 버튼 핸들러: 멤버 영역에 로딩 띄우고, 끝나면 갱신
  const handleRefreshMembers = useCallback(async () => {
    if (!family?.familyId) return;
    if (isRefreshingMembers) return;

    try {
      setIsRefreshingMembers(true);

      // ✅ 여기서 “멤버 영역” 갱신에 필요한 것들만 갱신
      // - 멤버 리스트(가족 구성원)
      // - 온라인 상태/마지막 접속
      // - (선택) 가족 정보
      await dispatch(fetchFamilyUserListThunk(family.familyId));
      await dispatch(fetchFamilyStatusThunk(family.familyId));
      await dispatch(fetchFamilyThunk(family.familyId));
    } finally {
      setIsRefreshingMembers(false);
    }
  }, [dispatch, family?.familyId, isRefreshingMembers]);

  // 인앱 가이드 (공통 훅 사용)
  const guideEnabled = familyLoaded && membersLoaded;

  const {
    isGuideVisible,
    guideStep,
    currentGuide,
    totalSteps,
    nextStep,
    skipGuide,
  } = useGuide(GUIDE_STORAGE_KEY, GUIDE_STEPS, guideEnabled);

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

    // ✅ 저장 후 멤버 리스트도 최신화(선택)
    if (family?.familyId) {
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }

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
          // ✅ 추가: 새로고침 + 로딩 오버레이 제어
          onRefreshPress={handleRefreshMembers}
          isRefreshing={isRefreshingMembers}
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

      {/* 가이드 필요하면 주석 해제 */}
      {/* {currentGuide && (
        <GuideModal
          visible={isGuideVisible}
          step={guideStep}
          totalSteps={totalSteps}
          title={currentGuide.title}
          description={currentGuide.description}
          onNext={nextStep}
          onSkip={skipGuide}
        />
      )} */}
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
    height: getResponsiveHeight(200),
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
