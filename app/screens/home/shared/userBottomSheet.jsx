import React, {useState, useEffect, useRef, useImperativeHandle} from 'react';
import {forwardRef} from 'react';
import {Keyboard, TouchableWithoutFeedback} from 'react-native';
import {
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
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
import {BottomSheetModal,BottomSheetView, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {launchImageLibrary} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import getResponsiveFontSize, {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';

import {getPresignedUrls, uploadImageToS3} from '../../../api/imageUrlApi';

const UserBottomSheetModal = forwardRef(
  ({selectedUser, onSave, onCancel}, ref) => {
    const snapPoints = ['85%'];
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [trait, setTrait] = useState('');
    const localRef = useRef(null);
    const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/'; // CloudFront 주소 입력

    useImperativeHandle(ref, () => ({
      present: () => localRef.current?.present(),
      dismiss: () => localRef.current?.dismiss(),
    }));

    useEffect(() => {
      if (selectedUser) {
        setName(selectedUser.name || '');
        setTrait(selectedUser.trait || '');
        setImageUrl(selectedUser.image || '');
      }
    }, [selectedUser]);

    const handleImagePick = async () => {
      const result = await launchImageLibrary({mediaType: 'photo'});
      if (result.assets?.length) {
        const selectedAsset = result.assets[0];
        let fileUri = selectedAsset.uri;
        let fileName = selectedAsset.fileName || `img_${Date.now()}.jpg`;

        try {
          if (Platform.OS === 'ios' && fileUri.startsWith('ph://')) {
            const destPath = `${RNFS.TemporaryDirectoryPath}photo_${Date.now()}`
              .jpg;
            await RNFS.copyAssetsFileIOS(fileUri, destPath, 0, 0);
            fileUri = 'file://' + destPath;
          }

          const presignedUrls = await getPresignedUrls([fileName]);
          await uploadImageToS3(presignedUrls[0], fileUri);

          setImageUrl(`${CLOUD_FRONT}${fileName}`); // 보기용으로 전체 주소
        } catch (err) {
          Alert.alert('업로드 실패', '이미지 업로드 중 문제가 발생했어요.');
        }
      }
    };

    return (
      <BottomSheetModal
        ref={localRef}
        index={0}
        snapPoints={snapPoints}
        handleIndicatorStyle={{backgroundColor: '#ccc', width: 55}} // 색과 크기 조절 가능
        backgroundStyle={{backgroundColor: 'white'}}
        keyboardBehavior="extend" // ✅ 키보드와 상호작용
        keyboardBlurBehavior="restore" // ✅ 포커스 해제 시 원위치
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            onPress={() => {
              Keyboard.dismiss();
            }}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}>
        <BottomSheetView style={styles.container}>
          <TouchableWithoutFeedback
            // onPress={Keyboard.dismiss}
            accessible={false}
            onPress={() => {
              Keyboard.dismiss();
            }}>
            <View>
              <TouchableOpacity
                style={{width: '50%', alignSelf: 'center'}}
                onPress={handleImagePick}>
                <View style={styles.profileimageContainer}>
                  <Image
                    source={
                      imageUrl
                        ? {uri: imageUrl}
                        : require('../../../assets/images/default.png')
                    }
                    style={styles.profileImage}
                  />
                  <View style={styles.profileImageOverlay} />
                  <Image
                    style={styles.profileImagePencil}
                    source={require('../../../assets/images/pencil.png')}
                  />
                </View>
              </TouchableOpacity>

              <Text style={styles.label}>이름</Text>
              <BottomSheetTextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="이름을 입력해주세요"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>이 사람을 한마디로 표현한다면?</Text>
              <BottomSheetTextInput
                style={[styles.input, styles.textArea]}
                defaultValue={trait}
                onChangeText={setTrait}
                placeholderTextColor="#999"
                multiline
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, {backgroundColor: '#FFF0D0'}]}
                  onPress={onCancel}>
                  <Text style={styles.buttonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, {backgroundColor: '#FFC749'}]}
                  onPress={() => {
                    const finalImageUrl = imageUrl.startsWith(CLOUD_FRONT)
                      ? imageUrl.replace(CLOUD_FRONT, '')
                      : imageUrl;
                    onSave(name, trait, finalImageUrl);
                  }}>
                  <Text style={styles.buttonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(40),
    paddingTop: getResponsiveHeight(20),
    paddingBottom: getResponsiveHeight(60),
  },
  profileimageContainer: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  profileImagePencil: {
    position: 'absolute',
    bottom: 35,
    right: 35,
    width: 25,
    height: 25,
  },
  label: {
    left: getResponsiveWidth(5),
    marginBottom: getResponsiveHeight(5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#575757',
  },
  input: {
    backgroundColor: 'rgba(255, 239, 202, 0.42)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: getResponsiveFontSize(14),
    includeFontPadding: false,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: getResponsiveWidth(10),
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
  },
});

export default UserBottomSheetModal;
