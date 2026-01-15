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
  Keyboard,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {
  BottomSheetTextInput,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  getResponsiveFontSize,
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
import {BOTTOMSHEET_STYLE, COLORS} from 'styles/style';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';
const {height: WINDOW_H} = Dimensions.get('window');
const SAFE_GAP = 12;

function UserBottomSheetModalBase({selectedUser, onSave}, ref) {
  // ✅ “요소 양만큼 높이” 정석 세팅
  const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], []);
  const {
    animatedSnapPoints,
    animatedHandleHeight,
    animatedContentHeight,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

  const nameRef = useRef('');
  const traitRef = useRef('');
  const imageUrlRef = useRef('');

  const [previewImage, setPreviewImage] = useState('');
  const [nameKey, setNameKey] = useState(0);
  const [traitKey, setTraitKey] = useState(0);

  const initialDataRef = useRef({name: '', trait: '', image: ''});
  const modalRef = useRef(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ 입력만 올리는 값 (버튼은 안 올라감)
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const keyboardHeightRef = useRef(0);

  const nameInputRef = useRef(null);
  const traitInputRef = useRef(null);

  const showToast = msg => {
    setToastMessage(msg);
    setToastVisible(true);
  };
  const hideToast = () => setToastVisible(false);

  useImperativeHandle(ref, () => ({
    present: () => {
      setIsClosing(false);
      modalRef.current?.present();
    },
    dismiss: () => {
      setIsClosing(true);
      modalRef.current?.dismiss();
    },
  }));

  // ✅ 키보드 높이만 추적 (시트/버튼은 안 움직이게 설정할 거라서)
  useEffect(() => {
    const onShow = e => {
      keyboardHeightRef.current = e?.endCoordinates?.height || 0;
    };
    const onHide = () => {
      keyboardHeightRef.current = 0;
      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start();
    };

    const subShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow,
    );
    const subHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide,
    );

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [shiftAnim]);

  const ensureVisible = inputRef => {
    const kbH = keyboardHeightRef.current || 0;
    if (!kbH) return;

    const keyboardTopY = WINDOW_H - kbH;

    requestAnimationFrame(() => {
      const node = inputRef?.current;
      if (!node || typeof node.measureInWindow !== 'function') return;

      node.measureInWindow((x, y, w, h) => {
        const inputBottomY = y + h;
        const limitY = keyboardTopY - SAFE_GAP;

        if (inputBottomY <= limitY) {
          Animated.timing(shiftAnim, {
            toValue: 0,
            duration: 140,
            useNativeDriver: true,
          }).start();
          return;
        }

        const diff = inputBottomY - limitY;

        Animated.timing(shiftAnim, {
          toValue: -diff,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    });
  };

  useEffect(() => {
    if (!selectedUser) return;
    if (isClosing) return;

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

    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [selectedUser, isClosing, shiftAnim]);

  const handleImagePick = async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (!result.assets?.length) return;

    const selectedAsset = result.assets[0];
    let fileUri = selectedAsset.uri || '';
    let fileName = selectedAsset.fileName || `img_${Date.now()}.jpg`;

    if (fileUri.startsWith('http')) {
      imageUrlRef.current = fileUri;
      setPreviewImage(fileUri);
      return;
    }

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

      imageUrlRef.current = fileName;
      setPreviewImage(`${CLOUD_FRONT}${fileName}`);
    } catch (err) {
      console.error('❌ 프로필 이미지 업로드 실패:', err);
      showToast('이미지 업로드 중 문제가 발생했어요.');
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
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

      const rawImg =
        (imageUrlRef.current && imageUrlRef.current.trim().length > 0
          ? imageUrlRef.current
          : initialImage) || '';

      const finalImageUrl = normalizeImageForSave(rawImg);

      setIsClosing(true);
      await onSave(finalName, finalTrait, finalImageUrl);
      modalRef.current?.dismiss();
    } catch (err) {
      console.error('❌ 프로필 저장 실패:', err);
      showToast('프로필 저장 중 문제가 발생했어요.');
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

    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start();
  };

  return (
    <>
      <BottomSheetLayout
        modalRef={modalRef}
        snapPoints={animatedSnapPoints}
        handleHeight={animatedHandleHeight}
        contentHeight={animatedContentHeight}
        onContentLayout={handleContentLayout}
        keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'none'}
        androidKeyboardInputMode="adjustNothing"
        title="프로필 편집"
        subtitle="가족에게 보이는 이름과 한마디를 설정해요."
        footerProps={{
          onCancel: handleCancel,
          onSave: handleSave,
          saveLabel: '적용하기',
          autoCloseOnSave: true,
        }}
        contentTranslateY={shiftAnim}>
        <View>
          <TouchableOpacity
            style={styles.profileTouchArea}
            onPress={handleImagePick}
            activeOpacity={0.9}>
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
              ref={nameInputRef}
              key={`name-${nameKey}`}
              style={styles.input}
              defaultValue={nameRef.current}
              onFocus={() => ensureVisible(nameInputRef)}
              onChangeText={text => {
                nameRef.current = text;
              }}
              placeholder="가족들이 부르는 이름을 적어주세요."
              placeholderTextColor={COLORS.textTertiary}
              returnKeyType="next"
              onSubmitEditing={() => traitInputRef.current?.focus?.()}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>한 줄 소개</Text>
            <BottomSheetTextInput
              ref={traitInputRef}
              key={`trait-${traitKey}`}
              style={[styles.input, styles.textArea]}
              defaultValue={traitRef.current}
              multiline
              onFocus={() => ensureVisible(traitInputRef)}
              onChangeText={text => {
                traitRef.current = text;
              }}
              placeholder="성격, 분위기, 기억에 남는 포인트를 가볍게 적어보세요."
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          {isSaving && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#4B5563" />
                <Text style={styles.loadingText}>저장 중...</Text>
              </View>
            </View>
          )}
        </View>
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
  profileImage: {width: '100%', height: '100%'},
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
  profileBadgeIcon: {width: 14, height: 14},
  profileEditText: {
    marginTop: getResponsiveHeight(6),
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
  },
  fieldBlock: {marginBottom: getResponsiveHeight(12)},
  label: {
    fontSize: BOTTOMSHEET_STYLE.sectionLabel.fontSize,
    fontFamily: BOTTOMSHEET_STYLE.sectionLabel.fontFamily,
    color: BOTTOMSHEET_STYLE.sectionLabel.color,
    marginBottom: BOTTOMSHEET_STYLE.sectionLabel.marginBottom,
    marginTop: BOTTOMSHEET_STYLE.sectionLabel.marginTop,
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
