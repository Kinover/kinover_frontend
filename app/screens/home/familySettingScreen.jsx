import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import FamilyNameModal from './modal/familyNameModal/index';
import UserDeleteModal from './modal/userDeleteModal';
import UserAddBottomSheet from './userAddBottomSheet';

export const relationshipMapKoreanToEnglish = {
  '어색한 사이': 'AWKWARD_START',
  '알아가는 사이': 'GETTING_TO_KNOW',
  '다가가는 사이': 'GENTLE_APPROACH',
  '편안한 사이': 'COMFORTABLE_DISTANCE',
  '진심을 나누는 사이': 'SHARING_HEARTS',
  '단단한 사이': 'SOLID_BOND',
  '믿음의 사이': 'FAMILY_OF_TRUST',
  '하나된 사이': 'UNIFIED_HEARTS',
};

export default function FamilySettingScreen() {
  const family = useSelector(state => state.family);
  const {familyUserList} = useSelector(state => state.userFamily);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'userDelete' | 'familyName' | 'settings'
  const [familyNameInput, setFamilyNameInput] = useState(family.familyName); // 텍스트필드용
  const [willDeleteUser, setWillDeleteUser] = useState('');
  const [willModifyUser, setWillModifyUser] = useState('');

  const [screenHeight, setScreenHeight] = useState(null);

  const dispatch = useDispatch();

  return (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <View
        style={styles.container}
        onLayout={event => {
          const {height} = event.nativeEvent.layout;
          setScreenHeight(height);
        }}>
        <View style={styles.topContainer}>
          <Text style={styles.title}>{family.name} 패밀리</Text>
          <TouchableOpacity
            onPress={() => {
              setModalType('familyName');
              setFamilyNameInput(family.name);
              setModalVisible(true);
            }}>
            <Image
              source={{
                uri: 'https://i.postimg.cc/3JsdkGN9/Group-1171276578.png',
              }}
              style={styles.settingIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.familyDeleteButton}>
            <Text style={styles.familyDeleteButtonText}>{'가족 삭제'}</Text>
            <Image
              style={{
                width: getResponsiveWidth(6),
                height: getResponsiveHeight(13),
                resizeMode: 'contain',
              }}
              source={{uri: 'https://i.postimg.cc/Wz1KMSpZ/Vector-12.png'}}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={[styles.button, {height: getResponsiveHeight(60.81)}]}>
            <Text
              style={{
                fontFamily: 'Pretendard-Regular',
                textAlign: 'center',
                fontSize: getResponsiveFontSize(15),
              }}>
              가족 코드
              <Text
                style={{
                  fontSize: getResponsiveFontSize(13),
                }}>{`\n${family.familyId}`}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: '#FFC84D'}]}>
            <Text
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: getResponsiveFontSize(15),
              }}>
              가족 초대하고 추억 쌓기
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mainContainer}>
          {familyUserList.map((user, index) => (
            <View key={index} style={styles.userWrapper}>
              <TouchableOpacity
                style={styles.userButton}
                onPress={() => {
                  if (isEditMode) {
                    setModalType('user');
                    setWillModifyUser(user);
                    setModalVisible(true); // ✅ editMode일 때만 작동
                  }
                }}>
                <Image style={styles.userButton} source={{uri: user.image}} />
                {isEditMode && (
                  <TouchableOpacity
                    onPress={() => {
                      setModalType('userDelete');
                      setWillDeleteUser(user);
                      setModalVisible(true);
                    }}
                    style={styles.userDeleteIcon}>
                    <Image
                      source={{
                        uri: 'https://i.postimg.cc/s2cXH0c0/Group-1171276580.png',
                      }}
                      style={styles.userDeleteIcon}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
          ))}

          {isEditMode ? (
            <View style={styles.userAddWrapper}>
              <TouchableOpacity>
                <Image
                  source={{
                    uri: 'https://i.postimg.cc/k4Y5q6LQ/Group-1171276579.png',
                  }}
                  style={styles.userAddImageButton}
                />
              </TouchableOpacity>
              <Text style={styles.userName}>가족 추가</Text>
            </View>
          ) : (
            <></>
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
                  fontSize: getResponsiveFontSize(15),
                  fontFamily: 'Pretendard-Regular',
                }}>
                가족 구성원 변경
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {/* ✅ 커스텀 모달 사용 */}
        {modalType === 'familyName' && (
          <FamilyNameModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            family={family}
            familyNameInput={familyNameInput}
            setFamilyNameInput={setFamilyNameInput}
          />
        )}
        {modalType === 'userDelete' && (
          <UserDeleteModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            user={willDeleteUser}
          />
        )}
      </View>
      {modalType === 'user' && modalVisible && (
        <UserAddBottomSheet
          onClose={() => setModalVisible(false)}
          user={willModifyUser}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
    zIndex: 10,
    position: 'relative',
  },

  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFF8E9',
    paddingTop: getResponsiveHeight(30),
    paddingHorizontal: getResponsiveWidth(30),
    gap: getResponsiveHeight(20),
  },

  topContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: getResponsiveWidth(10),
  },

  title: {
    fontSize: getResponsiveFontSize(20.5),
    fontFamily: 'Pretendard-SemiBold',
  },

  modifyButton: {},

  familyDeleteButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveWidth(5),
    width: getResponsiveWidth(90),
    height: getResponsiveHeight(20),
  },

  familyDeleteButtonText: {
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(11),
    color: '#FFC84D',
  },

  headerContainer: {
    width: getResponsiveWidth(341.91),
    // height: getResponsiveHeight(130.13),
    borderRadius: getResponsiveIconSize(20),
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveHeight(10),
    paddingVertical: getResponsiveHeight(20),

    borderWidth: 1,
    borderColor: '#00000040', // 반투명 블랙
    shadowColor: '#000', // 그림자
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 8, // Android용
  },

  button: {
    width: getResponsiveWidth(285.1),
    height: getResponsiveHeight(40.81),
    backgroundColor: '#EFEFEF',
    borderRadius: getResponsiveIconSize(10),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainContainer: {
    position: 'relative',
    width: getResponsiveWidth(341.91),
    height: getResponsiveHeight(419.32),
    borderRadius: getResponsiveIconSize(20),
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'row', // 🔄 row로 변경
    flexWrap: 'wrap', // ✅ 줄바꿈 가능하게
    justifyContent: 'center',
    alignItems: 'flex-start', // ✅ 위쪽 기준으로 정렬
    paddingHorizontal: getResponsiveWidth(20), // ✅ 좌우 패딩 약간 주면 좋아
    paddingVertical: getResponsiveHeight(20),
    rowGap: getResponsiveHeight(20), // ✅ 세로 간격
    columnGap: getResponsiveWidth(28), // ✅ 가로 간격
    borderWidth: 1,
    borderColor: '#00000040',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 8,
  },

  userButton: {
    width: getResponsiveWidth(75),
    height: getResponsiveHeight(75),
    borderRadius: getResponsiveIconSize(36.5),
    resizeMode: 'cover',
  },

  userWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveHeight(10),
  },

  userName: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#333',
    textAlign: 'center',
  },

  userAddButton: {
    width: getResponsiveWidth(75),
    height: getResponsiveHeight(75),
    borderRadius: getResponsiveIconSize(36.5),
    borderWidth: getResponsiveIconSize(2),
    borderStyle: 'dotted',
    resizeMode: 'cover',
  },
  userAddWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveHeight(10),
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
  },

  settingIcon: {
    width: getResponsiveIconSize(24),
    height: getResponsiveIconSize(24),
    resizeMode: 'contain',
  },

  userDeleteIcon: {
    position: 'absolute',
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    top: 2,
    right: -2,
    zIndex: 100,
  },

  userAddImageButton: {
    width: getResponsiveWidth(75),
    height: getResponsiveHeight(75),
    resizeMode: 'contain',
  },
});
