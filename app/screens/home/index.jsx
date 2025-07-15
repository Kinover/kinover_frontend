import React, {useRef, useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {
  getFcmTokenAndSend,
  handleNotificationListeners,
} from './notification/requestNotificationPermission';
import FamilyCodeModal from './modal/familyCodeModal';
import UserBottomSheetModal from './userBottomSheet';

import {fetchFamilyThunk} from '../../redux/thunk/familyThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';
import {modifyUserThunk} from '../../redux/thunk/userThunk';

import useWebSocketStatus from '../../hooks/useWebSocketStatus';
import useFamilyStatusSocket from '../../hooks/useFamilyStatusSocket';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';

// 컴포넌트 분리
import HeaderSection from './headerSection';
import MemberGridSection from './memberGridSection';
import {requestNotificationPermission} from './notification/requestNotificationPermission';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const userSheetRef = useRef(null);

  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const onlineUserIds = useSelector(state => state.status.onlineUserIds);

  const [isVisible, setIsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const familyMembers = familyUserList.filter(m => m.userId !== user.userId);

  useEffect(() => {
    const fetchData = async () => {
      await requestNotificationPermission();
      await getFcmTokenAndSend(user.userId);
      handleNotificationListeners(); // FCM listener 등록도 여기에!
    };

    if (user?.userId) {
      fetchData();
    }
  }, [user.userId]);
  useWebSocketStatus(user.userId);
  useFamilyStatusSocket(family.familyId);

  useEffect(() => {
    if (user.userId && family.familyId) {
      dispatch(fetchFamilyThunk(family.familyId));
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, [dispatch, user.userId, family.familyId]);

  const handleUserPress = member => {
    setSelectedUser(member);
    setTimeout(() => userSheetRef.current?.present(), 100); // ✅ present()
  };

  const handleSave = async (name, description, imageUrl) => {
    await dispatch(
      modifyUserThunk({
        userId: selectedUser.userId,
        name,
        description,
        image: imageUrl,
      }),
    );
    userSheetRef.current?.dismiss(); // ✅ dismiss()
    setSelectedUser(null);
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.backgroundCurve} />

        <HeaderSection
          user={user}
          onUserPress={() => handleUserPress(user)}
          // onAddPress={() => setIsVisible(true)}
        />

        <MemberGridSection
          members={familyMembers}
          onlineUserIds={onlineUserIds}
          onUserPress={handleUserPress}
          onAddPress={() => setIsVisible(true)}
        />
      </SafeAreaView>

      <FamilyCodeModal
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        familyCode={family.familyId}
      />

      <UserBottomSheetModal
        ref={userSheetRef}
        index={isVisible ? 0 : -1}
        selectedUser={selectedUser}
        onSave={handleSave}
        onCancel={() => {
          setSelectedUser(null);
          userSheetRef.current?.dismiss();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    backgroundColor: '#FFC84D',
    paddingTop:
      Platform.OS === 'android'
        ? getResponsiveHeight(50)
        : -getResponsiveHeight(30),
  },
  backgroundCurve: {
    position: 'absolute',
    bottom: -getResponsiveHeight(90),
    width: '250%',
    left: '-75%',
    height: '100%',
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: getResponsiveWidth(600),
    borderTopRightRadius: getResponsiveWidth(600),
    zIndex: -1,
  },
});
