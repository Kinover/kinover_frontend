import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
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
  onSave,
  onCancel,
}) {
  const snapPoints = useMemo(() => ['60%'], []);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isVisible, setIsVisible] = useState(false); // 🟡 오버레이 제어용 상태
  const [imageUrl, setImageUrl] = useState(
    selectedUser?.image?.startsWith('http')
      ? selectedUser.image
      : `https://dzqa9jgkeds0b.cloudfront.net/${selectedUser?.image}`,
  );
  useEffect(() => {
    if (selectedUser) {
      setName(selectedUser.name || '');
      setDescription(selectedUser.description || '');
      setImageUrl(
        selectedUser.image?.startsWith('http')
          ? selectedUser.image
          : `https://dzqa9jgkeds0b.cloudfront.net/${selectedUser.image}`,
      );
      //   setIsVisible(true);
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

  const handleClose = () => {
    setIsVisible(false); // ✅ 닫을 때 오버레이 제거
    onCancel(); // 상위에서 snapToIndex(-1) 호출
  };

  useEffect(() => {
    console.log('🟡 바텀시트에 전달된 selectedUser:', selectedUser);
    setIsVisible(true); // ✅ 여기 추가!!
  }, [selectedUser]);

  return (
    <>
      {isVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose} // 배경 누르면 닫기
        />
      )}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        initialSnapIndex={0} // 기본적으로 75%로 시작
        snapPoints={snapPoints}
        enablePanDownToClose
        handleComponent={() => null}
        backgroundStyle={{
          // backgroundColor: '#FFCC40',
          backgroundColor: 'transparent',
          zIndex: 9999, // ✅ 추가
          elevation: 20, // ✅ Android에서 위로 띄우기
        }}>
        <BottomSheetView style={styles.container}>
          {/* <View style={styles.curvedBackground}/> */}
          <Image
            style={{
              position: 'absolute',
              width: '250%',
              height: '130%',
              resizeMode: 'contain',
              right: '-58%',
              top: getResponsiveHeight(60),
            }}
            source={require('../../assets/images/curved-back.png')}></Image>
          <TouchableOpacity onPress={handleImagePick}>
            <Image
              source={
                selectedUser?.image
                  ? {uri: selectedUser.image}
                  : require('../../assets/images/kino-yellow.png')
              }
              style={styles.profileImage}
            />
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
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
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
  curvedBackground: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: '300',
    backgroundColor: '#FFC84D',
    borderTopLeftRadius: 500,
    borderTopRightRadius: 500,
    // borderTopEndRadius:10000,
    // width:
  },
  profileImage: {
    alignSelf: 'center',
    width: getResponsiveWidth(110),
    height: getResponsiveWidth(110),
    borderRadius: getResponsiveWidth(55),
    marginBottom: getResponsiveHeight(20),
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
  },
  textArea: {
    fontFamily: 'Pretendard-Light',
    height: getResponsiveHeight(90),
    textAlignVertical: 'top',
  },
  buttonRow: {
    // flex:1,
    display: 'flex',
    width: '100%',
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
    width: 'auto',
  },
  buttonText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(14.5),
    textAlign: 'center',
  },
});
