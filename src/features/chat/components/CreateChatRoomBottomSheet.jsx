/* eslint-disable react-native/no-inline-styles */
// src/features/chat/components/CreateChatRoomBottomSheet.jsx

import React, {useMemo, useCallback, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Keyboard,
  InteractionManager,
  SafeAreaView,
} from 'react-native';

import {useSelector} from 'react-redux';

import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import BottomSheetFooterButtons from 'components/bottomSheet/BottomSheetFooterButtons';
import {BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';
import {BOTTOMSHEET_STYLE} from 'styles/style';

import ToastModal from 'components/modal/ToastModal';

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
  const fontMode = useSelector(state => state.ui.fontMode);

  // ✅ roomName: ref로만 관리
  const roomNameRef = useRef(String(initialRoomName ?? ''));
  const [roomNameKey, setRoomNameKey] = useState(0);

  const [selectedIds, setSelectedIds] = useState(
    Array.isArray(initialSelectedIds) ? initialSelectedIds : [],
  );

  // ✅ Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ 키보드 열림 추적
  const keyboardOpenRef = useRef(false);

  // ✅ inside tap throttle
  const touchLockRef = useRef(false);
  const touchLockTimerRef = useRef(null);
  const lockTouchBriefly = useCallback(() => {
    touchLockRef.current = true;
    if (touchLockTimerRef.current) clearTimeout(touchLockTimerRef.current);
    touchLockTimerRef.current = setTimeout(() => {
      touchLockRef.current = false;
    }, 180);
  }, []);

  // ✅ 키보드 닫힘 이후 실행할 지연 액션
  const pendingActionRef = useRef(null);

  // ✅✅✅ 추가: 인터랙션 대기 핸들 (중복 예약/취소)
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

  // ✅ initialRoomName 변경 시 ref 갱신 + input 리마운트
  useEffect(() => {
    roomNameRef.current = String(initialRoomName ?? '');
    setRoomNameKey(k => k + 1);
  }, [initialRoomName]);

  useEffect(() => {
    setSelectedIds(Array.isArray(initialSelectedIds) ? initialSelectedIds : []);
  }, [initialSelectedIds]);

  // ✅ 키보드 상태 tracking + pending flush
  useEffect(() => {
    const onShow = () => {
      keyboardOpenRef.current = true;
    };

    const onHide = () => {
      keyboardOpenRef.current = false;

      if (pendingActionRef.current) {
        const fn = pendingActionRef.current;
        pendingActionRef.current = null;

        // ✅✅✅ 핵심: 키보드/바텀시트 애니메이션(인터랙션) 끝난 뒤 실행
        if (pendingInteractionRef.current) {
          try {
            pendingInteractionRef.current.cancel?.();
          } catch (e) {}
          pendingInteractionRef.current = null;
        }

        pendingInteractionRef.current = InteractionManager.runAfterInteractions(
          () => {
            pendingInteractionRef.current = null;
            try {
              fn?.();
            } catch (e) {
              console.error('❌ pending action error:', e);
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

  // ✅ cleanup
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (touchLockTimerRef.current) clearTimeout(touchLockTimerRef.current);

      pendingActionRef.current = null;

      if (pendingInteractionRef.current) {
        try {
          pendingInteractionRef.current.cancel?.();
        } catch (e) {}
        pendingInteractionRef.current = null;
      }
    };
  }, []);

  // ✅ enabledMembers / enabledIds
  const enabledMembers = useMemo(
    () => (members || []).filter(m => !m?.disabled),
    [members],
  );

  const enabledIds = useMemo(
    () => enabledMembers.map(m => m.id).filter(v => v != null),
    [enabledMembers],
  );

  // ✅ members 변동 시 selectedIds 정리(유령 선택 제거)
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

  // ✅ snapPoints
  const resolvedSnapPoints = useMemo(() => {
    if (Array.isArray(externalSnapPoints) && externalSnapPoints.length >= 2) {
      return externalSnapPoints;
    }
    if (Array.isArray(externalSnapPoints) && externalSnapPoints.length === 1) {
      return [externalSnapPoints[0], '92%'];
    }

    const fm = String(fontMode ?? '').toLowerCase();
    const isLarge = fm.includes('large') && !fm.includes('extra');
    const isXL = fm.includes('extra');

    if (isXL) return ['72%', '94%'];
    if (isLarge) return ['68%', '93%'];
    return ['56.5%', '92%'];
  }, [externalSnapPoints, fontMode]);

  const sheetKey = useMemo(() => {
    return `create-room-fixed-${String(fontMode ?? '')}`;
  }, [fontMode]);

  // ✅ 키보드 열려있을 때 상태 변경 지연
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

    setIsSubmitting(true);

    const trimmed = String(roomNameRef.current ?? '').trim();
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
      console.error('❌ 채팅방 생성 실패:', e);
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
          <Text
            allowFontScaling={false}
            style={[
              styles.chipText,
              selected && styles.chipTextSelected,
              item.disabled && styles.chipTextDisabled,
            ]}
            numberOfLines={1}>
            {item.name}
          </Text>
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
      } catch (e) {}
      pendingInteractionRef.current = null;
    }
  }, [hideToast]);

  // ✅ 내부 탭: 토스트만 닫기(키보드 dismiss/snap은 Layout)
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
        subtitle="가족을 초대해 대화를 나눠요."
        useInternalScroll={true}
        keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'none'}
        keyboardBlurBehavior="restore"
        androidKeyboardInputMode="adjustResize"
        enableKeyboardPolicy={true}
        keyboardOpenSnapIndex={1}
        keyboardCloseSnapIndex={0}
        useTouchOverlay={true}
        dismissKeyboardOnPress={true}
        onTouchInside={handleTouchInside}
        onDismiss={handleDismiss}
        // ✅✅✅ 핵심: 바깥(Backdrop) 눌러도 시트 닫히지 않게
      >
        <SafeAreaView style={{backgroundColor: '#fff'}}>
          <BottomSheetView>
            <View style={styles.body}>
              <View style={styles.sectionRow}>
                <Text allowFontScaling={false} style={styles.label}>
                  채팅방 이름(선택)
                </Text>
              </View>

              <View style={styles.inputWrap}>
                <BottomSheetTextInput
                  key={`room-${roomNameKey}`}
                  defaultValue={roomNameRef.current}
                  onChangeText={t => {
                    roomNameRef.current = String(t).slice(0, maxRoomNameLength);
                  }}
                  placeholder="비워두면 기본 이름으로 생성돼요"
                  placeholderTextColor="#B0B6C3"
                  allowFontScaling={false}
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
                  <Text allowFontScaling={false} style={styles.label}>
                    구성원
                  </Text>
                  <Text allowFontScaling={false} style={styles.countText}>
                    {selectedCount}명 선택
                  </Text>
                </View>

                <View style={styles.memberCard}>
                  <View style={styles.chipWrap}>
                    {memberChipData.map(renderMemberChip)}
                  </View>
                </View>

                <View style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text allowFontScaling={false} style={styles.tipText}>
                    최소 1명은 선택해야 저장할 수 있어요.
                  </Text>
                </View>
              </View>

              <BottomSheetFooterButtons
                bottomSafe={0}
                includeBottomSafePadding={true}
                excludeSafeForMeasure={false}
                onLayoutHeight={undefined}
                style={{paddingTop: getResponsiveHeight(10)}}
                bottomGap={getResponsiveHeight(8)}
                onCancel={handleCancel}
                onSave={handleSave}
                cancelLabel="되돌리기"
                saveLabel={isSubmitting ? '저장 중...' : '저장하기'}
                showCancel={true}
                bottomSheetRef={modalRef}
                autoCloseOnSave={false}
                disabled={isSubmitting}
              />
            </View>
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

const styles = StyleSheet.create({
  body: {
    paddingTop: getResponsiveHeight(6),
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
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: '#566073',
  },

  inputWrap: {
    width: '100%',
    borderRadius: getResponsiveWidth(14),
    backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical:
      Platform.OS === 'ios' ? getResponsiveHeight(12) : getResponsiveHeight(8),
  },
  input: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14.5),
    color: '#111827',
    padding: 0,
  },

  memberCard: {
    minHeight: getResponsiveHeight(120),
    marginTop: getResponsiveHeight(6),
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveWidth(18),
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(12),
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  chip: {
    height: getResponsiveHeight(34),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: getResponsiveWidth(8),
    maxWidth: getResponsiveWidth(140),
  },

  chipSelected: {
    backgroundColor: 'black',
    borderColor: 'black',
  },

  chipDisabled: {
    opacity: 0.45,
  },

  chipText: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#566073',
    letterSpacing: -0.2,
  },

  chipTextSelected: {
    color: '#FFFFFF',
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
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Medium',
    color: '#566073',
  },
});
