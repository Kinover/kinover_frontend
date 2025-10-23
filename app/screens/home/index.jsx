import React, {useRef, useEffect, useState} from 'react';
import {View, StyleSheet, Platform, ScrollView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import FamilyCodeModal from './modal/familyCodeModal';
import UserBottomSheetModal from './shared/userBottomSheet';

import {fetchFamilyThunk} from '../../redux/thunk/familyThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';
import {modifyUserThunk} from '../../redux/thunk/userThunk';

import {getResponsiveWidth, getResponsiveHeight} from '../../utils/responsive';

// 컴포넌트 분리
import HeaderSection from './shared/headerSection';
import MemberGridSection from './shared/memberGridSection';
import YellowSpinner from '../../components/common/yellowSpinner';
import {
  requestNotificationPermission,
  getFcmTokenAndSend,
  handleNotificationListeners,
} from '../../utils/notification/requestNotificationPermission';
import useWebSocketStatus from '../../hooks/family/useWebSocketStatus';
import useFamilyStatusSocket from '../../hooks/family/useFamilyStatusSocket';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const userSheetRef = useRef(null);

  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const onlineUserIds = useSelector(state => state.status.onlineUserIds);
  console.log('홈화면 온라인유저아이디 배열', onlineUserIds);
  const lastActiveMap = useSelector(state => state.family.lastActiveMap);
  console.log('홈화면 최종접속 배열', lastActiveMap);

  const [isVisible, setIsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const familyLoaded = !!family?.familyId;
  const membersLoaded = familyUserList.length > 0;

  const isLoading = !familyLoaded || !membersLoaded;

  const familyMembers = familyUserList.filter(m => m.userId !== user.userId);

  /**
   * 🔔 알림 리스너: 앱 시작 시 1회 등록, 언마운트 시 해제
   * (handleNotificationListeners가 unsubscribe 함수를 반환해야 함)
   */
  useEffect(() => {
    const unsubscribe = handleNotificationListeners();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  /**
   * 🔑 권한 요청 → FCM 토큰 발급/전송
   * userId가 있을 때만 실행
   */
  useEffect(() => {
    if (!user?.userId) return;

    let mounted = true;
    (async () => {
      const granted = await requestNotificationPermission();
      if (!mounted) return;
      if (granted) {
        await getFcmTokenAndSend(user.userId); // 서버가 userId 받으면 함께 전송
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          width: '100%',
          height: '100%',
          paddingBottom: getResponsiveHeight(20),
        }}>
        <View style={styles.backgroundCurve} />

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
    height: '100%',
    width: '100%',
    backgroundColor: '#FFC84D',
  },
  backgroundCurve: {
    position: 'absolute',
    bottom: -getResponsiveHeight(130),
    width: '250%',
    left: '-75%',
    height: '100%',
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: getResponsiveWidth(600),
    borderTopRightRadius: getResponsiveWidth(600),
    zIndex: -1,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFC84D', // 기존 배경색
    justifyContent: 'center',
    alignItems: 'center',
  },
});
