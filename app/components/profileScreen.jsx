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
import {deleteToken} from '../utils/storage';
import {
  LOGOUT,
  UPDATE_IMAGE,
  UPDATE_PROFILE,
} from '../redux/actions/actionTypes';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../utils/responsive';

export default function ProfileScreen() {
  const user = useSelector(state => state.user);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedBirth, setEditedBirth] = useState(user.birth || '2000.00.00');

  const handleLogout = async () => {
    try {
      await deleteToken();
      dispatch({type: LOGOUT, payload: 'false'});
      navigation.navigate('온보딩화면');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleImagePick = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (result.assets && result.assets.length > 0) {
      dispatch({type: UPDATE_IMAGE, payload: result.assets[0].uri});
    }
  };

  const handleSave = () => {
    // dispatch({
    //   type: UPDATE_PROFILE,
    //   payload: {name: editedName, birth: editedBirth},
    // });

    setIsEditing(false);
    Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
  };

  const handleCancel = () => {
    setEditedName(user.name);
    setEditedBirth(user.birth || '2000.00.00');
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        {/* 프로필 사진 */}
        <View style={styles.topContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity
                onPress={handleImagePick}
                style={styles.imageContainer}>
                <Image
                  style={styles.camera}
                  source={{
                    uri: 'https://i.postimg.cc/TY8RKv89/Group-1171276560.png',
                  }}
                />
              </TouchableOpacity>

              <Image
                style={styles.image}
                source={{
                  uri:
                    user.image ||
                    'https://i.postimg.cc/hPMYQNhw/Ellipse-265.jpg',
                }}
              />
            </>
          ) : (
            <Image
              style={styles.image}
              source={{
                uri:
                  user.image || 'https://i.postimg.cc/hPMYQNhw/Ellipse-265.jpg',
              }}
            />
          )}
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
            value={editedBirth}
            onChange={setEditedBirth}
            isEditing={isEditing}
            keyboardType="numeric"
          />
          <ProfileField label="아이디" value={user.email} isEditing={false} />

          {isEditing ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity> */}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, {backgroundColor: '#FFE099'}]}
              onPress={() => setIsEditing(true)}>
              <Text style={styles.buttonText}>수정</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 로그아웃 & 회원탈퇴 */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={{color: 'gray'}}>회원탈퇴</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: getResponsiveHeight(40),
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
    zIndex: 999,
  },
  image: {
    width: getResponsiveWidth(110),
    height: getResponsiveHeight(110),
    borderRadius: getResponsiveIconSize(55),
  },
  camera: {
    position: 'absolute',
    width: getResponsiveIconSize(26),
    height: getResponsiveIconSize(26),
    left: getResponsiveWidth(25),
    zIndex: 999,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    gap: getResponsiveHeight(12),
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
    marginTop: getResponsiveHeight(30),
  },
  button: {
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(32),
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveIconSize(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {fontSize: getResponsiveFontSize(15)},
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: getResponsiveWidth(280),
  },
  cancelButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: getResponsiveWidth(80),
    height: getResponsiveHeight(32),
  },
  cancelText: {color: 'gray', fontSize: getResponsiveFontSize(15)},
});
