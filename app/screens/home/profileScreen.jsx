import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useSelector, useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {deleteToken} from '../../utils/storage';
// import { LOGOUT } from '../redux/actionTypes';
import {setLogout} from '../../redux/slices/authSlice';

import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {modifyUserThunk} from '../../redux/thunk/userThunk';

export default function ProfileScreen({route}) {
  const {user} = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedBirth, setEditedBirth] = useState(user.birth || '2000.00.00');
  const [editedImage, setEditedImage] = useState(user.image);

  const formatBirth = birth => {
    if (!birth) return '';
    return birth.split('T')[0].replace(/-/g, '.');
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '로그아웃하시겠습니까?',
      [
        {text: '취소', style: 'cancel'},
        {
          text: '확인',
          onPress: async () => {
            try {
              await deleteToken(); // ✅ 1. 토큰 삭제
              dispatch(setLogout()); // ✅ 2. 로그인 상태 false로 변경
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Auth',
                    state: {
                      index: 0,
                      routes: [{name: '온보딩화면'}],
                    },
                  },
                ],
              });
            } catch (error) {
              console.error('로그아웃 실패:', error);
            }
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleImagePick = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (result.assets && result.assets.length > 0) {
      setEditedImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    const updatedUser = {
      userId: user.userId,
      name: editedName,
      image: editedImage,
    };

    dispatch(modifyUserThunk(updatedUser));
    setIsEditing(false);
    Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
  };

  const handleCancel = () => {
    setEditedName(user.name);
    setEditedBirth(user.birth || '2000.00.00');
    setEditedImage(user.image);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundCurve} />

      <View style={styles.mainContainer}>
        {/* 프로필 사진 */}
        <View style={styles.topContainer}>
          <TouchableOpacity
            onPress={handleImagePick}
            style={styles.imageContainer}>
            <Image
              style={styles.image}
              source={{
                uri:
                  editedImage ||
                  'https://i.postimg.cc/hPMYQNhw/Ellipse-265.jpg',
              }}
            />
            {isEditing && (
              // <Image
              //   style={styles.camera}
              //   source={{
              //     uri: 'https://i.postimg.cc/TY8RKv89/Group-1171276560.png',
              //   }}
              // />
              <>
                <View style={styles.imageBlur} />
                <Image
                  source={require('../../assets/images/pencil.png')}
                  style={{
                    position: 'absolute',
                    top: '36%',
                    width: getResponsiveWidth(25),
                    height: getResponsiveHeight(25),
                  }}
                />
              </>
            )}
          </TouchableOpacity>

          {/* <Text
            style={{
              fontSize: getResponsiveFontSize(16),
              fontFamily: 'Pretendard-SemiBold',
            }}>
            {user.name}
          </Text> */}
        </View>

        {/* 프로필 정보 */}
        <View style={styles.textContainer}>
          <ProfileField
            label="이름"
            value={editedName}
            onChange={setEditedName}
            isEditing={isEditing}
          />
          <ProfileField
            label="생년월일"
            value={formatBirth(editedBirth)}
            onChange={setEditedBirth}
            isEditing={isEditing}
            keyboardType="numeric"
          />
          {/* <ProfileField label="아이디" value={user.email} isEditing={false} /> */}

          {isEditing ? (
            <View
              style={[styles.buttonRow, {marginTop: getResponsiveHeight(5)}]}>
              <TouchableOpacity
                style={[styles.halfButton, {backgroundColor: '#FFE099'}]}
                onPress={handleSave}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.halfButton, {backgroundColor: '#FFE099'}]}
                onPress={handleCancel}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, {marginTop: getResponsiveHeight(5)}]}
              onPress={() => setIsEditing(true)}>
              <Text style={styles.buttonText}>수정</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 로그아웃 & 회원탈퇴 */}
        {/* <View style={styles.bottomContainer}>
          <TouchableOpacity style={[styles.button]} onPress={handleLogout}>
            <Text style={styles.buttonText}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{color: 'gray'}}>회원탈퇴</Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </View>
  );
}

// 프로필 필드 컴포넌트
const ProfileField = ({label, value, onChange, isEditing, keyboardType}) => (
  <View style={styles.textBox}>
    <Text style={styles.sectorText}>{label}</Text>
    <Text style={styles.text}>|</Text>
    {isEditing && onChange ? (
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
      />
    ) : (
      <Text style={styles.text}>{value}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    zIndex: -2,
    paddingTop: getResponsiveHeight(120),
  },

  backgroundCurve: {
    position: 'absolute',
    bottom: 0,
    width: '170%',
    height: getResponsiveHeight(480),
    backgroundColor: '#FFC84D',
    borderTopLeftRadius: getResponsiveWidth(500),
    borderTopRightRadius: getResponsiveWidth(500),
    zIndex: -1,
  },

  mainContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(40),
  },
  topContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveHeight(20),
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
  },
  image: {
    width: getResponsiveWidth(110),
    height: getResponsiveHeight(110),
    borderRadius: getResponsiveIconSize(55),
  },

  imageBlur: {
    zIndex: 999,
    position: 'absolute',
    width: getResponsiveWidth(110),
    height: getResponsiveHeight(110),
    borderRadius: getResponsiveIconSize(55),
    backgroundColor: 'lightgray',
    opacity: 0.4,
  },
  camera: {
    position: 'absolute',
    width: getResponsiveIconSize(26),
    height: getResponsiveIconSize(26),
    top: 0,
    right: 0,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    gap: getResponsiveHeight(8),
    // marginTop: getResponsiveHeight(10),
  },
  textBox: {
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(35),
    borderRadius: getResponsiveIconSize(30),
    borderColor: '#FFC84D',
    borderWidth: getResponsiveIconSize(1),
    alignItems: 'center',
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    paddingHorizontal: getResponsiveWidth(10),
    backgroundColor: 'white',
  },
  sectorText: {
    width: getResponsiveWidth(60),
    fontSize: getResponsiveFontSize(15),
    textAlign: 'center',
  },
  text: {fontSize: getResponsiveFontSize(15)},
  input: {
    flex: 1,
    fontSize: getResponsiveFontSize(15),
    borderBottomWidth: 1,
    borderColor: '#FFC84D',
    paddingVertical: 2,
  },
  bottomContainer: {
    alignItems: 'center',
    gap: getResponsiveHeight(15),
    marginTop: getResponsiveHeight(13),
  },
  buttonRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(32),
    gap: getResponsiveWidth(10),
  },
  button: {
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(32),
    backgroundColor: 'white',
    borderRadius: getResponsiveIconSize(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfButton: {
    width: getResponsiveWidth(135),
    height: getResponsiveHeight(32),
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveIconSize(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {fontSize: getResponsiveFontSize(15)},
  cancelButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {color: 'black', fontSize: getResponsiveFontSize(15)},
});
