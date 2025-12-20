// src/features/home/components/UserBottomSheet.jsx

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
  Platform,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';
import FastImage from '@d11/react-native-fast-image';
import {
  convertPhUriToFileUri,
  convertContentUriToFileUri,
} from '../../../utils/photoUriConverter';
import ToastModal from '../../../components/ToastModal';
import {getPresignedUrls, uploadFileToS3} from 'api/imageUrlApi';
import BottomSheetLayout from 'components/BottomSheetLayout';
import {normalizeImageForSave} from 'utils/normalizeImageforSave';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';
const windowHeight = Dimensions.get('window').height;

function UserBottomSheetModalBase({selectedUser, onSave}, ref) {
  const snapPoints = useMemo(() => ['62%'], []);

  const nameRef = useRef('');
  const traitRef = useRef('');
  const imageUrlRef = useRef(''); // DB에 저장할 raw 값 (key 또는 full URL)

  const [previewImage, setPreviewImage] = useState('');
  const [nameKey, setNameKey] = useState(0);
  const [traitKey, setTraitKey] = useState(0);

  const initialDataRef = useRef({name: '', trait: '', image: ''});

  const modalRef = useRef(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ✅ 닫히는 중인지 여부 (닫히는 동안 selectedUser 변경에 반응 안 함)
  const [isClosing, setIsClosing] = useState(false);

  // ✅ 저장 중 로딩 상태
  const [isSaving, setIsSaving] = useState(false);

  const showToast = msg => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const hideToast = () => {
    setToastVisible(false);
  };

  useImperativeHandle(ref, () => ({
    present: () => {
      // 다시 열릴 때는 closing 상태 초기화
      setIsClosing(false);
      modalRef.current?.present();
    },
    dismiss: () => {
      setIsClosing(true);
      modalRef.current?.dismiss();
    },
  }));

  // 선택된 유저 바뀔 때 초기값 세팅
  useEffect(() => {
    if (!selectedUser) return;
    if (isClosing) return; // ✅ 닫히는 중이면 초기화 로직 스킵

    const n = selectedUser.name ?? '';
    const t = selectedUser.trait ?? '';
    const img = selectedUser.image ?? '';

    initialDataRef.current = {name: n, trait: t, image: img};

    nameRef.current = n;
    traitRef.current = t;
    imageUrlRef.current = img;

    const preview =
      img && img.length > 0
        ? img.startsWith('http')
          ? img
          : `${CLOUD_FRONT}${img}`
        : '';

    setPreviewImage(preview);

    setNameKey(k => k + 1);
    setTraitKey(k => k + 1);
  }, [selectedUser, isClosing]);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (!result.assets?.length) return;

    const selectedAsset = result.assets[0];
    let fileUri = selectedAsset.uri || '';
    let fileName = selectedAsset.fileName || `img_${Date.now()}.jpg`;

    // 이미 http로 시작하면 그대로 사용 (카카오 등)
    if (fileUri.startsWith('http')) {
      imageUrlRef.current = fileUri;
      setPreviewImage(fileUri);
      return;
    }

    // 확장자 보정
    if (!/\.[a-zA-Z0-9]+$/.test(fileName)) {
      fileName = `${fileName}.jpg`;
    }

    setPreviewImage(fileUri);

    try {
      if (Platform.OS === 'ios' && fileUri.startsWith('ph://')) {
        fileUri = await convertPhUriToFileUri(fileUri, 0, false);
        if (!fileUri) throw new Error('iOS ph:// 변환 실패');
      }

      if (Platform.OS === 'android' && fileUri.startsWith('content://')) {
        fileUri = await convertContentUriToFileUri(fileUri, 0, false);
        if (!fileUri) throw new Error('Android content:// 변환 실패');
      }

      const [presignedUrl] = await getPresignedUrls([fileName]);
      await uploadFileToS3(presignedUrl, fileUri, fileName);

      // DB에는 key만 저장
      imageUrlRef.current = fileName;
      // 미리보기는 전체 URL
      setPreviewImage(`${CLOUD_FRONT}${fileName}`);
    } catch (err) {
      console.error('❌ 프로필 이미지 업로드 실패:', err);
      showToast('이미지 업로드 중 문제가 발생했어요.');
    }
  };

  // ✅ 저장 로직: 서버/Redux 업데이트 동안 로딩 띄우기
  // ✅ 저장 로직: 서버/Redux 업데이트 동안 로딩 띄우기
  const handleSave = async () => {
    if (isSaving) return; // 중복 저장 방지
    setIsSaving(true);

    try {
      const {
        name: initialName,
        trait: initialTrait,
        image: initialImage,
      } = initialDataRef.current;

      const trimmedName = (nameRef.current || '').trim();
      const finalName =
        trimmedName.length > 0 ? trimmedName : initialName ?? '';

      const trimmedTrait = (traitRef.current || '').trim();
      const finalTrait =
        trimmedTrait.length > 0 ? trimmedTrait : initialTrait ?? '';

      // 새로 선택된 이미지가 있으면 그걸, 아니면 기존 이미지 유지
      const rawImg =
        (imageUrlRef.current && imageUrlRef.current.trim().length > 0
          ? imageUrlRef.current
          : initialImage) || '';

      const finalImageUrl = normalizeImageForSave(rawImg);

      console.log('🔥 user save payload image =', {
        rawImg,
        finalImageUrl,
      });

      // ✅ 닫히는 중 플래그 세팅 → 이 뒤로 들어오는 selectedUser 변화엔 반응하지 않도록
      setIsClosing(true);

      // 1) 서버 / Redux 저장
      await onSave(finalName, finalTrait, finalImageUrl);

      // 2) 저장까지 끝나면 바텀시트 닫기
      modalRef.current?.dismiss();
    } catch (err) {
      console.error('❌ 프로필 저장 실패:', err);
      showToast('프로필 저장 중 문제가 발생했어요.');
      // 에러나면 바텀시트는 그대로 열어두는 게 UX상 더 자연스러워서 여기서는 dismiss 안 함
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const {name, trait, image} = initialDataRef.current;
    nameRef.current = name;
    traitRef.current = trait;
    imageUrlRef.current = image;

    const preview =
      image && image.length > 0
        ? image.startsWith('http')
          ? image
          : `${CLOUD_FRONT}${image}`
        : '';

    setPreviewImage(preview);

    setNameKey(k => k + 1);
    setTraitKey(k => k + 1);
  };

  return (
    <>
      <BottomSheetLayout
        modalRef={modalRef}
        snapPoints={snapPoints}
        keyboardBehavior="interactive"
        title="프로필 편집"
        subtitle="가족에게 보이는 이름과 한마디를 설정해요."
        footerProps={{
          onCancel: handleCancel,
          onSave: handleSave, // ✅ 저장만, 닫기는 BottomSheetButtons에서
          saveLabel: '적용하기',
        }}
        innerContentStyle={{flex: 1}}
        useFixedFooter={false}
        contentStyle={{flex: 1}}>
        <KeyboardAvoidingView
          enabled
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
          style={{flex: 1}}>
          <View style={{flex: 1}}>
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
                  blurRadius={4}
                />
                <View style={styles.profileOverlay} />

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

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>별명</Text>
              <BottomSheetTextInput
                key={`name-${nameKey}`}
                style={styles.input}
                defaultValue={nameRef.current}
                onChangeText={text => {
                  nameRef.current = text;
                }}
                placeholder="가족들이 부르는 이름을 적어주세요."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>한 줄 소개</Text>
              <BottomSheetTextInput
                key={`trait-${traitKey}`}
                style={[styles.input, styles.textArea]}
                defaultValue={traitRef.current}
                multiline
                onChangeText={text => {
                  traitRef.current = text;
                }}
                placeholder="성격, 분위기, 기억에 남는 포인트를 가볍게 적어보세요."
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* ✅ 저장 중일 때 로딩 인디케이터 (배경 투명) */}
          {isSaving && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#4B5563" />
                <Text style={styles.loadingText}>저장 중...</Text>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </BottomSheetLayout>

      <ToastModal
        visible={toastVisible}
        onClose={hideToast}
        message={toastMessage}
      />
    </>
  );
}

const UserBottomSheetModal = forwardRef(UserBottomSheetModalBase);
UserBottomSheetModal.displayName = 'UserBottomSheetModal';

export default UserBottomSheetModal;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingTop: getResponsiveHeight(4),
    paddingBottom: getResponsiveHeight(16),
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
    fontSize: getResponsiveFontSize(13),
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
  profileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  // ✅ 배경 없이 아래쪽에만 작게 뜨는 로딩
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: getResponsiveHeight(20),
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginLeft: 6,
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
  },
});
