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
  ScrollView,
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
  getAndroidNavBottomInsetEstimate,
} from 'utils/layoutMetrics';
import {BOTTOMSHEET_STYLE} from 'styles/style';

import ToastModal from 'components/modal/ToastModal';
import {validateLength} from 'utils/validation';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

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

    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    countText: {
      fontSize: rf(12),
      fontFamily: 'Pretendard-SemiBold',
      color: '#566073',
    },

    inputWrap: {
      alignSelf: 'stretch',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(60, 60, 67, 0.28)',
      paddingBottom: 2,
    },
    input: {
      minHeight: getResponsiveHeight(36),
      paddingHorizontal: 0,
      paddingTop: Platform.OS === 'android' ? 2 : 4,
      paddingBottom: 2,
      borderWidth: 0,
      backgroundColor: 'transparent',
      includeFontPadding: false,
      fontSize: rf(15),
      fontFamily: 'Pretendard-Regular',
      color: '#0B1220',
      lineHeight: rf(22),
      letterSpacing: -0.18,
      textAlignVertical: 'top',
    },

    chipScroll: {
      alignSelf: 'stretch',
      maxHeight: getResponsiveHeight(40),
      marginTop: getResponsiveHeight(6),
    },

    chipScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: getResponsiveHeight(4),
      paddingRight: getResponsiveWidth(8),
      paddingLeft: 0,
      gap: getResponsiveWidth(10),
    },

    selectedTagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: getResponsiveHeight(10),
      gap: getResponsiveWidth(6),
    },
    selectedTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: getResponsiveWidth(8),
      paddingVertical: getResponsiveHeight(3),
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.07)',
    },
    selectedTagText: {
      fontSize: rf(11.5),
      fontFamily: 'Pretendard-SemiBold',
      color: '#0B1220',
      letterSpacing: -0.15,
    },

    chip: {
      height: getResponsiveHeight(32),
      paddingHorizontal: getResponsiveWidth(12),
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0, 0, 0, 0.07)',
      backgroundColor: '#F9FAFB',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      maxWidth: getResponsiveWidth(160),
    },

    chipSelected: {
      backgroundColor: '#000000',
      borderColor: '#000000',
    },

    chipDisabled: {
      opacity: 0.45,
    },

    chipText: {
      fontSize: rf(12.5),
      fontFamily: 'Pretendard-Medium',
      color: '#374151',
      letterSpacing: -0.15,
    },

    chipTextSelected: {
      color: '#FFFFFF',
      fontFamily: 'Pretendard-SemiBold',
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
      fontFamily: 'Pretendard-Medium',
      color: '#566073',
    },

    footerFlow: {
      alignSelf: 'stretch',
      width: '100%',
      paddingTop: getResponsiveHeight(20),
      paddingBottom: getResponsiveHeight(2),
    },
  }));
  const fontMode = useReduxFontMode();
  const insets = useSafeAreaInsets();
  const bottomSafe = useMemo(
    () => Math.max(Number(insets.bottom || 0), getResponsiveHeight(24)),
    [insets.bottom],
  );
  const androidFooterBottomPad = useMemo(() => {
    if (Platform.OS !== 'android') return 0;
    return Math.max(getAndroidNavBottomInsetEstimate(), getResponsiveHeight(8));
  }, []);

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

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setSelectedIds(Array.isArray(initialSelectedIds) ? initialSelectedIds : []);
    hideToast();
    onCancel?.();
  }, [initialRoomName, initialSelectedIds, hideToast, onCancel]);

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
          activeOpacity={0.85}
          onPress={onPress}
          disabled={item.disabled || isSubmitting}
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
            {selected ? `✓ ${item.name}` : item.name}
          </AppText>
        </TouchableOpacity>
      );
    },
    [isAllSelected, selectedIds, toggleAll, toggleMember, isSubmitting],
  );

  const handleDismiss = useCallback(() => {
    hideToast();
    setIsSubmitting(false);
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
    if (!keyboardOpenRef.current) return;
    if (touchLockRef.current) return;
    lockTouchBriefly();
    hideToast();
  }, [hideToast, lockTouchBriefly]);

  return (
    <>
      <BottomSheetLayout
        modalRef={modalRef}
        snapPoints={resolvedSnapPoints}
        defaultSnapPoints={resolvedSnapPoints}
        sheetKey={sheetKey}
        title="채팅방 생성"
        headerCentered={true}
        useInternalScroll={false}
        disableContentBottomPadding={true}
        containerStyle={{paddingHorizontal: getResponsiveWidth(20)}}
        keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'none'}
        keyboardBlurBehavior="restore"
        androidKeyboardInputMode="adjustResize"
        enableKeyboardPolicy={true}
        keyboardOpenSnapIndex={0}
        keyboardCloseSnapIndex={0}
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

            <View style={styles.inputWrap}>
              <CustomInput bottomSheet
                key={`room-${roomNameKey}`}
                defaultValue={roomNameRef.current}
                onChangeText={t => {
                  roomNameRef.current = String(t).slice(0, maxRoomNameLength);
                }}
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
                <AppText style={styles.label}>구성원</AppText>
              </View>

              <ScrollView
                horizontal
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.chipScrollContent}
                style={styles.chipScroll}>
                {memberChipData.map(renderMemberChip)}
              </ScrollView>

              {selectedNames.length > 0 && (
                <View style={styles.selectedTagsRow}>
                  {selectedNames.map(name => (
                    <View key={name} style={styles.selectedTag}>
                      <AppText style={styles.selectedTagText}>{name}</AppText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </BottomSheetScrollView>
        <BottomSheetFooterButtons
          bottomSafe={bottomSafe}
          includeBottomSafePadding={Platform.OS !== 'android'}
          excludeSafeForMeasure={false}
          onLayoutHeight={undefined}
          style={[
            styles.footerFlow,
            Platform.OS === 'android' && {
              paddingBottom: androidFooterBottomPad,
            },
          ]}
          onCancel={handleCancel}
          onSave={handleSave}
          cancelLabel="취소"
          saveLabel={isSubmitting ? '저장 중...' : '저장'}
          showCancel={true}
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
