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
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';

import {BottomSheetView} from '@gorhom/bottom-sheet';
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

  const CLOUD_FRONT = '';

  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.name || '');
      setDescription(selectedUser.description || '');
      setImageUrl(selectedUser.image || '');
    }
  }, [selectedUser]);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});

    if (result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      const originalUri = selectedAsset.uri;
      let fileName = selectedAsset.fileName || `img_${Date.now()}.jpg`;

      try {
        let fileUri = originalUri;

        // iOS: ph:// → file:// 복사
        if (Platform.OS === 'ios' && originalUri.startsWith('ph://')) {
          const destPath = `${
            RNFS.TemporaryDirectoryPath
          }photo_${Date.now()}.jpg`;
          await RNFS.copyAssetsFileIOS(originalUri, destPath, 0, 0);
          fileUri = 'file://' + destPath;
        }

        // Android: content:// → file:// 변환
        if (Platform.OS === 'android' && originalUri.startsWith('content://')) {
          const destPath = `${
            RNFS.TemporaryDirectoryPath
          }/photo_${Date.now()}.jpg`;
          const base64Data = await RNFS.readFile(originalUri, 'base64');
          await RNFS.writeFile(destPath, base64Data, 'base64');
          fileUri = 'file://' + destPath;
        }

        // fileName이 URL일 경우 CloudFront 도메인 제거
        if (fileName.startsWith(CLOUD_FRONT)) {
          fileName = fileName.replace(CLOUD_FRONT, '');
        } else if (fileName.startsWith('https://')) {
          fileName = fileName.replace(/^https?:\/\/[^/]+\//, '');
        }

        // presigned URL 받아오기 및 업로드
        const presignedUrls = await getPresignedUrls([fileName]);
        const uploadUrl = presignedUrls[0];
        await uploadImageToS3(uploadUrl, fileUri);

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
          zIndex: 100,
          position: 'absolute', // ✅ 이 줄 추가
          top: 0, // ✅ 이 줄 추가
          left: 0, // ✅ 이 줄 추가
          right: 0, // ✅ 이 줄 추가
          bottom: 0, // ✅ 이 줄 추가
        }}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close" // 배경 누르면 바텀시트 닫힘
            style={{
              ...StyleSheet.absoluteFillObject,
              zIndex: 0,
            }}
          />
        )}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <BottomSheetView style={styles.container}>
            <Image
              style={{
                position: 'absolute',
                width: '235%',
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
                  source={require('../../assets/images/pencil.png')}
                />
              </View>
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="이 사람을 한마디로 표현한다면?"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={onCancel}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => onSave(name, {trait: description}, imageUrl)}>
                <Text style={styles.buttonText}>저장</Text>
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
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    paddingVertical: getResponsiveHeight(20),
    paddingHorizontal: getResponsiveWidth(30),
  },
  profileimageContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveWidth(110),
    height: getResponsiveWidth(110),
    borderRadius: getResponsiveWidth(55),
    marginBottom: getResponsiveHeight(20),
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: getResponsiveWidth(55),
    resizeMode: 'cover',
  },
  profileImageOverlay: {
    position: 'absolute',
    backgroundColor: 'gray',
    opacity: 0.3,
    width: '100%',
    height: '100%',
    borderRadius: getResponsiveWidth(55),
  },
  profileImagePencil: {
    position: 'absolute',
    width: getResponsiveWidth(35),
    height: getResponsiveWidth(35),
    resizeMode: 'contain',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveHeight(15),
    gap: getResponsiveWidth(8),
  },
  label: {
    fontFamily: 'Pretendard-Medium',
    width: getResponsiveWidth(50),
    fontSize: getResponsiveFontSize(16),
    textAlignVertical: 'center',
    marginTop: getResponsiveHeight(8),
  },
  input: {
    fontFamily: 'Pretendard-Light',
    flex: 1,
    borderRadius: getResponsiveWidth(15),
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(10),
    fontSize: getResponsiveFontSize(16),
    backgroundColor: '#fff',
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
    borderRadius: getResponsiveWidth(10),
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(11.5),
  },
  buttonText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(14.5),
    textAlign: 'center',
  },
});
