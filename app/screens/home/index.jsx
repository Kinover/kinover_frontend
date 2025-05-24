import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
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
import CardSlider from './cardSlider';
import {SafeAreaView} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import FamilyNameModal from './familyNameModal';
import NoticeModal from './noticeModal';
import useWebSocketStatus from '../../hooks/useWebSocketStatus';
import {setOnlineUserIds} from '../../redux/slices/statusSlice';
import {getToken} from '../../utils/storage';
import useFamilyStatusSocket from '../../hooks/useFamilyStatusSocket';
import {requestPermission} from '@react-native-firebase/messaging';
import NoticeSlider from './noticeSlider';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const {familyUserList} = useSelector(state => state.userFamily);
  const navigation = useNavigation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState(family.familyName); // 텍스트필드용
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'userDelete' | 'familyName' | 'settings'
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedNotice, setSelectedNotice] = useState(null); // 💡 공지 선택용
  const onlineUserIds = useSelector(state => state.status.onlineUserIds);
  const notice = useSelector(state => state.familyNotice);
  // ⬇️ 추가: 접속중 유저 ID 목록 가져오기

  useWebSocketStatus(user.userId);
  useFamilyStatusSocket(family.familyId);

  // useEffect(() => {
  //     requestUserPermission();
  //   }, []);

  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const dummyData = [
    {
      id: 1,
      category: '공지',
      title: `${family.notice}`,
      image: require('../../assets/images/one.png'),
    },
    {
      id: 2,
      category: '다가오는 일정',
      title: '하루 한 끼 함께 먹기',
      image: require('../../assets/images/two.png'),
    },
    {
      id: 3,
      category: '어쩌구',
      title: '주말 산책 데이트',
      image: require('../../assets/images/three.png'),
    },
  ];

  useEffect(() => {
    if (user.userId !== null) {
      dispatch(fetchFamilyThunk('0e992098-1544-11f0-be5c-0a1e787a0cd7'));
      dispatch(
        fetchFamilyUserListThunk('0e992098-1544-11f0-be5c-0a1e787a0cd7'),
      );
      console.log(user.userId);
      console.log(user.image);
    }
  }, [dispatch, user]);

  return (
    <>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaView
          style={styles.container}
          edges={['top,bottom,left,right']}>
          <View style={styles.backgroundCurve} />

          <View style={styles.topContainer}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                height: 'auto',
              }}>
              <Text style={styles.familyName}>
                <Text
                  style={{
                    fontSize: getResponsiveFontSize(34),
                  }}>
                  {`${family.name} `}
                </Text>
                패밀리
              </Text>
            </View>

            <TouchableOpacity style={styles.familyDeleteButton}>
              <Text style={styles.familyDeleteButtonText}>{'가족명 변경'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setModalType('familyName');
                setFamilyNameInput(family.name);
                setModalVisible(true);
              }}>
              <Image
                source={require('../../assets/images/name_setting.png')}
                style={styles.settingIcon}
              />
            </TouchableOpacity>
          </View>

          {/* <View style={{display:'flex',flexDirection:'row',justifyContent:'flex-start',alignItems:'flex-start',width:'90%'}}> */}
          <View
            style={styles.headerContainer}
            onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
            {containerWidth > 0 && (
              <NoticeSlider
                data={dummyData}
                onPress={item => {
                  setSelectedNotice(item);
                  setModalType('notice');
                  setModalVisible(true);
                }}
              />
            )}
          </View>
          {/* </View> */}

          <View style={styles.bodyContainer}>
            {familyUserList && familyUserList.length > 0 ? (
              chunkArray(
                (familyUserList || []).filter(member => member && member.name),
                3,
              ).map((row, rowIndex) => (
                <View key={rowIndex} style={styles.bodyContainerRow}>
                  {row.map((member, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.user}
                      disabled={!isEditMode}
                      onPress={() => {
                        setIsEditMode(false);
                        navigation.navigate('프로필화면', {user: member});
                      }}>
                      <Image
                        source={{uri: member.image}}
                        style={styles.userImage}
                      />
                      {onlineUserIds.includes(member.userId) && (
                        <View style={styles.onlineDot} />
                      )}
                      {isEditMode && (
                        <>
                          <View
                            style={[
                              styles.userImage,
                              {
                                position: 'absolute',
                                opacity: 0.5,
                                backgroundColor: 'gray',
                              },
                            ]}></View>
                          <Image
                            source={require('../../assets/images/pencil.png')}
                            style={{
                              position: 'absolute',
                              top: getResponsiveHeight(25),
                              width: getResponsiveWidth(20),
                              height: getResponsiveHeight(20),
                              zIndex: 999,
                            }}
                          />
                        </>
                      )}

                      <Text style={styles.userName}>{member.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            ) : (
              <Text style={{fontSize: getResponsiveFontSize(13)}}>
                가족 구성원이 없습니다.
              </Text>
            )}

            <TouchableOpacity
              onPress={() => setIsEditMode(prev => !prev)}
              style={[
                styles.userChangeButton,
                {
                  backgroundColor: '#FFC84D',
                  uri: 'https://i.postimg.cc/k4Y5q6LQ/Group-1171276579.png',
                },
              ]}>
              {isEditMode ? (
                <Text
                  style={{
                    fontSize: getResponsiveFontSize(15),
                    fontFamily: 'Pretendard-Regular',
                  }}>
                  변경 완료하기
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: getResponsiveFontSize(14),
                    fontFamily: 'Pretendard-Regular',
                  }}>
                  프로필 편집
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
      {modalType === 'familyName' && (
        <FamilyNameModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          family={family}
          familyNameInput={familyNameInput}
          setFamilyNameInput={setFamilyNameInput}
          content={
            <View style={{gap: getResponsiveHeight(15)}}>
              <Text
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: getResponsiveFontSize(20),
                  marginTop: getResponsiveHeight(10),
                }}>
                {`'${family.name}'`} 패밀리 님,{'\n'}가족명을 변경하시겠습니까?
              </Text>
              <View
                style={{
                  width: '100%',
                  height: getResponsiveHeight(40),
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  justifyContent: 'center',
                }}>
                <TextInput
                  value={familyNameInput}
                  onChangeText={setFamilyNameInput}
                  style={{
                    fontSize: getResponsiveFontSize(15),
                    fontFamily: 'Pretendard-Regular',
                    color: '#000',
                  }}
                  placeholder="가족명을 입력하세요"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          }
        />
      )}
      {modalType === 'notice' && selectedNotice && (
        <NoticeModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onConfirm={() => {
            // 저장 처리
            console.log('변경된 공지:', selectedNotice);
            setModalVisible(false);
          }}
          content={
            <View style={{gap: getResponsiveHeight(15)}}>
              <Text
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: getResponsiveFontSize(20),
                  marginTop: getResponsiveHeight(10),
                  textAlign: 'center',
                }}>
                공지 수정하기
              </Text>
              <TextInput
                value={selectedNotice?.title ?? ''}
                onChangeText={text =>
                  setSelectedNotice(prev => ({...prev, title: text}))
                }
                style={{
                  fontSize: getResponsiveFontSize(15),
                  fontFamily: 'Pretendard-Regular',
                  color: '#000',
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  height: getResponsiveHeight(80),
                  textAlignVertical: 'top', // ✅ 텍스트 위쪽부터 시작
                }}
                placeholder="공지 내용을 입력하세요"
                placeholderTextColor="#999"
                multiline={true} // ✅ 여러 줄 입력 가능하게
              />
            </View>
          }
        />
      )}
    </>
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
    flexDirection: 'row',
    position: 'relative',
    justifyContent: 'center',
    width: '100%',
    height: '23%',
    // borderRadius: getResponsiveIconSize(20),
    // // ⭐ 추가: 그림자
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 0.5,
    elevation: 5, // ✅ Android에서는 이거 필수
  },

  bodyContainer: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    backgroundColor: 'white',
    // width: '90%',
    height: '65%',
    borderRadius: getResponsiveIconSize(20),
    paddingHorizontal: '8%',
    paddingVertical: getResponsiveHeight(28),
    gap: getResponsiveHeight(15),
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
    height: getResponsiveHeight(74),
    borderRadius: getResponsiveIconSize(37),
    resizeMode: 'cover',
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
    height: '87%',
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
    zIndex: 999,
  },
});
