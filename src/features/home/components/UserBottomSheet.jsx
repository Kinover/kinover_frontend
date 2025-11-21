/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-native/no-inline-styles */
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
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
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';
import FastImage from '@d11/react-native-fast-image';
import {convertPhUriToFileUri} from '../../../utils/photoUriConverter';
import {uploadImageWithPresignedUrl} from 'utils/uploadImageWithPresignedUrl';
import {BottomSheetButtons} from 'components/BottomSheetButtons';
import {KinoBottomSheet} from 'components/KinoBottomSheetModal';
const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';
const windowHeight = Dimensions.get('window').height;

function UserBottomSheetModalBase({selectedUser, onSave}, ref) {
  const snapPoints = useMemo(() => ['60%', '82%'], []);
  const nameRef = useRef('');
  const traitRef = useRef('');
  const imageUrlRef = useRef('');

  const [previewImage, setPreviewImage] = useState('');
  const [nameKey, setNameKey] = useState(0);
  const [traitKey, setTraitKey] = useState(0);

  const initialDataRef = useRef({name: '', trait: '', image: ''});

  const modalRef = useRef(null);

  useImperativeHandle(ref, () => ({
    present: () => modalRef.current?.present(),
    dismiss: () => modalRef.current?.dismiss(),
  }));

  const handleBackdropPress = () => {
    Keyboard.dismiss();
    modalRef.current?.snapToIndex(0);
  };

  // 선택된 유저 바뀔 때 초기값 세팅
  useEffect(() => {
    const n = selectedUser?.name ?? '';
    const t = selectedUser?.trait ?? '';
    const img = selectedUser?.image ?? '';

    initialDataRef.current = {name: n, trait: t, image: img};

    nameRef.current = n;
    traitRef.current = t;
    imageUrlRef.current = img;
    setPreviewImage(img);

    setNameKey(k => k + 1);
    setTraitKey(k => k + 1);
  }, [selectedUser]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const sub = Keyboard.addListener('keyboardDidShow', () => {
        modalRef.current?.snapToIndex(1);
      });
      return () => sub.remove();
    }
  }, []);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (!result.assets?.length) return;

    const selectedAsset = result.assets[0];
    let fileUri = selectedAsset.uri;
    const fileName = selectedAsset.fileName || `img_${Date.now()}.jpg`;

    setPreviewImage(fileUri);

    try {
      if (Platform.OS === 'ios' && fileUri.startsWith('ph://')) {
        fileUri = await convertPhUriToFileUri(fileUri, 0);
        if (!fileUri) return;
      }

      await uploadImageWithPresignedUrl(fileUri, fileName);

      imageUrlRef.current = `${CLOUD_FRONT}${fileName}`;
      setPreviewImage(imageUrlRef.current);
    } catch (err) {
      Alert.alert('업로드 실패', '이미지 업로드 중 문제가 발생했어요.');
    }
  };

  const handleSave = () => {
    const img = imageUrlRef.current || '';
    const finalImageUrl = img.startsWith(CLOUD_FRONT)
      ? img.replace(CLOUD_FRONT, '')
      : img;

    onSave(nameRef.current, traitRef.current, finalImageUrl);
    modalRef.current?.dismiss();
  };

  const handleCancel = () => {
    const {name, trait, image} = initialDataRef.current;
    nameRef.current = name;
    traitRef.current = trait;
    imageUrlRef.current = image;
    setPreviewImage(image);

    setNameKey(k => k + 1);
    setTraitKey(k => k + 1);
  };

  return (
    <KinoBottomSheet
      modalRef={modalRef}
      snapPoints={snapPoints}
      keyboardBehavior="interactive">
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.container,
          {
            minHeight: windowHeight * (Platform.OS === 'ios' ? 0.78 : 0.72),
          },
        ]}
        keyboardShouldPersistTaps="handled">
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            modalRef.current?.snapToIndex(0);
          }}>
          <View style={{flex: 1}}>
            {/* 상단 타이틀 */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.sheetTitle}>프로필 편집</Text>
                <Text style={styles.sheetSubtitle}>
                  가족에게 보이는 이름과 한마디를 설정해요.
                </Text>
              </View>
            </View>

            {/* 프로필 이미지 */}
            <TouchableOpacity
              style={styles.profileTouchArea}
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
                <View style={styles.profileRing} />
                <View style={styles.profileBadge}>
                  <FastImage
                    style={styles.profileBadgeIcon}
                    source={require('../../../assets/images/pencil.png')}
                  />
                </View>
              </View>
              <Text style={styles.profileEditText}>사진 변경</Text>
            </TouchableOpacity>

            {/* 별명 입력 */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>별명</Text>
              <BottomSheetTextInput
                key={`name-${nameKey}`}
                style={styles.input}
                defaultValue={nameRef.current}
                onFocus={() =>
                  setTimeout(() => modalRef.current?.snapToIndex(1), 50)
                }
                onChangeText={text => {
                  nameRef.current = text;
                }}
                placeholder="가족들이 부르는 이름을 적어주세요."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* 특징 입력 */}
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>한 줄 소개</Text>
              <BottomSheetTextInput
                key={`trait-${traitKey}`}
                style={[styles.input, styles.textArea]}
                defaultValue={traitRef.current}
                multiline
                onFocus={() =>
                  setTimeout(() => modalRef.current?.snapToIndex(1), 50)
                }
                onChangeText={text => {
                  traitRef.current = text;
                }}
                placeholder="성격, 분위기, 기억에 남는 포인트를 가볍게 적어보세요."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* 하단 버튼 공통 */}
            <BottomSheetButtons onCancel={handleCancel} onSave={handleSave} />
          </View>
        </TouchableWithoutFeedback>
      </BottomSheetScrollView>
    </KinoBottomSheet>
  );
}

const UserBottomSheetModal = forwardRef(UserBottomSheetModalBase);
UserBottomSheetModal.displayName = 'UserBottomSheetModal';

export default UserBottomSheetModal;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingTop: getResponsiveHeight(14),
    paddingBottom: getResponsiveHeight(26),
  },
  headerRow: {
    marginBottom: getResponsiveHeight(12),
  },
  sheetTitle: {
    fontSize: getResponsiveFontSize(16.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  sheetSubtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
  profileTouchArea: {
    width: '45%',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(18),
    marginTop: getResponsiveHeight(6),
  },
  profileimageContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileRing: {
    position: 'absolute',
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  profileBadgeIcon: {
    width: 14,
    height: 14,
  },
  profileEditText: {
    marginTop: getResponsiveHeight(6),
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
  },
  fieldBlock: {
    marginBottom: getResponsiveHeight(12),
  },
  label: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
    marginBottom: getResponsiveHeight(4),
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(7)
        : getResponsiveHeight(9),
    fontSize: getResponsiveFontSize(14),
    includeFontPadding: false,
    fontFamily: 'Pretendard-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: getResponsiveHeight(96),
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
    marginTop: getResponsiveHeight(18),
  },
  button: {
    flex: 1,
    paddingVertical: getResponsiveHeight(11),
    borderRadius: 9,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#111827',
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#4B5563',
  },
});
