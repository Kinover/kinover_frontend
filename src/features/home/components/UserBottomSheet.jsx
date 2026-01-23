// src/features/home/components/UserBottomSheet.jsx
/* eslint-disable react-native/no-inline-styles */
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
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
  Pressable,
} from 'react-native';

import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {launchImageLibrary} from 'react-native-image-picker';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
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
import {BottomSheetButtons} from 'components/BottomSheetButtons';

// ✅ 추가
import {useSelector} from 'react-redux';
import {FONT_MODE} from '../../../store/uiSlice';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';
const {height: WINDOW_H} = Dimensions.get('window');
const SAFE_GAP = 12;

// ✅ footer 높이만큼 본문 바닥 여유 (버튼 가림 방지)
const FOOTER_SPACE = getResponsiveHeight(86);

function UserBottomSheetModalBase(
  {selectedUser, onSave, onCancel, onDismiss},
  ref,
) {
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

  // ✅ "내용만" 올리는 값(미세 보정용으로 유지)
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const keyboardHeightRef = useRef(0);

  const nameInputRef = useRef(null);
  const traitInputRef = useRef(null);

  // ✅ 탭으로 원복할 때 ensureVisible 재상승 방지
  const tapToResetRef = useRef(false);

  // ✅ 키보드 상태(스냅 제어용)
  const keyboardOpenRef = useRef(false);

  // ✅ fontMode 가져오기
  const fontMode = useSelector(state => state.ui.fontMode);

  // ✅ fontMode에 따라 스냅 높이를 올려줌
  // - large면 기본/키보드 스냅을 조금 더 높게
  // ✅ fontMode에 따라 스냅 높이를 올려줌 (3단계)
  const snapPoints = useMemo(() => {
    const isLarge = fontMode === FONT_MODE.LARGE;
    const isXL = fontMode === FONT_MODE.EXTRA_LARGE;

    // 수치는 취향이지만, 논리는 이렇게:
    // NORMAL: 기본/키보드
    // LARGE:  기본 조금↑ / 키보드 조금↑
    // XL:     기본 더↑ / 키보드 더↑
    if (isXL) return ['74%', '96%'];
    if (isLarge) return ['71%', '94%'];
    return ['67%', '90%'];
  }, [fontMode]);

  // ✅ footer 높이도 폰트 커지면 더 확보 (버튼/인풋 가림 방지)
  const footerSpace = useMemo(() => {
    const isLarge = fontMode === FONT_MODE.LARGE;
    const isXL = fontMode === FONT_MODE.EXTRA_LARGE;

    if (isXL) return getResponsiveHeight(112);
    if (isLarge) return getResponsiveHeight(98);
    return FOOTER_SPACE; // 기존 86 기준
  }, [fontMode]);

  const showToast = msg => {
    setToastMessage(msg);
    setToastVisible(true);
  };
  const hideToast = () => setToastVisible(false);

  useImperativeHandle(ref, () => ({
    present: () => {
      setIsClosing(false);
      tapToResetRef.current = false;
      keyboardOpenRef.current = false;

      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();

      modalRef.current?.present?.();

      // ✅ 열리자마자 large면 기본 스냅도 살짝 더 높은 쪽으로(선택)
      // - snapPoints[0]이 이미 large에 맞춰져 있어서 사실 없어도 되는데,
      //   기존 상태가 남아있을 때 보정용으로 넣어둠
      requestAnimationFrame(() => {
        modalRef.current?.snapToIndex?.(0);
      });
    },
    dismiss: () => {
      setIsClosing(true);
      modalRef.current?.dismiss?.();
    },
  }));

  // ✅ 키보드 show/hide 시: 시트 스냅을 바꿔서 "인풋이 보이게"
  useEffect(() => {
    const onShow = e => {
      keyboardOpenRef.current = true;
      keyboardHeightRef.current = e?.endCoordinates?.height || 0;

      // ✅ 키보드 뜨면 시트 자체를 크게 (index 1)
      modalRef.current?.snapToIndex?.(1);
    };

    const onHide = () => {
      keyboardOpenRef.current = false;
      keyboardHeightRef.current = 0;

      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        tapToResetRef.current = false;
      });

      // ✅ 키보드 내려가면 기본 스냅(0) 복귀
      modalRef.current?.snapToIndex?.(0);
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

  /**
   * ✅ input이 "아직도" 가려지면 내용만 추가로 올림(미세 보정)
   * ✅ (키보드 스냅으로 1차 해결, shiftAnim은 2차 보정)
   */
  const ensureVisible = useCallback(
    inputRef => {
      if (tapToResetRef.current) return;

      const kbH = keyboardHeightRef.current || 0;

      requestAnimationFrame(() => {
        if (tapToResetRef.current) return;

        const node = inputRef?.current;
        if (!node || typeof node.measureInWindow !== 'function') return;

        node.measureInWindow((x, y, w, h) => {
          if (tapToResetRef.current) return;

          const inputBottomY = y + h;
          const baseLimit = kbH ? WINDOW_H - kbH : WINDOW_H;

          // ✅ footerSpace로 교체
          const limitY = baseLimit - SAFE_GAP - footerSpace;

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
    },
    [shiftAnim, footerSpace],
  );

  /**
   * ✅ "아무데나 탭"하면:
   * - 키보드 내림
   * - shiftAnim 0
   * - 스냅 원복
   */
  const dismissKeyboardAndReset = useCallback(() => {
    tapToResetRef.current = true;

    Keyboard.dismiss();

    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      tapToResetRef.current = false;
    });

    modalRef.current?.snapToIndex?.(0);
  }, [shiftAnim]);

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

    tapToResetRef.current = false;
    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();

    // ✅ 선택된 유저가 바뀌면서 내용이 늘어날 수 있으니 현재 키보드 상태에 맞춰 스냅 유지(선택)
    requestAnimationFrame(() => {
      modalRef.current?.snapToIndex?.(keyboardOpenRef.current ? 1 : 0);
    });
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

      await onSave?.(finalName, finalTrait, finalImageUrl);

      setIsClosing(true);
      modalRef.current?.dismiss?.();
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

    tapToResetRef.current = false;
    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start();

    modalRef.current?.snapToIndex?.(0);
    onCancel?.();
  };

  const footerProps = useMemo(
    () => ({
      onCancel: handleCancel,
      onSave: handleSave,
      saveLabel: '적용하기',
      autoCloseOnSave: true,
    }),
    [handleCancel, handleSave],
  );

  return (
    <>
      <BottomSheetLayout
        modalRef={modalRef}
        // ✅ fontMode에 따라 동적 스냅
        snapPoints={snapPoints}
        keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'none'}
        androidKeyboardInputMode="adjustNothing"
        title="프로필 편집"
        subtitle="가족에게 보이는 이름과 한마디를 설정해요."
        useInternalScroll={false}
        onDismiss={() => {
          setIsClosing(true);
          tapToResetRef.current = false;
          keyboardOpenRef.current = false;
          onDismiss?.();
        }}>
        <View
          style={{flex: 1}}
          onStartShouldSetResponder={() => true}
          onResponderRelease={dismissKeyboardAndReset}>
          <Animated.View
            style={{
              flex: 1,
              transform: [{translateY: shiftAnim}],
              paddingBottom: footerSpace + getResponsiveHeight(18),
            }}>
            <View>
              <Pressable onPress={() => {}}>
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
                  <Text allowFontScaling={false} style={styles.profileEditText}>
                    사진 변경
                  </Text>
                </TouchableOpacity>
              </Pressable>

              <View style={styles.fieldBlock}>
                <Text allowFontScaling={false} style={styles.label}>
                  별명
                </Text>
                <Pressable onPress={() => {}}>
                  <BottomSheetTextInput
                    allowFontScaling={false}
                    ref={nameInputRef}
                    key={`name-${nameKey}`}
                    style={styles.input}
                    defaultValue={nameRef.current}
                    onFocus={() => {
                      tapToResetRef.current = false;
                      ensureVisible(nameInputRef);
                    }}
                    onChangeText={text => {
                      nameRef.current = text;
                    }}
                    placeholder="가족들이 부르는 이름을 적어주세요."
                    placeholderTextColor={COLORS.textTertiary}
                    returnKeyType="next"
                    onSubmitEditing={() => traitInputRef.current?.focus?.()}
                  />
                </Pressable>
              </View>

              <View style={styles.fieldBlock}>
                <Text allowFontScaling={false} style={styles.label}>
                  한 줄 소개
                </Text>
                <Pressable onPress={() => {}}>
                  <BottomSheetTextInput
                    allowFontScaling={false}
                    ref={traitInputRef}
                    key={`trait-${traitKey}`}
                    style={[styles.input, styles.textArea]}
                    defaultValue={traitRef.current}
                    multiline
                    onFocus={() => {
                      tapToResetRef.current = false;
                      ensureVisible(traitInputRef);
                    }}
                    onChangeText={text => {
                      traitRef.current = text;
                    }}
                    placeholder="성격, 분위기, 기억에 남는 포인트를 가볍게 적어보세요."
                    placeholderTextColor={COLORS.textTertiary}
                  />
                </Pressable>
              </View>

              {isSaving && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#4B5563" />
                    <Text
                      allowFontScaling={false}
                      allowFontScaling={false}
                      style={styles.loadingText}>
                      저장 중...
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.footerFixed}>
              <BottomSheetButtons {...footerProps} />
            </View>
          </Animated.View>
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
  footerFixed: {
    paddingTop: getResponsiveHeight(10),
    paddingBottom: getResponsiveHeight(2),
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
    fontSize: BOTTOMSHEET_STYLE().sectionLabel.fontSize,
    fontFamily: BOTTOMSHEET_STYLE().sectionLabel.fontFamily,
    color: BOTTOMSHEET_STYLE().sectionLabel.color,
    marginBottom: BOTTOMSHEET_STYLE().sectionLabel.marginBottom,
    marginTop: BOTTOMSHEET_STYLE().sectionLabel.marginTop,
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
