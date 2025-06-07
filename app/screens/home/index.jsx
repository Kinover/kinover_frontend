import React, {useRef, useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {KeyboardAvoidingView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {fetchFamilyThunk} from '../../redux/thunk/familyThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';
import {setOnlineUserIds} from '../../redux/slices/statusSlice';

import useWebSocketStatus from '../../hooks/useWebSocketStatus';
import useFamilyStatusSocket from '../../hooks/useFamilyStatusSocket';

import UserBottomSheet from './userBottomSheet';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const userSheetRef = useRef(null);

  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const onlineUserIds = useSelector(state => state.status.onlineUserIds);
  const lastActiveMap = useSelector(state => state.status.lastActiveMap || {});

  const [selectedUser, setSelectedUser] = useState(null);

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
    setTimeout(() => {
      userSheetRef.current?.snapToIndex(0);
    }, 100);
  };

  const chunkArray = useCallback((arr, size) => {
    return Array.from({length: Math.ceil(arr.length / size)}, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }, []);

  const renderUser = (member, index) => {
    const isOnline = onlineUserIds.includes(member.userId);
    return (
      <TouchableOpacity
        key={index}
        style={styles.user}
        onPress={() => handleUserPress(member)}>
        <Image source={{uri: member.image}} style={styles.userImage} />
        {isOnline && <View style={styles.onlineDot} />}
        <Text style={styles.userName}>{member.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.backgroundCurve} />

        <View style={styles.headerContainer}>
          <View style={{width: 'auto', position: 'relative'}}>
            <TouchableOpacity onPress={() => handleUserPress(user)}>
              <Image
                src={user.image}
                style={styles.profileImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Image
              style={styles.stateIcon}
              source={require('../../assets/images/state-2.png')}
            />
          </View>

          <Text style={styles.userNameHeader}>{user.name}</Text>
        </View>

        <View style={styles.bodyContainer}>
          {familyUserList && familyUserList.length > 0 ? (
            chunkArray(
              familyUserList.filter(m => m.userId !== user.userId),
              3,
            ).map((row, idx) => (
              <View key={idx} style={styles.bodyContainerRow}>
                {row.map(renderUser)}
              </View>
            ))
          ) : (
            <Text style={styles.noUserText}>가족 구성원이 없습니다.</Text>
          )}
        </View>
      </SafeAreaView>
      
      <UserBottomSheet
        sheetRef={userSheetRef}
        selectedUser={selectedUser}
        isVisible={!!selectedUser}
        onSave={(name, desc) => console.log('✅ 저장됨', name, desc)}
        onCancel={() => {
          setSelectedUser(null);
          userSheetRef.current?.close();
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC84D',
    paddingTop: getResponsiveHeight(35),
  },
  headerContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(30),
  },
  profileImage: {
    width: getResponsiveIconSize(170),
    height: getResponsiveIconSize(170),
    borderRadius: getResponsiveWidth(85),
  },
  stateIcon: {
    position: 'absolute',
    width: getResponsiveIconSize(40),
    height: getResponsiveIconSize(40),
    borderRadius: getResponsiveIconSize(20),
    right: getResponsiveWidth(0),
    bottom: getResponsiveHeight(8),
  },
  userNameHeader: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(22),
    marginTop: getResponsiveHeight(15),
  },
  bodyContainer: {
    backgroundColor: 'white',
    borderRadius: getResponsiveIconSize(20),
    paddingHorizontal: '8%',
    paddingVertical: getResponsiveHeight(32),
    marginHorizontal: '5%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 2,
    gap: getResponsiveHeight(25),
  },
  bodyContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  user: {
    alignItems: 'center',
    gap: getResponsiveHeight(10),
  },
  userImage: {
    width: getResponsiveWidth(74),
    height: getResponsiveWidth(74),
    borderRadius: getResponsiveWidth(37),
  },
  userName: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: 'black',
  },
  noUserText: {
    fontSize: getResponsiveFontSize(13),
  },
  backgroundCurve: {
    position: 'absolute',
    bottom: 0,
    width: '250%',
    left: '-75%',
    height: '85%',
    backgroundColor: '#FFFAF0',
    borderTopLeftRadius: getResponsiveWidth(600),
    borderTopRightRadius: getResponsiveWidth(600),
    zIndex: -1,
  },
  onlineDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#29D697',
    borderColor: 'white',
    borderWidth: 2,
  },
});
