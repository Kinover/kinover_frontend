import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import {KeyboardAvoidingView} from 'react-native';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../utils/responsive';
import {launchImageLibrary} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import {getPresignedUrls, uploadImageToS3} from '../../api/imageUrlApi';

export default function UserBottomSheet({
  sheetRef,
  selectedUser,
  isVisible,
  onSave,
  onCancel,
}) {
  const snapPoints = useMemo(() => ['60%'], []);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.name || '');
      setDescription(selectedUser.description || '');
      setImageUrl(
        selectedUser.image?.startsWith('http')
          ? selectedUser.image
          : `https://dzqa9jgkeds0b.cloudfront.net/${selectedUser.image}`,
      );
    }
  }, [selectedUser]);

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
          const destPath = `${
            RNFS.TemporaryDirectoryPath
          }photo_${Date.now()}.jpg`;
          await RNFS.copyAssetsFileIOS(originalUri, destPath, 0, 0);
          fileUri = 'file://' + destPath;
        }

        if (Platform.OS === 'android' && originalUri.startsWith('content://')) {
          const destPath = `${
            RNFS.TemporaryDirectoryPath
          }/photo_${Date.now()}.jpg`;
          const base64Data = await RNFS.readFile(originalUri, 'base64');
          await RNFS.writeFile(destPath, base64Data, 'base64');
          fileUri = 'file://' + destPath;
        }

        const presignedUrls = await getPresignedUrls([fileName]);
        const uploadUrl = presignedUrls[0];

        await uploadImageToS3(uploadUrl, fileUri); // 여기는 file:// 로 보장됨
        const uploadedImageUrl = `${CLOUD_FRONT}${fileName}`;
        setImageUrl(uploadedImageUrl);
      } catch (err) {
        console.error('❌ 이미지 업로드 실패:', err.message);
        Alert.alert('업로드 실패', '이미지 업로드 중 문제가 발생했어요.');
      }
    }
  };

  return (
    <>
      {isVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onCancel}
        />
      )}

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        handleComponent={() => null}
        backgroundStyle={{
          backgroundColor: 'transparent',
          zIndex: 5,
          elevation: 0,
        }}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // 필요시 - 값 조정
        >
          <BottomSheetView style={styles.container}>
            <Image
              style={{
                position: 'absolute',
                width: '250%',
                height: '130%',
                resizeMode: 'contain',
                right: '-58%',
                top: getResponsiveHeight(60),
              }}
              source={require('../../assets/images/curved-back.png')}
            />
            <TouchableOpacity onPress={handleImagePick}>
              <View style={styles.profileimageContainer}>
                <Image
                  source={
                    imageUrl
                      ? {uri: imageUrl}
                      : require('../../assets/images/default.png')
                  }
                  style={styles.profileImage}
                />
                <View style={styles.profileImageOverlay}></View>
                <Image
                  style={styles.profileImagePencil}
                  source={require('../../assets/images/pencil.png')}></Image>
              </View>
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>특징</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => onSave(name, description, imageUrl)}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={onCancel}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    paddingVertical: getResponsiveWidth(20),
    paddingHorizontal: getResponsiveWidth(50),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  profileimageContainer: {
    display: 'flex',
    position: 'relative',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveWidth(110),
    height: getResponsiveWidth(110),
    borderRadius: getResponsiveWidth(55),
    marginBottom: getResponsiveHeight(20),
  },
  profileImage: {
    position: 'absolute',
    width: getResponsiveWidth(110),
    height: getResponsiveWidth(110),
    borderRadius: getResponsiveWidth(55),
  },
  profileImagePencil: {
    position: 'absolute',
    width: getResponsiveWidth(35),
    height: getResponsiveWidth(35),
    objectFit: 'contain',
  },
  profileImageOverlay: {
    position: 'absolute',
    backgroundColor: 'gray',
    opacity: 0.3,
    width: getResponsiveWidth(110),
    height: getResponsiveWidth(110),
    borderRadius: getResponsiveWidth(55),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveHeight(15),
    gap: getResponsiveWidth(5),
  },
  label: {
    fontFamily: 'Pretendard-Medium',
    width: getResponsiveWidth(50),
    fontSize: getResponsiveFontSize(16),
    textAlignVertical: 'center',
    marginTop: 8,
  },
  input: {
    fontFamily: 'Pretendard-Light',
    flex: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: getResponsiveFontSize(16),
    backgroundColor: '#fff',
    shadowRadius: 1,
    shadowColor: 'gray',
    shadowOpacity: 0.7,
    shadowOffset: {width: 0, height: 1},
    elevation: 4,
  },

  textArea: {
    height: getResponsiveHeight(90),
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: getResponsiveHeight(20),
    gap: getResponsiveWidth(10),
  },
  button: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  buttonText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(14.5),
    textAlign: 'center',
  },
});
