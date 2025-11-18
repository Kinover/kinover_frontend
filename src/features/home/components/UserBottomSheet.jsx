/* eslint-disable react-native/no-inline-styles */
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback, // ✅ 이거 추가
} from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';
import FastImage from 'react-native-fast-image2';
import {convertPhUriToFileUri} from '../../../utils/photoUriConverter';
import {uploadImageWithPresignedUrl} from 'utils/uploadImageWithPresignedUrl';
// import {uploadImageWithPresignedUrl} from '../../../utils/uploadFile'; // presigned 업로드 유틸

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';
const windowHeight = Dimensions.get('window').height;

UserBottomSheetModal.displayName = 'UserBottomSheetModal';
const UserBottomSheetModal = forwardRef(({selectedUser, onSave}, ref) => {
  const snapPoints = useMemo(() => ['60%', '90%'], []);
  const nameRef = useRef('');
  const traitRef = useRef('');
  const imageUrlRef = useRef('');

  const [previewImage, setPreviewImage] = useState('');
  const [nameKey, setNameKey] = useState(0);
  const [traitKey, setTraitKey] = useState(0);

  // ✅ 원래 상태 보관용 ref
  const initialDataRef = useRef({name: '', trait: '', image: ''});

  const localRef = useRef(null);

  useImperativeHandle(ref, () => ({
    present: () => localRef.current?.present(),
    dismiss: () => localRef.current?.dismiss(),
  }));
  const handleBackdropPress = () => {
    Keyboard.dismiss();
    localRef.current?.snapToIndex(0);
  };
  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        onPress={handleBackdropPress}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [], // localRef는 ref 자체가 바뀌지 않으니 deps 비워도 됨
  );

  // 선택된 유저 바뀔 때마다 초기값 세팅
  useEffect(() => {
    const n = selectedUser?.name ?? '';
    const t = selectedUser?.trait ?? '';
    const img = selectedUser?.image ?? '';

    // 원본 상태 저장
    initialDataRef.current = {name: n, trait: t, image: img};

    // 현재 입력값도 초기화
    nameRef.current = n;
    traitRef.current = t;
    imageUrlRef.current = img;
    setPreviewImage(img);

    // 리렌더 강제
    setNameKey(k => k + 1);
    setTraitKey(k => k + 1);
  }, [selectedUser]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const sub = Keyboard.addListener('keyboardDidShow', () => {
        localRef.current?.snapToIndex(1);
      });
      return () => sub.remove();
    }
  }, []);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (!result.assets?.length) {
      return;
    }

    const selectedAsset = result.assets[0];
    let fileUri = selectedAsset.uri;
    const fileName = selectedAsset.fileName || `img_${Date.now()}.jpg`;

    // ✅ 미리보기 반영
    setPreviewImage(fileUri);

    try {
      if (Platform.OS === 'ios' && fileUri.startsWith('ph://')) {
        fileUri = await convertPhUriToFileUri(fileUri, 0);
        if (!fileUri) {
          return;
        }
      }

      // ✅ 업로드 실행
      await uploadImageWithPresignedUrl(fileUri, fileName);

      // 서버에 업로드 성공 후 URL 반영
      imageUrlRef.current = `${CLOUD_FRONT}${fileName}`;
      setPreviewImage(imageUrlRef.current);
    } catch (err) {
      Alert.alert('업로드 실패', '이미지 업로드 중 문제가 발생했어요.');
    }
  };

  const handleSave = () => {
    const img = imageUrlRef.current;
    const finalImageUrl = img.startsWith(CLOUD_FRONT)
      ? img.replace(CLOUD_FRONT, '')
      : img;
    onSave(nameRef.current, traitRef.current, finalImageUrl);
    localRef.current?.dismiss();
  };

  const handleCancel = () => {
    // ✅ 원래 유저 상태로 복원 (바텀시트 닫지 않음)
    const {name, trait, image} = initialDataRef.current;
    nameRef.current = name;
    traitRef.current = trait;
    imageUrlRef.current = image;
    setPreviewImage(image);

    // TextInput도 리셋시키려고 키 변경
    setNameKey(k => k + 1);
    setTraitKey(k => k + 1);
  };

  return (
    <BottomSheetModal
      ref={localRef}
      index={0}
      snapPoints={snapPoints}
      animationConfigs={{damping: 20, stiffness: 200, mass: 1}}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
      keyboardBlurBehavior="restore"
      style={{flex: 1}}
      backdropComponent={renderBackdrop} // ✅ 여기
      backgroundStyle={{backgroundColor: 'white'}}
      handleIndicatorStyle={{width: 0}}>
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.container,
          {minHeight: windowHeight + (Platform.OS === 'ios' ? 100 : 0)},
        ]}
        keyboardShouldPersistTaps="handled">
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            localRef.current?.snapToIndex(0);
          }}>
          <View style={{flex: 1}}>
            {/* 프로필 이미지 */}
            <TouchableOpacity
              style={{width: '50%', alignSelf: 'center'}}
              onPress={handleImagePick}>
              <View style={styles.profileimageContainer}>
                <FastImage
                  source={
                    previewImage
                      ? {uri: previewImage}
                      : require('../../../assets/images/default.png')
                  }
                  style={styles.profileImage}
                />
                <View style={styles.profileImageOverlay} />
                <FastImage
                  style={styles.profileImagePencil}
                  source={require('../../../assets/images/pencil.png')}
                />
              </View>
            </TouchableOpacity>

            {/* 별명 입력 */}
            <Text style={styles.label}>우리 가족만의 별명은?</Text>
            <BottomSheetTextInput
              key={`name-${nameKey}`}
              style={styles.input}
              defaultValue={nameRef.current}
              onFocus={() =>
                setTimeout(() => localRef.current?.snapToIndex(1), 50)
              }
              onChangeText={text => {
                nameRef.current = text;
              }}
              placeholderTextColor="#999"
            />

            {/* 특징 입력 */}
            <Text style={styles.label}>
              {nameRef.current} 님은 어떤 사람인가요?
            </Text>
            <BottomSheetTextInput
              key={`trait-${traitKey}`}
              style={[styles.input, styles.textArea]}
              defaultValue={traitRef.current}
              multiline
              onFocus={() =>
                setTimeout(() => localRef.current?.snapToIndex(1), 50)
              }
              onChangeText={text => {
                traitRef.current = text;
              }}
              placeholderTextColor="#999"
            />

            {/* 버튼 영역 */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: '#F4F6FA'}]}
                onPress={handleCancel}>
                <Text style={[styles.buttonText, {color: '#A1A5AF'}]}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: '#FFC749'}]}
                onPress={handleSave}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(25),
    paddingTop: getResponsiveHeight(10),
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
    bottom: 37.5,
    right: 35,
    width: 25,
    height: 25,
  },
  label: {
    fontSize: getResponsiveFontSize(16.5),
    fontFamily: 'Pretendard-Light',
    color: 'black',
    fontWeight: Platform.OS === 'android' ? '600' : '500',
    left: getResponsiveWidth(5),
    marginBottom: getResponsiveHeight(8),
    marginTop: getResponsiveHeight(7),
  },
  input: {
    backgroundColor: 'rgba(255, 239, 202, 0.42)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: getResponsiveFontSize(16),
    includeFontPadding: false,
    fontFamily: 'Pretendard-Light',
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
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(16),
    color: 'white',
  },
});

export default UserBottomSheetModal;
