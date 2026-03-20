/* eslint-disable react-native/no-inline-styles */
// src/features/home/components/UserBottomSheet.jsx
// - snapToIndex 금지(키보드/스냅 정책은 Layout에 맡김)
// - shiftAnim으로 콘텐츠만 위로 올림(ensureVisible)
// - 내부 탭: shift 리셋만 + 연타 방지
// - 키보드 이벤트: 높이 추적 + shift 리셋만

import AppText from 'components/AppText';
import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
} from 'react';
import { Platform, View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Keyboard, Animated, Dimensions, SafeAreaView } from 'react-native';

import {
  BottomSheetTextInput as GorhomBottomSheetTextInput,
  BottomSheetView as GorhomBottomSheetView,
} from '@gorhom/bottom-sheet';

// @gorhom/bottom-sheet가 Metro 해석 시 undefined일 수 있음 → RN 기본 컴포넌트로 폴백
const BottomSheetTextInput = GorhomBottomSheetTextInput ?? TextInput;
const BottomSheetView = GorhomBottomSheetView ?? View;
import {launchImageLibrary} from 'react-native-image-picker';
import {useSelector} from 'react-redux';
import {useReduxFontMode} from 'hooks/useReduxFontMode';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
} from 'utils/responsive';
import {
  getKeyboardSafeGap,
  getUserBottomSheetSnapPoints,
} from 'utils/layoutMetrics';
import FastImage from '@d11/react-native-fast-image';
import {
  convertPhUriToFileUri,
  convertContentUriToFileUri,
} from 'utils/photoUriConverter';

import ToastModal from 'components/modal/ToastModal';
import {getPresignedUrls, uploadFileToS3} from 'api/imageUrlApi';

import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import {normalizeImageForSave} from 'utils/normalizeImageForSave';
import {BOTTOMSHEET_STYLE, COLORS} from 'styles/style';

import BottomSheetFooterButtons from 'components/bottomSheet/BottomSheetFooterButtons';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';

const {height: WINDOW_H} = Dimensions.get('window');
const SAFE_GAP = getKeyboardSafeGap();

const IMG_DEFAULT = require('../../../assets/images/default.png');
let IMG_PENCIL;
try {
  IMG_PENCIL = require('../../../assets/images/pencil.png');
} catch {
  IMG_PENCIL = IMG_DEFAULT;
}

function UserBottomSheetModalBase(
  {selectedUser, onSave, onCancel, onDismiss},
  ref,
) {
  const normalizeNickname = useCallback(value => {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          paddingTop: getResponsiveHeight(6),
          paddingBottom: getResponsiveHeight(10),
        },
        footerFlow: {
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
          color: BOTTOMSHEET_STYLE().sectionLabel.color,
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
          backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
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
          color: '#111827',
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
          top: getResponsiveHeight(8),
          alignItems: 'center',
          justifyContent: 'center',
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
      }),
    [],
  );

 // input 데이터는 ref로 (불필요 리렌더 방지)
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

  const nameInputRef = useRef(null);
  const traitInputRef = useRef(null);

  const fontMode = useReduxFontMode();
  const familyUserList = useSelector(
    state => state?.userFamily?.familyUserList ?? [],
  );

 // 콘텐츠 영역만” 올릴 shift
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const keyboardHeightRef = useRef(0);
  const keyboardOpenRef = useRef(false);
  const tapToResetRef = useRef(false);

 // 내부 탭 연타 방지
  const touchLockRef = useRef(false);
  const touchLockTimerRef = useRef(null);
  const lockTouchBriefly = useCallback(() => {
    touchLockRef.current = true;
    if (touchLockTimerRef.current) clearTimeout(touchLockTimerRef.current);
    touchLockTimerRef.current = setTimeout(() => {
      touchLockRef.current = false;
    }, 180);
  }, []);

  const showToast = useCallback(msg => {
    setToastMessage(String(msg ?? ''));
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => setToastVisible(false), []);

 // cleanup
  useEffect(() => {
    return () => {
      if (touchLockTimerRef.current) clearTimeout(touchLockTimerRef.current);
    };
  }, []);

  const snapPoints = useMemo(() => {
    return getUserBottomSheetSnapPoints(fontMode);
  }, [fontMode]);

  const sheetKey = useMemo(() => {
    return `user-flow-${String(fontMode ?? '')}-${selectedUser?.userId ?? 'none'}`;
  }, [fontMode, selectedUser?.userId]);

  const closeSheet = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    modalRef.current?.dismiss?.();
  }, [isClosing]);

  useImperativeHandle(ref, () => ({
    present: () => {
      setIsClosing(false);
      setIsSaving(false);
      hideToast();

      tapToResetRef.current = false;
      keyboardOpenRef.current = false;
      keyboardHeightRef.current = 0;

      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();

      modalRef.current?.present?.();
    },
    dismiss: () => closeSheet(),
  }));

 // selectedUser 바뀔 때 입력 초기화 (snap 금지)
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
        ? img.startsWith('http') || img.startsWith('file')
          ? img
          : `${CLOUD_FRONT}${img}`
        : '';

    setPreviewImage(preview);
    setNameKey(k => k + 1);
    setTraitKey(k => k + 1);

 // shift도 0으로 리셋
    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start();

 // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

 // 키보드 이벤트: 높이 추적 + shift 리셋만
  useEffect(() => {
    const onShow = e => {
      keyboardOpenRef.current = true;
      keyboardHeightRef.current = e?.endCoordinates?.height || 0;
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

 // 입력이 키보드에 가리면 “콘텐츠만” 올리기
  const ensureVisible = useCallback(
    refNode => {
      if (tapToResetRef.current) return;

      const kbH = keyboardHeightRef.current || 0;
      if (!kbH) return;

      requestAnimationFrame(() => {
        if (tapToResetRef.current) return;

        const node = refNode?.current;
        if (!node || typeof node.measureInWindow !== 'function') return;

        node.measureInWindow((x, y, w, h) => {
          if (tapToResetRef.current) return;

          const inputBottomY = y + h;
          const limitY = WINDOW_H - kbH - SAFE_GAP;

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
    [shiftAnim],
  );

 /**
 * 버벅 제거 핵심:
 * - 내부 탭에서는 snapToIndex 절대 금지
 * - shift만 0으로 리셋
 * - 키보드 dismiss는 Layout이 담당(dismissKeyboardOnPress=true)
 */
  const handleTouchInsideResetOnly = useCallback(() => {
    if (!keyboardOpenRef.current) return; // 키보드 없으면 굳이 할 게 없음
    if (touchLockRef.current) return;
    lockTouchBriefly();

    hideToast();

    tapToResetRef.current = true;

    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      tapToResetRef.current = false;
    });
  }, [shiftAnim, lockTouchBriefly, hideToast]);

  const handleImagePick = useCallback(async () => {
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

    if (!/\.[a-zA-Z0-9]+$/.test(fileName)) fileName = `${fileName}.jpg`;

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
  }, [showToast]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const {name: initialName, trait: initialTrait, image: initialImage} =
        initialDataRef.current;

      const trimmedName = (nameRef.current || '').trim();
      const finalName =
        trimmedName.length > 0 ? trimmedName : initialName ?? '';

      const trimmedTrait = (traitRef.current || '').trim();
      const finalTrait =
        trimmedTrait.length > 0 ? trimmedTrait : initialTrait ?? '';

      const myId = selectedUser?.userId ?? selectedUser?.id ?? null;
      const normalizedFinalName = normalizeNickname(finalName);
      const hasDuplicateNickname = (familyUserList || []).some(member => {
        const memberId = member?.userId ?? member?.id ?? null;
        if (myId != null && memberId != null && String(memberId) === String(myId)) {
          return false;
        }
        const candidate = member?.nickname ?? member?.name ?? '';
        return normalizeNickname(candidate) === normalizedFinalName;
      });

      if (normalizedFinalName && hasDuplicateNickname) {
        showToast('가족 내에 같은 별명이 있어요. 다른 별명을 입력해주세요.');
        setIsSaving(false);
        return;
      }

      const rawImg =
        (imageUrlRef.current && imageUrlRef.current.trim().length > 0
          ? imageUrlRef.current
          : initialImage) || '';

      const finalImageUrl = normalizeImageForSave(rawImg);

      await onSave?.(finalName, finalTrait, finalImageUrl);

      closeSheet();
    } catch (err) {
      console.error('❌ 프로필 저장 실패:', err);
      showToast('프로필 저장 중 문제가 발생했어요.');
      setIsSaving(false);
    }
  }, [
    isSaving,
    onSave,
    showToast,
    closeSheet,
    familyUserList,
    selectedUser?.userId,
    selectedUser?.id,
    normalizeNickname,
  ]);

  const handleCancel = useCallback(() => {
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

    hideToast();

 // snap/keyboard 건드리지 말기
    onCancel?.();
  }, [onCancel, hideToast]);

  const footerProps = useMemo(
    () => ({
      onCancel: handleCancel,
      onSave: handleSave,
      saveLabel: isSaving ? '저장 중...' : '적용하기',
      autoCloseOnSave: false,
      disabled: isSaving,
    }),
    [handleCancel, handleSave, isSaving],
  );

  const handleDismiss = useCallback(() => {
    setIsClosing(false);
    setIsSaving(false);
    hideToast();

    tapToResetRef.current = false;
    keyboardOpenRef.current = false;
    keyboardHeightRef.current = 0;

    Animated.timing(shiftAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start();

    onDismiss?.();
  }, [onDismiss, hideToast, shiftAnim]);

  return (
    <>
      <BottomSheetLayout
        modalRef={modalRef}
        snapPoints={snapPoints}
        defaultSnapPoints={snapPoints}
        sheetKey={sheetKey}
        title="프로필 편집"
        subtitle="가족이 기억할 ‘별명’과 ‘특징’을 남겨요."
        useInternalScroll={true}
        keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'none'}
        keyboardBlurBehavior="restore"
        androidKeyboardInputMode="adjustResize"
        enableKeyboardPolicy={true}
        keyboardOpenSnapIndex={1}
        keyboardCloseSnapIndex={0}
        useTouchOverlay={true}
        dismissKeyboardOnPress={true} // Layout이 키보드 내림 담당
        onTouchInside={handleTouchInsideResetOnly} // 내부 탭은 shift만 리셋
        onDismiss={handleDismiss}
      >
        <SafeAreaView style={{backgroundColor: '#fff'}}>
          <BottomSheetView>
            <Animated.View style={{transform: [{translateY: shiftAnim}]}}>
              <View style={styles.body}>
                <TouchableOpacity
                  style={styles.profileTouchArea}
                  onPress={handleImagePick}
                  activeOpacity={0.9}
                  disabled={isSaving}
                >
                  <View style={styles.profileimageContainer}>
                    <FastImage
                      fallback={true}
                      source={
                        previewImage
                          ? {uri: previewImage}
                          : IMG_DEFAULT
                      }
                      style={styles.profileImage}
 // blurRadius={keyboardOpenRef.current ? 0 : 4}
                      blurRadius={4}
                    />
                    <View style={styles.profileOverlay} />
                    <View style={styles.profileRing} />
                    <View style={styles.profileBadge}>
                      <Image
                        style={styles.profileBadgeIcon}
                        source={IMG_PENCIL ?? IMG_DEFAULT}
                      />
                    </View>
                  </View>
                  <AppText allowFontScaling={false} style={styles.profileEditText}>
                    사진 변경
                  </AppText>
                </TouchableOpacity>

                <View style={styles.fieldBlock}>
                  <AppText allowFontScaling={false} style={styles.label}>
                    별명
                  </AppText>
                  <BottomSheetTextInput
                    allowFontScaling={false}
                    ref={nameInputRef}
                    key={`name-${nameKey}`}
                    style={styles.input}
                    defaultValue={nameRef.current}
                    onChangeText={text => {
                      nameRef.current = text;
                    }}
                    placeholder="가족들이 부르는 이름을 적어주세요."
                    placeholderTextColor={COLORS.textTertiary}
                    returnKeyType="next"
                    onFocus={() => {
                      tapToResetRef.current = false;
                      ensureVisible(nameInputRef);
                    }}
                    onSubmitEditing={() => traitInputRef.current?.focus?.()}
                    editable={!isSaving}
                  />
                </View>

                <View style={styles.fieldBlock}>
                  <AppText allowFontScaling={false} style={styles.label}>
                    한 줄 소개
                  </AppText>
                  <BottomSheetTextInput
                    allowFontScaling={false}
                    ref={traitInputRef}
                    key={`trait-${traitKey}`}
                    style={[styles.input, styles.textArea]}
                    defaultValue={traitRef.current}
                    multiline
                    onChangeText={text => {
                      traitRef.current = text;
                    }}
                    placeholder="성격, 분위기, 기억에 남는 포인트를 가볍게 적어보세요."
                    placeholderTextColor={COLORS.textTertiary}
                    onFocus={() => {
                      tapToResetRef.current = false;
                      ensureVisible(traitInputRef);
                    }}
                    editable={!isSaving}
                  />
                </View>

                <BottomSheetFooterButtons
                  bottomSafe={0}
                  includeBottomSafePadding={Platform.OS === 'ios'}
                  excludeSafeForMeasure={false}
                  onLayoutHeight={undefined}
                  style={styles.footerFlow}
                  {...footerProps}
                />

                {isSaving && (
                  <View style={styles.loadingOverlay} pointerEvents="none">
                    <View style={styles.loadingBox}>
                      <ActivityIndicator size="small" color="#4B5563" />
                      <AppText allowFontScaling={false} style={styles.loadingText}>
                        저장 중...
                      </AppText>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          </BottomSheetView>
        </SafeAreaView>
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
