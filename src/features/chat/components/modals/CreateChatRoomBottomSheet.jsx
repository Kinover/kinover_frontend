/* eslint-disable react-native/no-inline-styles */
// src/features/chat/components/CreateChatRoomBottomSheet.jsx

import React, {useMemo, useCallback, useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Keyboard,
  InteractionManager,
} from 'react-native';
import AppText from 'components/AppText';

import {useReduxFontMode} from 'hooks/useReduxFontMode';

import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import BottomSheetFooterButtons from 'components/bottomSheet/BottomSheetFooterButtons';
import {
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import CustomInput from 'components/CustomInput';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';
import {
  getCreateRoomBottomSheetSnapPoints,
} from 'utils/layoutMetrics';
import {BOTTOMSHEET_STYLE} from 'styles/style';
import {
  getBottomSheetEditorSharedStyles,
} from 'components/bottomSheet/bottomSheetEditorSharedStyles';

import ToastModal from 'components/modal/ToastModal';
import BOTTOM_SHEET_TITLES, {
  BOTTOM_SHEET_BUTTON_LABELS,
} from 'constants/bottomSheetTitles';
import {validateLength} from 'utils/validation';
import {FONTS} from 'styles/typography';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

function RequiredFieldLabel({label, style, requiredMarkStyle}) {
  return (
    <AppText
      allowFontScaling={false}
      style={style}
      accessibilityRole="text"
      accessibilityLabel={`${label} 필수`}>
      {label}{' '}
      <AppText
        allowFontScaling={false}
        style={requiredMarkStyle}
        accessibilityElementsHidden
        importantForAccessibility="no">
        *
      </AppText>
    </AppText>
  );
}

export default function CreateChatRoomBottomSheet({
  modalRef,
  members = [],
  initialRoomName = '',
  initialSelectedIds = [],
  onSubmit,
  onCancel,
  maxRoomNameLength = 30,
  snapPoints: externalSnapPoints,
}) {
  const shared = getBottomSheetEditorSharedStyles(
    getResponsiveFontSize,
    getResponsiveHeight,
    getResponsiveWidth,
  );
  const styles = useScaledStyleSheet(rf => ({
    body: {
      paddingTop: getResponsiveHeight(20),
      paddingBottom: getResponsiveHeight(6),
    },

    label: {
      fontSize: BOTTOMSHEET_STYLE().sectionLabel.fontSize,
      fontFamily: BOTTOMSHEET_STYLE().sectionLabel.fontFamily,
      color: BOTTOMSHEET_STYLE().sectionLabel.color,
      marginBottom: BOTTOMSHEET_STYLE().sectionLabel.marginBottom,
      marginTop: BOTTOMSHEET_STYLE().sectionLabel.marginTop,
    },
    requiredMark: {
      color: '#EF4444',
      fontFamily: FONTS.SEMI_BOLD,
    },

    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    countText: {
      fontSize: rf(12),
      fontFamily: FONTS.SEMI_BOLD,
      color: '#566073',
    },

    inputWrap: {
      ...shared.singleLineUnderlineWrap,
    },
    inputWrapFocused: {
      ...shared.singleLineUnderlineWrapFocused,
    },
    input: {
      minHeight: getResponsiveHeight(30),
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
      includeFontPadding: false,
      fontSize: rf(16),
      fontFamily: FONTS.REGULAR,
      color: '#0B1220',
      lineHeight: rf(21),
      letterSpacing: -0.18,
      textAlign: 'left',
      textAlignVertical: 'center',
    },

    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      marginTop: 0,
      rowGap: getResponsiveHeight(10),
      columnGap: getResponsiveWidth(8),
    },

    chip: {
      paddingVertical: getResponsiveHeight(10),
      paddingHorizontal: getResponsiveWidth(18),
      borderRadius: 999,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },

    chipSelected: {
      backgroundColor: '#FFC84D',
    },

    chipDisabled: {
      opacity: 0.45,
    },

    chipText: {
      fontSize: rf(13.5),
      fontFamily: FONTS.MEDIUM,
      color: '#6B7280',
      letterSpacing: -0.15,
    },

    chipTextSelected: {
      color: '#111827',
      fontFamily: FONTS.SEMI_BOLD,
    },

    chipTextDisabled: {
      color: '#9CA3AF',
    },

    tipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveWidth(8),
      marginTop: getResponsiveHeight(6),
    },
    tipDot: {
      width: getResponsiveWidth(6),
      height: getResponsiveWidth(6),
      borderRadius: 999,
      backgroundColor: '#FFB020',
    },
    tipText: {
      fontSize: rf(11.5),
      fontFamily: FONTS.MEDIUM,
      color: '#566073',
    },

    footerFlow: {
      alignSelf: 'stretch',
      width: '100%',
      paddingTop: getResponsiveHeight(10),
      paddingBottom: getResponsiveHeight(2),
    },
  }));
  const fontMode = useReduxFontMode();
  const insets = useSafeAreaInsets();
  const bottomSafe = useMemo(
    () => Math.max(Number(insets.bottom || 0), getResponsiveHeight(24)),
    [insets.bottom],
  );

  // roomName: ref로만 관리
  const roomNameRef = useRef(String(initialRoomName ?? ''));
  const [roomNameKey, setRoomNameKey] = useState(0);

  const [selectedIds, setSelectedIds] = useState(
    Array.isArray(initialSelectedIds) ? initialSelectedIds : [],
  );

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const [footerHeight, setFooterHeight] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRoomNameFocused, setIsRoomNameFocused] = useState(false);
  const roomNameInputRef = useRef(null);
  const roomNameFocusInteractionRef = useRef(false);
  const roomNameFocusInteractionTimerRef = useRef(null);
  const markRoomNameFocusInteraction = useCallback(() => {
    roomNameFocusInteractionRef.current = true;
    if (roomNameFocusInteractionTimerRef.current) {
      clearTimeout(roomNameFocusInteractionTimerRef.current);
    }
    roomNameFocusInteractionTimerRef.current = setTimeout(() => {
      roomNameFocusInteractionRef.current = false;
    }, 220);
  }, []);

  // 키보드 열림 추적
  const keyboardOpenRef = useRef(false);

  // inside tap throttle
  const touchLockRef = useRef(false);
  const touchLockTimerRef = useRef(null);
  const lockTouchBriefly = useCallback(() => {
    touchLockRef.current = true;
    if (touchLockTimerRef.current) clearTimeout(touchLockTimerRef.current);
    touchLockTimerRef.current = setTimeout(() => {
      touchLockRef.current = false;
    }, 180);
  }, []);

  // 키보드 닫힘 이후 실행할 지연 액션
  const pendingActionRef = useRef(null);

  const pendingInteractionRef = useRef(null);

  const showToast = useCallback(msg => {
    const m = String(msg ?? '');
    setToastMessage(m);
    setToastVisible(true);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 1600);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = null;
    setToastVisible(false);
  }, []);

  // initialRoomName 변경 시 ref 갱신 + input 리마운트
  useEffect(() => {
    roomNameRef.current = String(initialRoomName ?? '');
    setRoomNameKey(k => k + 1);
  }, [initialRoomName]);

  useEffect(() => {
    setSelectedIds(Array.isArray(initialSelectedIds) ? initialSelectedIds : []);
  }, [initialSelectedIds]);

  // 키보드 상태 tracking + pending flush
  useEffect(() => {
    const onShow = () => {
      keyboardOpenRef.current = true;
    };

    const onHide = () => {
      keyboardOpenRef.current = false;
      // setIsRoomNameFocused(false);

      if (pendingActionRef.current) {
        const fn = pendingActionRef.current;
        pendingActionRef.current = null;

        if (pendingInteractionRef.current) {
          try {
            pendingInteractionRef.current.cancel?.();
          } catch (e) {
            // noop: pending interaction cancel 실패는 UX에 영향 없음
          }
          pendingInteractionRef.current = null;
        }

        pendingInteractionRef.current = InteractionManager.runAfterInteractions(
          () => {
            pendingInteractionRef.current = null;
            try {
              fn?.();
            } catch (e) {
            }
          },
        );
      }
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
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (touchLockTimerRef.current) clearTimeout(touchLockTimerRef.current);
      if (roomNameFocusInteractionTimerRef.current) {
        clearTimeout(roomNameFocusInteractionTimerRef.current);
      }

      pendingActionRef.current = null;

      if (pendingInteractionRef.current) {
        try {
          pendingInteractionRef.current.cancel?.();
        } catch (e) {
          // noop: cleanup 단계에서 cancel 실패 무시
        }
        pendingInteractionRef.current = null;
      }
    };
  }, []);

  // enabledMembers / enabledIds
  const enabledMembers = useMemo(
    () => (members || []).filter(m => !m?.disabled),
    [members],
  );

  const enabledIds = useMemo(
    () => enabledMembers.map(m => m.id).filter(v => v != null),
    [enabledMembers],
  );

  useEffect(() => {
    const valid = new Set(
      (members || []).filter(m => m?.id != null && !m?.disabled).map(m => m.id),
    );

    setSelectedIds(prev => {
      const prevArr = Array.isArray(prev) ? prev : [];
      const next = prevArr.filter(id => valid.has(id));

      if (next.length !== prevArr.length) return next;
      for (let i = 0; i < next.length; i += 1) {
        if (next[i] !== prevArr[i]) return next;
      }
      return prev;
    });
  }, [members]);

  const isAllSelected = useMemo(() => {
    if (enabledIds.length === 0) return false;
    return enabledIds.every(id => selectedIds.includes(id));
  }, [enabledIds, selectedIds]);

  const selectedCount = useMemo(() => {
    if (isAllSelected) return enabledIds.length;
    return selectedIds.length;
  }, [isAllSelected, enabledIds.length, selectedIds.length]);

  const canSave = useMemo(() => selectedIds.length > 0, [selectedIds.length]);

  const selectedNames = useMemo(() => {
    return (members || [])
      .filter(m => m?.id != null && selectedIds.includes(m.id) && !m?.disabled)
      .map(m => String(m.name ?? '').trim())
      .filter(Boolean);
  }, [members, selectedIds]);

  const roomNamePlaceholder = useMemo(() => {
    if (selectedNames.length === 0) return '비워두면 기본 이름으로 생성돼요';
    return `예: ${selectedNames.join(', ')}`;
  }, [selectedNames]);

  // snapPoints
  const resolvedSnapPoints = useMemo(() => {
    return getCreateRoomBottomSheetSnapPoints(fontMode, externalSnapPoints);
  }, [externalSnapPoints, fontMode]);

  const sheetKey = useMemo(() => {
    return `create-room-fixed-${String(fontMode ?? '')}`;
  }, [fontMode]);

  /** iOS: 하단 버튼 고정을 위해 시트 전체 상승 비활성화. Android: 기존 bottomInset 정책 유지. */
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

  // 키보드 열려있을 때 상태 변경 지연
  const runAfterKeyboardHide = useCallback(fn => {
    if (keyboardOpenRef.current) {
      pendingActionRef.current = fn;
      Keyboard.dismiss();
      return;
    }
    fn?.();
  }, []);

  const toggleMemberNow = useCallback(member => {
    if (!member || member.disabled) return;

    setSelectedIds(prev => {
      const prevArr = Array.isArray(prev) ? prev : [];
      const has = prevArr.includes(member.id);
      if (has) return prevArr.filter(x => x !== member.id);
      return [...prevArr, member.id];
    });
  }, []);

  const toggleAllNow = useCallback(() => {
    setSelectedIds(prev => {
      const prevArr = Array.isArray(prev) ? prev : [];
      if (enabledIds.length === 0) return prevArr;

      if (isAllSelected) {
        return prevArr.filter(id => !enabledIds.includes(id));
      }
      return Array.from(new Set([...prevArr, ...enabledIds]));
    });
  }, [enabledIds, isAllSelected]);

  const toggleMember = useCallback(
    member => runAfterKeyboardHide(() => toggleMemberNow(member)),
    [runAfterKeyboardHide, toggleMemberNow],
  );

  const toggleAll = useCallback(
    () => runAfterKeyboardHide(() => toggleAllNow()),
    [runAfterKeyboardHide, toggleAllNow],
  );

  const handleSave = useCallback(async () => {
    if (isSubmitting) return;

    if (!canSave) {
      showToast('구성원을 선택해주세요.');
      return;
    }

    const trimmed = String(roomNameRef.current ?? '').trim();
    const lengthResult = validateLength(trimmed, {max: maxRoomNameLength});
    if (trimmed.length > 0 && !lengthResult.valid) {
      showToast(lengthResult.message);
      return;
    }

    setIsSubmitting(true);

    const safeUserIds = Array.from(new Set(selectedIds)).filter(v => v != null);

    const payload =
      trimmed.length > 0
        ? {roomName: trimmed, userIds: safeUserIds}
        : {userIds: safeUserIds};

    try {
      await onSubmit?.(payload);
      hideToast();
      modalRef?.current?.dismiss?.();
    } catch (e) {
      showToast('채팅방 생성에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    canSave,
    selectedIds,
    onSubmit,
    showToast,
    hideToast,
    modalRef,
  ]);

  const handleCancel = useCallback(() => {
    roomNameRef.current = String(initialRoomName ?? '');
    setRoomNameKey(k => k + 1);
    setIsRoomNameFocused(false);

    setSelectedIds(Array.isArray(initialSelectedIds) ? initialSelectedIds : []);
    hideToast();
    onCancel?.();
    modalRef?.current?.dismiss?.();
  }, [initialRoomName, initialSelectedIds, hideToast, modalRef, onCancel]);

  const memberChipData = useMemo(() => {
    const normalized = (members || []).map(m => ({
      type: 'USER',
      id: m?.id,
      name: m?.name ?? '',
      disabled: !!m?.disabled,
    }));

    return [
      {
        type: 'ALL',
        id: '__ALL__',
        name: '전체',
        disabled: enabledIds.length === 0 || isSubmitting,
      },
      ...normalized,
    ];
  }, [members, enabledIds.length, isSubmitting]);

  const renderMemberChip = useCallback(
    item => {
      const isAll = item.type === 'ALL';
      const selected = isAll ? isAllSelected : selectedIds.includes(item.id);

      const onPress = () => {
        if (item.disabled || isSubmitting) return;
        if (isAll) return toggleAll();
        return toggleMember({id: item.id, disabled: item.disabled});
      };

      return (
        <TouchableOpacity
          key={`${item.type}-${String(item.id)}`}
          activeOpacity={0.75}
          onPress={onPress}
          disabled={item.disabled || isSubmitting}
          hitSlop={{top: 4, bottom: 4, left: 2, right: 2}}
          style={[
            styles.chip,
            selected && styles.chipSelected,
            item.disabled && styles.chipDisabled,
          ]}>
          <AppText
            style={[
              styles.chipText,
              selected && styles.chipTextSelected,
              item.disabled && styles.chipTextDisabled,
            ]}
            numberOfLines={1}>
            {item.name}
          </AppText>
        </TouchableOpacity>
      );
    },
    [isAllSelected, selectedIds, toggleAll, toggleMember, isSubmitting],
  );

  const handleDismiss = useCallback(() => {
    hideToast();
    setIsSubmitting(false);
    setIsRoomNameFocused(false);
    keyboardOpenRef.current = false;
    pendingActionRef.current = null;

    if (pendingInteractionRef.current) {
      try {
        pendingInteractionRef.current.cancel?.();
      } catch (e) {
        // noop: dismiss 중 cancel 실패 무시
      }
      pendingInteractionRef.current = null;
    }
  }, [hideToast]);

  // 내부 탭: 토스트만 닫기(키보드 dismiss/snap은 Layout)
  const handleTouchInside = useCallback(() => {
    if (!keyboardOpenRef.current && !isRoomNameFocused) return;
    if (roomNameFocusInteractionRef.current) return;
    if (touchLockRef.current) return;
    lockTouchBriefly();
    roomNameInputRef.current?.blur?.();
    setIsRoomNameFocused(false);
    hideToast();
  }, [hideToast, lockTouchBriefly, isRoomNameFocused]);

  return (
    <>
      <BottomSheetLayout
        modalRef={modalRef}
        snapPoints={resolvedSnapPoints}
        defaultSnapPoints={resolvedSnapPoints}
        sheetKey={sheetKey}
        title={BOTTOM_SHEET_TITLES.CHAT_ROOM_CREATE}
        headerCentered={true}
        useInternalScroll={false}
        enableContentPanningGesture={true}
        disableContentBottomPadding={true}
        containerStyle={{paddingHorizontal: getResponsiveWidth(20)}}
        androidKeyboardInputMode="adjustNothing"
        keyboardOpenSnapIndex={0}
        keyboardCloseSnapIndex={0}
        {...sheetKeyboardProps}
        dismissKeyboardOnPress={true}
        onTouchInside={handleTouchInside}
        onDismiss={handleDismiss}>
        <BottomSheetScrollView
          style={{flex: 1}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{paddingBottom: getResponsiveHeight(8)}}>
          <View style={styles.body}>
            <View style={styles.sectionRow}>
              <AppText allowFontScaling={false} style={styles.label}>
                채팅방명
              </AppText>
            </View>

            <View
              style={[
                styles.inputWrap,
                isRoomNameFocused && styles.inputWrapFocused,
              ]}>
              <CustomInput
                bottomSheet
                disableFocusStyle={true}
                disableBaseStyle={true}
                ref={roomNameInputRef}
                key={`room-${roomNameKey}`}
                defaultValue={roomNameRef.current}
                onChangeText={t => {
                  roomNameRef.current = String(t).slice(0, maxRoomNameLength);
                }}
                onTouchStart={markRoomNameFocusInteraction}
                onFocus={() => {
                  markRoomNameFocusInteraction();
                  setIsRoomNameFocused(true);
                }}
                onBlur={() => setIsRoomNameFocused(false)}
                placeholder={roomNamePlaceholder}
                placeholderTextColor="#B0B6C3"
                style={styles.input}
                returnKeyType="done"
                autoCorrect={false}
                autoCapitalize="none"
                onSubmitEditing={() => Keyboard.dismiss()}
                editable={!isSubmitting}
              />
            </View>

            <View style={{marginTop: getResponsiveHeight(18)}}>
              <View style={styles.sectionRow}>
                <RequiredFieldLabel
                  label="구성원"
                  style={styles.label}
                  requiredMarkStyle={styles.requiredMark}
                />
              </View>

              <View style={styles.chipWrap}>
                {memberChipData.map(renderMemberChip)}
              </View>

            </View>
          </View>
        </BottomSheetScrollView>
        <BottomSheetFooterButtons
          bottomSafe={bottomSafe}
          includeBottomSafePadding={true}
          excludeSafeForMeasure={false}
          onLayoutHeight={setFooterHeight}
          style={styles.footerFlow}
          onCancel={handleCancel}
          onSave={handleSave}
          cancelLabel={BOTTOM_SHEET_BUTTON_LABELS.CANCEL}
          saveLabel={isSubmitting ? '만드는 중...' : '만들기'}
          showCancel
          autoCloseOnSave={false}
          disabled={isSubmitting}
          saveDisabled={!canSave}
        />
      </BottomSheetLayout>

      <ToastModal
        visible={toastVisible}
        onClose={hideToast}
        message={toastMessage}
      />
    </>
  );
}
