// src/features/home/screens/HomeScreen.jsx

import React, {useRef, useEffect, useState} from 'react';
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
// import SwipeNavigator from 'components/SwipeNavigator';

// 공통 가이드 훅 + 모달
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

  const {familyId, onlineUserIds, lastActiveMap} = useSelector(
    state => state.family,
  );

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
      dispatch(fetchFamilyStatusThunk(family.familyId));
    }
  }, [dispatch, user.userId, family.familyId]);

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

    // 🔹 실제 값이 있을 때만 image 필드 전송 → 빈 문자열로 기존 이미지 안 지움
    if (trimmedImage) {
      payload.image = trimmedImage;
    }

    console.log('🧾 modifyUserThunk payload =', payload);

    await dispatch(modifyUserThunk(payload));
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
    // <SwipeNavigator rightTo="소통" leftTo={null}>
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

      {/* 인앱 가이드 모달 (공통) */}
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
    // </SwipeNavigator>
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
