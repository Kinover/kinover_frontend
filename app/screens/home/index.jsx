import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
} from '../../utils/responsive';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {fetchFamilyThunk} from '../../redux/thunk/familyThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import useWebSocketStatus from '../../hooks/useWebSocketStatus';
import {setOnlineUserIds} from '../../redux/slices/statusSlice';
import {getToken} from '../../utils/storage';
import useFamilyStatusSocket from '../../hooks/useFamilyStatusSocket';
import {requestPermission} from '@react-native-firebase/messaging';
import NoticeSlider from './noticeSlider';
import UserBottomSheet from './userBottomSheet';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const userSheetRef = useRef(null); // ✅ 바텀시트 참조 생성
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const {familyUserList} = useSelector(state => state.userFamily);
  const navigation = useNavigation();
  const [containerWidth, setContainerWidth] = useState(0);
  // ⬇️ 추가: 접속중 유저 ID 목록 가져오기
  const [selectedUser, setSelectedUser] = useState(null);
  const onlineUserIds = useSelector(state => state.status.onlineUserIds);
  const lastActiveMap = useSelector(state => state.status.lastActiveMap || {});

  useWebSocketStatus(user.userId);
  useFamilyStatusSocket(family.familyId);

  // useEffect(() => {
  //     requestUserPermission();
  //   }, []);

  const handleUserPress = member => {
    console.log('👆 유저 클릭됨:', member); // ✅ 로그 추가
    setSelectedUser(member);
  };

  useEffect(() => {
    if (selectedUser && userSheetRef.current) {
      console.log('📦 바텀시트 열기 시도함 (snapToIndex(0))'); // ✅ 로그 추가

      userSheetRef.current?.snapToIndex(0);
    }
  }, [selectedUser]);

  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  useEffect(() => {
    if (user.userId !== null) {
      dispatch(fetchFamilyThunk(family.familyId));
      dispatch(fetchFamilyUserListThunk(family.familyId));
      console.log(user.userId);
      console.log(user.image);
    }
  }, [dispatch, user]);

  return (
    // <>
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaView
        style={styles.container}
        edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.backgroundCurve} />

        <View
          style={styles.headerContainer}
          onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
          <View style={{position: 'relative'}}>
            <TouchableOpacity onPress={() => handleUserPress(user)}>
              <Image
                src={user.image}
                style={{
                  width: getResponsiveWidth(150),
                  height: getResponsiveWidth(150),
                  borderRadius: getResponsiveWidth(75),
                  resizeMode: 'cover',
                }}></Image>
            </TouchableOpacity>

            <Image
              style={{
                position: 'absolute',
                width: getResponsiveWidth(40),
                height: getResponsiveHeight(40),
                right: getResponsiveWidth(-8),
                bottom: getResponsiveHeight(8),
                resizeMode: 'contain',
              }}
              source={require('../../assets/images/state-2.png')}></Image>
          </View>
          <Text
            style={{
              fontFamily: 'Pretendard-Light',
              fontSize: getResponsiveFontSize(22),
              marginTop: getResponsiveHeight(15),
            }}>
            {user.name}
          </Text>
        </View>
        {/* </View> */}

        <View style={styles.bodyContainer}>
          {familyUserList && familyUserList.length > 0 ? (
            chunkArray(
              (familyUserList || []).filter(
                member =>
                  member && member.name && member.userId !== user.userId,
              ),
              3,
            ).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.bodyContainerRow}>
                {row.map((member, index) => {
                  const isOnline = onlineUserIds.includes(member.userId);
                  const lastActive = lastActiveMap[member.userId];

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.user}
                      // disabled={!isEditMode}
                      onPress={() => handleUserPress(member)}>
                      <Image
                        source={{uri: member.image}}
                        style={styles.userImage}
                      />
                      {onlineUserIds.includes(member.userId) && (
                        <View style={styles.onlineDot} />
                      )}
                      <Text style={styles.userName}>{member.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={{fontSize: getResponsiveFontSize(13)}}>
              가족 구성원이 없습니다.
            </Text>
          )}
        </View>
      </SafeAreaView>

      <UserBottomSheet
        sheetRef={userSheetRef}
        selectedUser={selectedUser}
        onSave={(name, desc) => {
          console.log('✅ 저장됨', name, desc);
          // userSheetRef.current?.close();
        }}
        onCancel={() => userSheetRef.current?.close()}
      />
    </GestureHandlerRootView>
    // {/* </> */}
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    // alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    backgroundColor: '#FFC84D',
    paddingTop: getResponsiveHeight(30),
    gap: '2%',
    paddingBottom: getResponsiveHeight(10),
  },

  topContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: getResponsiveWidth(10),
    marginHorizontal: getResponsiveWidth(30),
  },

  familyName: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(22),
  },

  settingIcon: {
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    bottom: getResponsiveHeight(5),
    resizeMode: 'contain',
    marginLeft: getResponsiveWidth(-5),
  },

  familyDeleteButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: getResponsiveWidth(5),
    width: getResponsiveWidth(53),
    width:
      Platform.OS === 'android'
        ? getResponsiveWidth(57)
        : getResponsiveWidth(53),

    height: getResponsiveHeight(22),
  },

  familyDeleteButtonText: {
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(11.5),
    color: 'white',
  },

  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '30%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 0.5,
    elevation: 5, // ✅ Android에서는 이거 필수
    marginBottom: getResponsiveHeight(25),
  },

  bodyContainer: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    backgroundColor: 'white',
    // width: '90%',
    height: 'auto',
    borderRadius: getResponsiveIconSize(20),
    paddingHorizontal: '8%',
    paddingVertical: getResponsiveHeight(32),
    gap: getResponsiveHeight(25),
    marginHorizontal: '5%',

    // ⭐ 추가: 그림자
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 5, // ✅ Android에서는 이거 필수
  },

  bodyContainerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 'auto',
  },

  user: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: getResponsiveHeight(10),
  },

  userImage: {
    width: getResponsiveWidth(74),
    height: getResponsiveWidth(74),
    borderRadius: getResponsiveWidth(37),
    // resizeMode: 'contain',
    objectFit: 'cover',
  },

  userName: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: 'black',
  },

  userChangeButton: {
    position: 'absolute',
    width: getResponsiveWidth(285.1),
    height: getResponsiveHeight(40.81),
    backgroundColor: '#EFEFEF',
    borderRadius: getResponsiveIconSize(10),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: getResponsiveHeight(20), // ✅ 아래에서 20px 떠 있음
    left: getResponsiveWidth(35), //
  },

  backgroundCurve: {
    position: 'absolute',
    bottom: 0,
    width: '250%',
    left: '-75%',
    height: '90%',
    backgroundColor: '#FFFAF0',
    borderTopLeftRadius: getResponsiveWidth(600),
    borderTopRightRadius: getResponsiveWidth(600),
    zIndex: 0,
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
    // zIndex: 999,
  },
});
