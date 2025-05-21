import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {launchImageLibrary} from 'react-native-image-picker';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {modifyUserThunk} from '../../redux/thunk/userThunk';
import {modifyFamilyUserThunk} from '../../redux/thunk/familyUserThunk';
import RNFS from 'react-native-fs';

import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {getPresignedUrls, uploadImageToS3} from '../../api/imageUrlApi';

export default function ProfileScreen({route}) {
  const {user} = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const stateUser = useSelector(state => state.user);

  const [editedName, setEditedName] = useState(user.name);
  const [editedBirth, setEditedBirth] = useState(
    (user.birth || '2000-00-00').split('T')[0],
  );
  const [editedImage, setEditedImage] = useState(
    user.image?.startsWith('http')
      ? user.image
      : `https://dzqa9jgkeds0b.cloudfront.net/${user.image}`,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const convertPhUriToFileUri = async (phUri, index) => {
    const destPath = `${
      RNFS.TemporaryDirectoryPath
    }photo_${Date.now()}_${index}.jpg`;
    try {
      await RNFS.copyAssetsFileIOS(phUri, destPath, 0, 0);
      return 'file://' + destPath;
    } catch (err) {
      console.error('📛 ph:// 변환 실패:', err.message);
      return null;
    }
  };

  const handleImagePick = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      const originalUri = selectedAsset.uri;
      const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';
      let fileName = selectedAsset.fileName || `img_${Date.now()}.jpg`;
      fileName = fileName.replace(CLOUD_FRONT, '');

      try {
        let fileUri = originalUri;
        if (Platform.OS === 'ios' && originalUri.startsWith('ph://')) {
          fileUri = await convertPhUriToFileUri(originalUri, 0);
          if (!fileUri) throw new Error('ph:// → file:// 변환 실패');
        }

        console.log('📸 최종 파일 URI:', fileUri);

        if (!fileUri) throw new Error('fileUri가 undefined입니다.');

        const presignedUrls = await getPresignedUrls([fileName]);
        const uploadUrl = presignedUrls[0];

        if (!uploadUrl) throw new Error('uploadUrl이 유효하지 않습니다.');

        await uploadImageToS3(uploadUrl, fileUri);

        const uploadedImageUrl = `${CLOUD_FRONT}${fileName}`;
        setEditedImage(uploadedImageUrl);
        console.log('✅ 최종 업로드된 이미지 URL:', uploadedImageUrl);
      } catch (err) {
        console.error('❌ 이미지 업로드 실패:', err.message);
        Alert.alert('업로드 실패', '이미지 업로드 중 문제가 발생했어요.');
      }
    }
  };

  const handleConfirm = () => {
    const payload = {
      userId: user.userId,
      name: editedName,
      birth: editedBirth,
      image: editedImage?.replace('https://dzqa9jgkeds0b.cloudfront.net/', ''),
    };

    if (user.userId === stateUser.userId) {
      dispatch(modifyUserThunk(payload));
    } else {
      dispatch(modifyFamilyUserThunk(payload));
    }

    Alert.alert('저장 완료', '프로필이 수정되었습니다.');
  };

  const handleCancel = () => {
    setEditedName(user.name);
    setEditedBirth((user.birth || '2000-00-00').split('T')[0]);
    setEditedImage(
      user.image?.startsWith('http')
        ? user.image
        : `https://dzqa9jgkeds0b.cloudfront.net/${user.image}`,
    );
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      setEditedBirth(iso);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundCurve} />
      <View style={styles.mainContainer}>
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
            <View style={styles.imageBlur} />
            <Image
              source={require('../../assets/images/pencil.png')}
              style={{
                position: 'absolute',
                top: '36%',
                width: getResponsiveWidth(25),
                height: getResponsiveHeight(25),
                zIndex: 80,
              }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.textContainer}>
          <ProfileField
            value={editedName}
            onChange={setEditedName}
            keyboardType="default"
            placeholder="이름을 입력하세요"
          />
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.textBox}>
            <Text style={[styles.input, {color: '#000'}]}>{editedBirth}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(editedBirth)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleConfirm}>
            <Text style={styles.buttonText}>저장</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleCancel}>
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const ProfileField = ({value, onChange, keyboardType, placeholder}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.textBox}>
      <TextInput
        style={[styles.input, {color: isFocused ? '#000' : '#999'}]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="#999"
      />
    </View>
  );
};

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
    zIndex: 10,
    position: 'absolute',
    width: getResponsiveWidth(110),
    height: getResponsiveHeight(110),
    borderRadius: getResponsiveIconSize(55),
    backgroundColor: 'gray',
    opacity: 0.5,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    gap: getResponsiveHeight(8),
    marginBottom: getResponsiveHeight(20),
  },
  textBox: {
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(35),
    borderRadius: getResponsiveIconSize(30),
    borderColor: '#FFC84D',
    borderWidth: getResponsiveIconSize(1),
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(10),
    backgroundColor: 'white',
  },
  input: {
    fontSize: getResponsiveFontSize(15),
    borderBottomWidth: 1,
    borderColor: '#FFC84D',
    paddingVertical: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: getResponsiveWidth(280),
    marginTop: getResponsiveHeight(20),
    gap: getResponsiveWidth(10),
  },
  button: {
    flex: 1,
    height: getResponsiveHeight(35),
    backgroundColor: 'white',
    borderRadius: getResponsiveIconSize(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {fontSize: getResponsiveFontSize(15)},
  cancelText: {
    fontSize: getResponsiveFontSize(15),
    color: 'black',
  },
});
