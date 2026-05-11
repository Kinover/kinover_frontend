/* eslint-disable react-native/no-inline-styles */
// src/features/home/components/UserBottomSheet.jsx
// - snapToIndex 금지(키보드/스냅 정책은 Layout에 맡김)
// - 키보드 시 바텀시트 전체가 위로 올라감 (interactive/extend + adjustNothing)
// - 내부 탭: 입력 blur만 + 연타 방지

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
import { Platform, View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import DatePicker from 'react-native-date-picker';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import CustomInput from 'components/CustomInput';
import {launchImageLibrary} from 'react-native-image-picker';
import {useSelector} from 'react-redux';
import {useReduxFontMode} from 'hooks/useReduxFontMode';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';
import {getUserBottomSheetSnapPoints} from 'utils/layoutMetrics';
import {
  parseBirthYmdToLocalDate,
  coerceBirthToYmd,
} from 'features/home/utils/normalizeUserProfileResponse';
import FastImage from '@d11/react-native-fast-image';
import {
  convertPhUriToFileUri,
  convertContentUriToFileUri,
} from 'utils/photoUriConverter';

import ToastModal from 'components/modal/ToastModal';
import {getPresignedUrls, uploadFileToS3} from 'api/imageUrlApi';

import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import BOTTOM_SHEET_TITLES, {
  BOTTOM_SHEET_BUTTON_LABELS,
} from 'constants/bottomSheetTitles';
import {normalizeImageForSave} from 'utils/normalizeImageForSave';
import BottomSheetFooterButtons from 'components/bottomSheet/BottomSheetFooterButtons';
import {
  BOTTOM_SHEET_EDITOR_COLORS,
  BOTTOM_SHEET_EDITOR_FLOW,
  getBottomSheetEditorBottomSafe,
  getBottomSheetEditorSharedStyles,
  getBottomSheetPrimarySaveButtonStyle,
} from 'components/bottomSheet/bottomSheetEditorSharedStyles';
import {FONTS} from 'styles/typography';
import {useColors, useIsDark} from 'hooks/useColors';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';
const BIRTH_MIN = new Date(1900, 0, 1);

function formatDateYmd(date) {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const IMG_DEFAULT = require('../../../assets/images/default.png');
let IMG_PENCIL;
try {
  IMG_PENCIL = require('../../../assets/images/pencil.png');
} catch {
  IMG_PENCIL = IMG_DEFAULT;
}

function UserBottomSheetModalBase({selectedUser, onSave, onDismiss}, ref) {
  const colors = useColors();
  const isDark = useIsDark();
  const normalizeNickname = useCallback(value => {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }, []);

  const styles = useMemo(() => {
    const shared = getBottomSheetEditorSharedStyles(
      getResponsiveFontSize,
      getResponsiveHeight,
      getResponsiveWidth,
      colors,
      isDark,
    );
    const shellBg = isDark ? colors.surfaceMuted : '#F5F5F5';
    const shellBorder = isDark ? colors.borderSubtle : '#F5F5F5';
    return StyleSheet.create({
      ...shared,
      body: shared.content,
      footerFlow: {
        ...shared.footerFlow,
        paddingTop: getResponsiveHeight(18),
      },
      sectionLabel: {
        ...shared.sectionLabel,
        fontSize: getResponsiveFontSize(12.5),
        fontFamily: FONTS.MEDIUM,
        color: BOTTOM_SHEET_EDITOR_COLORS.muted,
      },
      nameUnderlineWrap: {
        ...shared.singleLineUnderlineWrap,
        paddingHorizontal: getResponsiveWidth(13),
        paddingVertical: getResponsiveHeight(6),
      },
      nameUnderlineWrapFocused: shared.singleLineUnderlineWrapFocused,
      inputUnderlineWrap: {
        alignSelf: 'stretch',
        borderWidth: 1,
        borderColor: shellBorder,
        borderRadius: getResponsiveWidth(12),
        backgroundColor: shellBg,
        paddingHorizontal: getResponsiveWidth(13),
        paddingVertical: getResponsiveHeight(9),
        marginTop: getResponsiveHeight(4),
      },
      inputUnderlineWrapFocused: {
        borderColor: '#FFC84D',
      },
      traitCounter: {
        alignSelf: 'flex-end',
        marginTop: getResponsiveHeight(4),
        fontSize: getResponsiveFontSize(11),
        fontFamily: FONTS.REGULAR,
        color: BOTTOM_SHEET_EDITOR_COLORS.muted,
        letterSpacing: -0.1,
      },
      traitCounterOver: {
        color: '#EF4444',
      },
      inputName: {
        ...shared.profileNicknameInput,
        fontSize: getResponsiveFontSize(16),
        lineHeight: getResponsiveFontSize(21),
      },
      /** 생년월일 행(`birthPickText`)과 동일 크기·패밀리(REGULAR 16) — 멀티라인용 lineHeight·높이만 별도 */
      inputTrait: {
        ...shared.profileTraitInput,
        fontSize: getResponsiveFontSize(16),
        lineHeight: getResponsiveFontSize(22),
        fontFamily: FONTS.REGULAR,
        color: colors.textPrimary,
        letterSpacing: -0.2,
        height: getResponsiveFontSize(22) * 2 + getResponsiveHeight(8),
      },
      profileTouchArea: {
        alignSelf: 'center',
        alignItems: 'center',
        paddingVertical: getResponsiveHeight(10),
        paddingHorizontal: getResponsiveWidth(24),
        // borderRadius: 14,
        // borderWidth: 1,
        // borderStyle: 'dashed',
        // borderColor: 'rgba(0,0,0,0.14)',
        marginBottom: getResponsiveHeight(BOTTOM_SHEET_EDITOR_FLOW),
        marginTop: getResponsiveHeight(6),
      },
      profileimageContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
      },
      profileImage: {width: '100%', height: '100%'},
      profileRing: {
        position: 'absolute',
        borderRadius: 40,
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

        justifyContent: 'center',
        alignItems: 'center',
      },
      profileBadgeIcon: {width: 20, height: 20},
      profileEditText: {
        marginTop: getResponsiveHeight(6),
        fontSize: getResponsiveFontSize(12),
        fontFamily: FONTS.MEDIUM,
        color: BOTTOM_SHEET_EDITOR_COLORS.caption,
        letterSpacing: -0.15,
      },
      birthPickWrap: {
        alignSelf: 'stretch',
        borderWidth: 1,
        borderColor: shellBorder,
        borderRadius: getResponsiveWidth(12),
        backgroundColor: shellBg,
        paddingHorizontal: getResponsiveWidth(12),
        paddingVertical: getResponsiveHeight(12),
        marginTop: getResponsiveHeight(4),
        justifyContent: 'center',
      },
      birthPickWrapFocused: {
        borderColor: '#FFC84D',
      },
      birthPickText: {
        fontSize: getResponsiveFontSize(16),
        fontFamily: FONTS.REGULAR,
        color: colors.textPrimary,
        letterSpacing: -0.2,
      },
      birthPickPlaceholder: {
        color: BOTTOM_SHEET_EDITOR_COLORS.muted,
      },
      /** 라벨·ⓘ 한 묶음(세로 가운데 정렬) + 말풍선을 형제로 두어 입력칸과 겹침 최소화 */
      birthLabelRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      },
      birthTitleWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
      },
      birthInfoIconTouchable: {
        marginLeft: getResponsiveWidth(5),
        paddingHorizontal: getResponsiveWidth(2),
        paddingVertical: getResponsiveHeight(2),
        justifyContent: 'center',
        alignItems: 'center',
      },
      birthInfoIconText: {
        fontSize: getResponsiveFontSize(12.5),
        fontFamily: FONTS.MEDIUM,
        color: BOTTOM_SHEET_EDITOR_COLORS.muted,
        lineHeight: getResponsiveFontSize(16),
      },
      birthTooltipBubble: {
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 10,
        alignSelf: 'flex-start',
        marginTop: 2,
        paddingHorizontal: getResponsiveWidth(10),
        paddingVertical: getResponsiveHeight(8),
        borderRadius: getResponsiveWidth(10),
        backgroundColor: '#FFFFFF',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#E5E7EB',
        ...(Platform.OS === 'ios'
          ? {
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 1},
              shadowOpacity: 0.05,
              shadowRadius: 3,
            }
          : {elevation: 1}),
      },
      birthTooltipText: {
        fontSize: getResponsiveFontSize(11.5),
        fontFamily: FONTS.REGULAR,
        color: '#4B5563',
        letterSpacing: -0.15,
        lineHeight: getResponsiveHeight(17),
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
        fontFamily: FONTS.MEDIUM,
        color: BOTTOM_SHEET_EDITOR_COLORS.sub,
      },
    });
  }, [colors, isDark]);

  // input 데이터는 ref로 (불필요 리렌더 방지)
  const nameRef = useRef('');
  const traitRef = useRef('');
  const imageUrlRef = useRef('');

  const [previewImage, setPreviewImage] = useState('');
  const [nameKey, setNameKey] = useState(0);
  const [traitKey, setTraitKey] = useState(0);
  const [traitLength, setTraitLength] = useState(0);
  const TRAIT_MAX = 50;
  const [birthDate, setBirthDate] = useState(null);
  const [isBirthPickerOpen, setIsBirthPickerOpen] = useState(false);
  const [birthTooltipVisible, setBirthTooltipVisible] = useState(false);

  const initialDataRef = useRef({name: '', trait: '', image: '', birth: ''});
  const modalRef = useRef(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [_footerHeight, setFooterHeight] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isTraitFocused, setIsTraitFocused] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [traitDraft, setTraitDraft] = useState('');
  const [imageDraft, setImageDraft] = useState('');

  const nameInputRef = useRef(null);
  const traitInputRef = useRef(null);
  const maxBirthDate = useMemo(() => new Date(), []);
  const birthDisplayText = useMemo(
    () => (birthDate ? formatDateYmd(birthDate) : ''),
    [birthDate],
  );
  /** `handleSave`와 동일 기준(name/trait/image ref + birth state) — state는 입력 시 리렌더용 */
  const hasChanges = useMemo(() => {
    const {
      name: initialName,
      trait: initialTrait,
      image: initialImage,
      birth: initialBirth,
    } = initialDataRef.current;

    const trimmedName = String(nameRef.current ?? '').trim();
    const initialNameStr = String(initialName ?? '').trim();
    const finalName =
      trimmedName.length > 0 ? trimmedName : initialNameStr;

    const trimmedTrait = String(traitRef.current ?? '').trim();
    const initialTraitStr = String(initialTrait ?? '').trim();
    const finalTrait =
      trimmedTrait.length > 0 ? trimmedTrait : initialTraitStr;

    const rawImg =
      (imageUrlRef.current && String(imageUrlRef.current).trim().length > 0
        ? String(imageUrlRef.current).trim()
        : String(initialImage ?? '')) || '';
    const finalImage = normalizeImageForSave(rawImg);
    const initialImageNormalized = normalizeImageForSave(
      String(initialImage ?? ''),
    );

    const birthBaseline =
      coerceBirthToYmd(initialBirth) ?? String(initialBirth ?? '').trim();
    const birthDraft =
      birthDate != null ? formatDateYmd(birthDate) : birthBaseline;

    return (
      finalName !== initialNameStr ||
      finalTrait !== initialTraitStr ||
      finalImage !== initialImageNormalized ||
      birthDraft !== birthBaseline
    );
  }, [
    nameDraft,
    traitDraft,
    imageDraft,
    birthDate,
    traitLength,
    selectedUser?.userId,
    selectedUser?.id,
  ]);

  const blurAllInputs = useCallback(() => {
    try {
      nameInputRef.current?.blur?.();
      traitInputRef.current?.blur?.();
    } catch {
      null;
    }
    setIsNameFocused(false);
    setIsTraitFocused(false);
    setIsBirthPickerOpen(false);
  }, []);

  const fontMode = useReduxFontMode();
  const insets = useSafeAreaInsets();
  const bottomSafe = useMemo(
    () => getBottomSheetEditorBottomSafe(insets.bottom, getResponsiveHeight),
    [insets.bottom],
  );

  const familyUserList = useSelector(
    state => state?.userFamily?.familyUserList ?? [],
  );

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

  const sheetKey = useMemo(() => {
    return `user-flow-${String(fontMode ?? '')}-${
      selectedUser?.userId ?? 'none'
    }`;
  }, [fontMode, selectedUser?.userId]);

  const sheetSnapPoints = useMemo(
    () => getUserBottomSheetSnapPoints(fontMode),
    [fontMode],
  );

  /** iOS: 하단 버튼 고정을 위해 시트 전체 상승 비활성화. Android: 기존 bottomInset 정책. */
  const sheetKeyboardProps = useMemo(() => {
    if (Platform.OS === 'ios') {
      return {
        keyboardBehavior: 'interactive',
        keyboardBlurBehavior: 'restore',
        enableKeyboardPolicy: false,
      };
    }
    return {
      keyboardBehavior: 'none',
      keyboardBlurBehavior: 'none',
      enableKeyboardPolicy: true,
    };
  }, []);

  const closeSheet = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    blurAllInputs();
    modalRef.current?.dismiss?.();
  }, [isClosing, blurAllInputs]);

  useImperativeHandle(ref, () => ({
    present: () => {
      setIsClosing(false);
      setIsSaving(false);
      setIsNameFocused(false);
      setIsTraitFocused(false);
      setIsBirthPickerOpen(false);
      setBirthTooltipVisible(false);
      hideToast();

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
    const b = selectedUser.birth ?? '';

    initialDataRef.current = {name: n, trait: t, image: img, birth: b};

    nameRef.current = n;
    traitRef.current = t;
    imageUrlRef.current = img;
    setBirthDate(parseBirthYmdToLocalDate(b) || null);
    setNameDraft(n);
    setTraitDraft(t);
    setImageDraft(img);

    const preview =
      img && img.length > 0
        ? img.startsWith('http') || img.startsWith('file')
          ? img
          : `${CLOUD_FRONT}${img}`
        : '';

    setPreviewImage(preview);
    setNameKey(k => k + 1);
    setTraitKey(k => k + 1);
    setTraitLength(t.length);
    setIsNameFocused(false);
    setIsTraitFocused(false);
    setBirthTooltipVisible(false);

  }, [selectedUser]);

  /**
   * 버벅 제거 핵심:
   * - 내부 탭에서는 snapToIndex 절대 금지
   * - shift만 0으로 리셋
   * - 키보드 dismiss는 Layout이 담당(dismissKeyboardOnPress=true)
   */
  const handleTouchInsideResetOnly = useCallback(() => {
    if (!isNameFocused && !isTraitFocused && !isBirthPickerOpen) return;
    if (touchLockRef.current) return;
    lockTouchBriefly();
    blurAllInputs();
    hideToast();
  }, [
    lockTouchBriefly,
    hideToast,
    blurAllInputs,
    isNameFocused,
    isTraitFocused,
    isBirthPickerOpen,
  ]);

  const openBirthPicker = useCallback(() => {
    if (isSaving) return;
    hideToast();
    setBirthTooltipVisible(false);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: birthDate || new Date(2000, 0, 1),
        mode: 'date',
        display: 'spinner',
        maximumDate: maxBirthDate,
        minimumDate: BIRTH_MIN,
        onChange: (event, selectedDate) => {
          if (event?.type === 'dismissed' || !selectedDate) return;
          setBirthDate(selectedDate);
        },
      });
    } else {
      setIsBirthPickerOpen(true);
    }
  }, [isSaving, hideToast, birthDate, maxBirthDate]);

  const handleImagePick = useCallback(async () => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (!result.assets?.length) return;

    const selectedAsset = result.assets[0];
    let fileUri = selectedAsset.uri || '';
    let fileName = selectedAsset.fileName || `img_${Date.now()}.jpg`;

    if (fileUri.startsWith('http')) {
      imageUrlRef.current = fileUri;
      setImageDraft(fileUri);
      setPreviewImage(fileUri);
      return;
    }

    if (!/\.[a-zA-Z0-9]+$/.test(fileName)) fileName = `${fileName}.jpg`;

    const prevPreview = previewImage;
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
      setImageDraft(fileName);
      setPreviewImage(`${CLOUD_FRONT}${fileName}`);
    } catch (err) {
      setPreviewImage(prevPreview);
      showToast('이미지 업로드 중 문제가 발생했어요.');
    }
  }, [showToast]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const {
        name: initialName,
        trait: initialTrait,
        image: initialImage,
        birth: initialBirth,
      } = initialDataRef.current;

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
        if (
          myId != null &&
          memberId != null &&
          String(memberId) === String(myId)
        ) {
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
      const finalBirth = birthDate
        ? formatDateYmd(birthDate)
        : String(initialBirth ?? '').trim();

      await onSave?.(finalName, finalTrait, finalImageUrl, finalBirth);

      closeSheet();
    } catch (err) {
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
    birthDate,
  ]);

  const resetDraftFromInitial = useCallback(() => {
    const {name, trait, image, birth} = initialDataRef.current;

    nameRef.current = name;
    traitRef.current = trait;
    imageUrlRef.current = image;
    setBirthDate(parseBirthYmdToLocalDate(birth) || null);
    setNameDraft(name);
    setTraitDraft(trait);
    setImageDraft(image);

    const preview =
      image && image.length > 0
        ? image.startsWith('http')
          ? image
          : `${CLOUD_FRONT}${image}`
        : '';

    setPreviewImage(preview);
    setNameKey(k => k + 1);
    setTraitKey(k => k + 1);
    setTraitLength(String(trait ?? '').length);
    setBirthTooltipVisible(false);
  }, []);

  const footerProps = useMemo(
    () => ({
      onSave: handleSave,
      saveLabel: isSaving
        ? BOTTOM_SHEET_BUTTON_LABELS.SAVE_LOADING
        : BOTTOM_SHEET_BUTTON_LABELS.APPLY_ACTION,
      autoCloseOnSave: false,
      saveButtonStyle: getBottomSheetPrimarySaveButtonStyle(
        getResponsiveHeight,
        getResponsiveIconSize,
      ),
      buttonRowStyle: {marginTop: 0},
      saveDisabled: !hasChanges || isSaving || isClosing,
    }),
    [handleSave, isSaving, hasChanges, isClosing],
  );

  const handleDismiss = useCallback(() => {
    resetDraftFromInitial();
    setIsClosing(false);
    setIsSaving(false);
    setIsNameFocused(false);
    setIsTraitFocused(false);
    hideToast();

    onDismiss?.();
  }, [resetDraftFromInitial, onDismiss, hideToast]);

  return (
    <>
      <BottomSheetLayout
        modalRef={modalRef}
        snapPoints={sheetSnapPoints}
        sheetKey={sheetKey}
        title={BOTTOM_SHEET_TITLES.USER_PROFILE_EDIT}
        headerCentered={true}
        useInternalScroll={false}
        enableContentPanningGesture={true}
        androidKeyboardInputMode="adjustNothing"
        keyboardOpenSnapIndex={0}
        keyboardCloseSnapIndex={0}
        {...sheetKeyboardProps}
        dismissKeyboardOnPress={true}
        onTouchInside={handleTouchInsideResetOnly}
        onDismiss={handleDismiss}
        containerStyle={{paddingHorizontal: getResponsiveWidth(20)}}
        disableContentBottomPadding={true}>
        <BottomSheetScrollView
          style={{flex: 1}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{paddingBottom: getResponsiveHeight(8)}}>
          <View>
            <View style={styles.body}>
              <SpringPressable
                style={styles.profileTouchArea}
                onPress={handleImagePick}
                activeOpacity={0.9}
                disabled={isSaving}>
                <View style={styles.profileimageContainer}>
                  <FastImage
                    fallback={true}
                    source={previewImage ? {uri: previewImage} : IMG_DEFAULT}
                    style={styles.profileImage}
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
                <AppText
                  allowFontScaling={false}
                  style={styles.profileEditText}>
                  사진 변경
                </AppText>
              </SpringPressable>

              <View style={styles.fieldBlock}>
                <AppText allowFontScaling={false} style={styles.sectionLabel}>
                  별명
                </AppText>
                <View
                  style={[
                    styles.nameUnderlineWrap,
                    isNameFocused && styles.nameUnderlineWrapFocused,
                  ]}>
                  <CustomInput
                    bottomSheet
                    allowFontScaling={false}
                    disableFocusStyle={true}
                    disableBaseStyle={true}
                    ref={nameInputRef}
                    key={`name-${nameKey}`}
                    style={styles.inputName}
                    defaultValue={nameRef.current}
                    onChangeText={text => {
                      nameRef.current = text;
                      setNameDraft(text);
                    }}
                    placeholder="가족들이 부르는 이름을 적어주세요."
                    placeholderTextColor={BOTTOM_SHEET_EDITOR_COLORS.muted}
                    returnKeyType="next"
                    underlineColorAndroid="transparent"
                    onFocus={() => {
                      setIsNameFocused(true);
                    }}
                    onBlur={() => {
                      setIsNameFocused(false);
                    }}
                    onSubmitEditing={() => traitInputRef.current?.focus?.()}
                    editable={!isSaving}
                  />
                </View>
              </View>

              <View style={[styles.fieldBlock, {zIndex: 1}]}>
                <View style={{position: 'relative', zIndex: 1}}>
                  <View style={styles.birthLabelRow}>
                    <View style={styles.birthTitleWithIcon}>
                      <AppText allowFontScaling={false} style={styles.sectionLabel}>
                        생년월일
                      </AppText>
                      <SpringPressable
                        style={styles.birthInfoIconTouchable}
                        activeOpacity={0.7}
                        disabled={isSaving}
                        accessibilityRole="button"
                        accessibilityLabel={
                          birthTooltipVisible
                            ? '생년월일 안내 닫기'
                            : '생년월일 안내 보기'
                        }
                        accessibilityState={{expanded: birthTooltipVisible}}
                        onPress={() => setBirthTooltipVisible(v => !v)}
                        hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}>
                        <AppText
                          allowFontScaling={false}
                          style={styles.birthInfoIconText}>
                          ⓘ
                        </AppText>
                      </SpringPressable>
                    </View>
                  </View>
                  {birthTooltipVisible ? (
                    <View
                      accessibilityLiveRegion="polite"
                      pointerEvents="none"
                      style={styles.birthTooltipBubble}>
                      <AppText
                        allowFontScaling={false}
                        style={styles.birthTooltipText}>
                        입력하면 일정 화면에서 생일이 기념일로 표시돼요.
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <SpringPressable
                  activeOpacity={0.9}
                  onPress={openBirthPicker}
                  disabled={isSaving}>
                  <View
                    style={[
                      styles.birthPickWrap,
                      isBirthPickerOpen && styles.birthPickWrapFocused,
                    ]}>
                    <AppText
                      allowFontScaling={false}
                      style={[
                        styles.birthPickText,
                        !birthDisplayText && styles.birthPickPlaceholder,
                      ]}>
                      {birthDisplayText || '생년월일을 선택해주세요'}
                    </AppText>
                  </View>
                </SpringPressable>
              </View>

              <View style={styles.fieldBlock}>
                <AppText allowFontScaling={false} style={styles.sectionLabel}>
                  이런 사람이에요
                </AppText>
                <View
                  style={[
                    styles.inputUnderlineWrap,
                    isTraitFocused && styles.inputUnderlineWrapFocused,
                  ]}>
                  <CustomInput
                    bottomSheet
                    allowFontScaling={false}
                    disableFocusStyle={true}
                    disableBaseStyle={true}
                    ref={traitInputRef}
                    key={`trait-${traitKey}`}
                    style={styles.inputTrait}
                    defaultValue={traitRef.current}
                    multiline
                    scrollEnabled={true}
                    nestedScrollEnabled={Platform.OS === 'android'}
                    onChangeText={text => {
                      traitRef.current = text;
                      setTraitDraft(text);
                      setTraitLength(text.length);
                    }}
                    placeholder="성격이나 특징을 짧게 적어보세요."
                    placeholderTextColor={BOTTOM_SHEET_EDITOR_COLORS.muted}
                    underlineColorAndroid="transparent"
                    onFocus={() => {
                      setIsTraitFocused(true);
                    }}
                    onBlur={() => {
                      setIsTraitFocused(false);
                    }}
                    editable={!isSaving}
                  />
                </View>
                <AppText
                  allowFontScaling={false}
                  style={[
                    styles.traitCounter,
                    traitLength > TRAIT_MAX && styles.traitCounterOver,
                  ]}>
                  {traitLength}/{TRAIT_MAX}
                </AppText>
              </View>

              {isSaving && (
                <View style={styles.loadingOverlay} pointerEvents="none">
                  <View style={styles.loadingBox}>
                    <ActivityIndicator
                      size="small"
                      color={BOTTOM_SHEET_EDITOR_COLORS.sub}
                    />
                    <AppText
                      allowFontScaling={false}
                      style={styles.loadingText}>
                      저장 중...
                    </AppText>
                  </View>
                </View>
              )}
            </View>
          </View>
        </BottomSheetScrollView>
        <BottomSheetFooterButtons
          bottomSafe={bottomSafe}
          includeBottomSafePadding={true}
          excludeSafeForMeasure={false}
          onLayoutHeight={setFooterHeight}
          style={styles.footerFlow}
          {...footerProps}
        />
      </BottomSheetLayout>

      {Platform.OS === 'ios' && (
        <DatePicker
          modal
          open={isBirthPickerOpen}
          date={birthDate || new Date(2000, 0, 1)}
          mode="date"
          title="생년월일 선택"
          confirmText="확인"
          cancelText="취소"
          maximumDate={maxBirthDate}
          minimumDate={BIRTH_MIN}
          locale="ko"
          onConfirm={date => {
            setIsBirthPickerOpen(false);
            setBirthDate(date);
          }}
          onCancel={() => setIsBirthPickerOpen(false)}
        />
      )}

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
