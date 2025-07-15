import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import {launchImageLibrary} from 'react-native-image-picker';
import RNFS from 'react-native-fs';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../utils/responsive';
import {getPresignedUrls, uploadImageToS3} from '../../api/imageUrlApi';

const UserBottomSheetModal = forwardRef(
  ({selectedUser, onSave, onCancel}, ref) => {
    const snapPoints = ['45%']; // ✅ 거의 전체 높이까지 올라오게 설정
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const CLOUD_FRONT = ''; // TODO: 실제 CloudFront 주소 입력

    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
      present: () => localRef.current?.present(),
      dismiss: () => localRef.current?.dismiss(),
    }));

    useEffect(() => {
      if (selectedUser) {
        setName(selectedUser.name || '');
        setDescription(selectedUser.description || '');
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
            const destPath = `${
              RNFS.TemporaryDirectoryPath
            }photo_${Date.now()}.jpg`;
            await RNFS.copyAssetsFileIOS(fileUri, destPath, 0, 0);
            fileUri = 'file://' + destPath;
          }

          const presignedUrls = await getPresignedUrls([fileName]);
          await uploadImageToS3(presignedUrls[0], fileUri);

          setImageUrl(`${CLOUD_FRONT}${fileName}`);
        } catch (err) {
          Alert.alert('업로드 실패', '이미지 업로드 중 문제가 발생했어요.');
        }
      }
    };

    return (
      <BottomSheetModal
        ref={localRef}
        index={0}
        handleComponent={() => null} // 👈 손잡이 제거
        snapPoints={snapPoints}
        backgroundStyle={{backgroundColor: 'transparent'}} // ✅ 요거 추가!
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}>
        <BottomSheetView
          style={styles.container}
          keyboardBehavior="extend" // ✅ 추천 옵션
          keyboardBlurBehavior="restore">
          <Image
            style={{
              position: 'absolute',
              width: '127.5%',
              height: '150%',
              resizeMode: 'cover',
              right: '0%',
              top: getResponsiveHeight(65),
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
              <View style={styles.profileImageOverlay} />
              <Image
                style={styles.profileImagePencil}
                source={require('../../assets/images/pencil.png')}
              />
            </View>
          </TouchableOpacity>

          <BottomSheetTextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <BottomSheetTextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="이 사람을 한마디로 표현한다면?"
            placeholderTextColor="#999"
          />

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
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: getResponsiveWidth(10),
  },
  button: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: 'center',
    // fontWeight: 'bold',
  },
});

export default UserBottomSheetModal;
