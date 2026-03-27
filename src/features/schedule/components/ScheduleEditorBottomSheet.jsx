/* eslint-disable react-native/no-inline-styles */
// ScheduleEditorBottomSheetModal.jsx
// - 내부 탭에서 snapToIndex 제거(키보드 정책에 맡김)
// - 탭 연타 방지
// - Layout은 dismissKeyboardOnPress=true로 “키보드 열려있을 때만” dismiss 하도록

import AppText from 'components/AppText';
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Keyboard,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';
import {getKeyboardSafeGap, getScheduleBottomSheetSnapPoints} from 'utils/layoutMetrics';
import {useReduxFontMode} from 'hooks/useReduxFontMode';

import {useScheduleBottomSheetModal} from '../hooks/useScheduleBottomSheetModal';
import ToastModal from 'components/modal/ToastModal';
import CustomModal from 'components/modal/CustomModal';
import {validateLength} from 'utils/validation';
import {BottomSheetTextInput, BottomSheetScrollView} from '@gorhom/bottom-sheet';
import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import BottomSheetFooterButtons from 'components/bottomSheet/BottomSheetFooterButtons';
import {
  BOTTOM_SHEET_EDITOR_COLORS as COLORS,
  BOTTOM_SHEET_EDITOR_FLOW as FLOW,
  getBottomSheetEditorBottomSafe,
  getBottomSheetEditorSharedStyles,
  getBottomSheetPrimarySaveButtonStyle,
} from 'components/bottomSheet/bottomSheetEditorSharedStyles';
import {Easing} from 'react-native-reanimated';

const {height: WINDOW_H} = Dimensions.get('window');
const SAFE_GAP = getKeyboardSafeGap();

const KIND = {
  INDIVIDUAL: 'individual',
  FAMILY: 'family',
  ANNIVERSARY: 'anniversary',
};

const kindToScheduleType = kind => {
  switch (kind) {
    case KIND.INDIVIDUAL:
      return 'INDIVIDUAL';
    case KIND.FAMILY:
      return 'FAMILY';
    case KIND.ANNIVERSARY:
      return 'ANNIVERSARY';
    default:
      return 'INDIVIDUAL';
  }
};

/** 숫자·문자 ID 모두 유지 (더미 mock-mom 등 문자열 ID 지원) */
const uniqIds = arr =>
  Array.from(
    new Set(
      (arr || [])
        .map(v => (v != null && String(v).trim() !== '' ? v : null))
        .filter(v => v != null),
    ),
  );

const idEq = (a, b) => a === b || String(a) === String(b);
const hasId = (ids, id) => (Array.isArray(ids) ? ids : []).some(x => idEq(x, id));

const normalizeKind = raw => {
  const t = String(raw ?? '').toLowerCase();

  const isAnniv =
    t.includes('anniv') ||
    t.includes('anniversary') ||
    t.includes('기념') ||
    t === 'anniversary';

  if (isAnniv) return KIND.ANNIVERSARY;

  const isFamily =
    t.includes('family') || t.includes('shared') || t.includes('공동');

  if (isFamily) return KIND.FAMILY;

  if (
    t.includes('individual') ||
    t.includes('personal') ||
    t.includes('개별') ||
    t.includes('개인')
  ) {
    return KIND.INDIVIDUAL;
  }

  return KIND.INDIVIDUAL;
};

/** 중앙 히어로용: `2026년 3월 22일` (요일 없음) */
function formatScheduleDateShort(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const mo = raw.getMonth() + 1;
    const d = raw.getDate();
    return `${y}년 ${mo}월 ${d}일`;
  }
  const s = String(raw).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return `${y}년 ${mo}월 ${d}일`;
  }
  return s;
}

const ScheduleEditorBottomSheetModal = forwardRef(
  (
    {
      editingSchedule,
      familyUserList = [],
      currentUserId,
      familyId: familyIdProp,
      date: dateProp,
      memo: memoProp,
      selectedUserIds: selectedUserIdsProp,
      setSelectedUserIds: setSelectedUserIdsProp,
      title,
      setTitle,
      kind: kindProp,
      setKind: setKindProp,
      onSubmit,
      onDelete,
      onRefresh,
    },
    ref,
  ) => {
    const [localKind, setLocalKind] = useState(KIND.INDIVIDUAL);
    const [localSelectedUserIds, setLocalSelectedUserIds] = useState([]);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const closingRef = useRef(false);

    const shiftAnim = useRef(new Animated.Value(0)).current;
    const keyboardHeightRef = useRef(0);
    const inputRef = useRef(null);

    const tapToResetRef = useRef(false);
    const keyboardOpenRef = useRef(false);

    const touchLockRef = useRef(false);
    const touchLockTimerRef = useRef(null);
    const lockTouchBriefly = useCallback(() => {
      touchLockRef.current = true;
      if (touchLockTimerRef.current) clearTimeout(touchLockTimerRef.current);
      touchLockTimerRef.current = setTimeout(() => {
        touchLockRef.current = false;
      }, 180);
    }, []);

    const showToast = msg => {
      setToastMessage(String(msg ?? ''));
      setToastVisible(true);
    };
    const hideToast = () => setToastVisible(false);

    const currentKind = kindProp ?? localKind;
    const selectedUserIds = selectedUserIdsProp ?? localSelectedUserIds;

    const isAnniversaryMode = currentKind === KIND.ANNIVERSARY;

    const setSelectedUserIdsSafe = next => {
      if (isClosing) return;
      const setter = setSelectedUserIdsProp ?? setLocalSelectedUserIds;
      setter(Array.isArray(next) ? uniqIds(next) : []);
    };

    const safeSelectedIds = useMemo(() => {
      return Array.isArray(selectedUserIds) ? uniqIds(selectedUserIds) : [];
    }, [selectedUserIds]);

    const allFamilyUserIds = useMemo(() => {
      return uniqIds((familyUserList || []).map(u => u?.userId));
    }, [familyUserList]);

    const isAllSelected =
      currentKind === KIND.FAMILY &&
      allFamilyUserIds.length > 0 &&
      allFamilyUserIds.every(id => hasId(safeSelectedIds, id));

    const isAllSelectedUI = isAnniversaryMode ? true : isAllSelected;

    const setKindSafe = useCallback(
      v => {
        const setter = setKindProp ?? setLocalKind;
        setter(v);

        if (v === KIND.ANNIVERSARY) {
          (setSelectedUserIdsProp ?? setLocalSelectedUserIds)([]);
        }
      },
      [setKindProp, setSelectedUserIdsProp],
    );

    const handleKindChange = useCallback(
      v => {
        setKindSafe(v);
        if (v === KIND.INDIVIDUAL && currentUserId != null) {
          setSelectedUserIdsSafe([currentUserId]);
        }
      },
      [setKindSafe, currentUserId, setSelectedUserIdsSafe],
    );

    const editingScheduleRef = useRef(editingSchedule);
    useEffect(() => {
      editingScheduleRef.current = editingSchedule;
    }, [editingSchedule]);

    const editingKey = useMemo(() => {
      return (
        editingSchedule?.scheduleId ??
        editingSchedule?.id ??
        editingSchedule?.scheduleID ??
        null
      );
    }, [editingSchedule]);

    const sheetKey = useMemo(
      () => `schedule-${editingKey ?? 'new'}`,
      [editingKey],
    );

    const fontMode = useReduxFontMode();
    const sheetSnapPoints = useMemo(
      () =>
        getScheduleBottomSheetSnapPoints(
          fontMode,
          (familyUserList || []).length,
        ),
      [fontMode, familyUserList],
    );

    useEffect(() => {
      const es = editingScheduleRef.current;

      if (!es) {
        setKindSafe(KIND.INDIVIDUAL);
        (setSelectedUserIdsProp ?? setLocalSelectedUserIds)([]);
        return;
      }

      const raw =
        es?.__forcedKind ??
        es?.kind ??
        es?.type ??
        es?.scheduleType ??
        es?.category ??
        null;

      const forcedFamily = es?.isShared === true || es?.shared === true;

      let initialKind = normalizeKind(raw);
      if (initialKind !== KIND.ANNIVERSARY && forcedFamily) {
        initialKind = KIND.FAMILY;
      }

      setKindSafe(initialKind);

      const candidateIds =
        es?.userIds ??
        es?.participantIds ??
        es?.participants ??
        es?.memberIds ??
        null;

      const candidateArr = Array.isArray(candidateIds)
        ? candidateIds
        : candidateIds
        ? [candidateIds]
        : es?.userId != null
        ? [es.userId]
        : null;

      const normalizedCandidates = candidateArr ? uniqIds(candidateArr) : null;

      if (initialKind === KIND.ANNIVERSARY) {
        (setSelectedUserIdsProp ?? setLocalSelectedUserIds)([]);
        return;
      }

      if (normalizedCandidates && normalizedCandidates.length > 0) {
        (setSelectedUserIdsProp ?? setLocalSelectedUserIds)(
          uniqIds(normalizedCandidates),
        );
      } else {
        (setSelectedUserIdsProp ?? setLocalSelectedUserIds)([]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingKey]);

    const scheduleType = useMemo(
      () => kindToScheduleType(currentKind),
      [currentKind],
    );

    const participantIdsForSubmit = useMemo(() => {
      if (currentKind === KIND.ANNIVERSARY) return undefined;

      if (currentKind === KIND.FAMILY) {
        if (isAllSelected) return allFamilyUserIds;
        return safeSelectedIds;
      }
      if (safeSelectedIds.length > 0) return safeSelectedIds;
      return currentUserId != null ? [currentUserId] : [];
    }, [
      currentKind,
      safeSelectedIds,
      isAllSelected,
      allFamilyUserIds,
      currentUserId,
    ]);

    const basePayload = useMemo(() => {
      const es = editingScheduleRef.current;

      const familyId = es?.familyId ?? familyIdProp;
      const date = es?.date ?? dateProp;

      const scheduleId =
        es?.scheduleId ?? es?.id ?? es?.scheduleID ?? undefined;

      const memo = es?.memo ?? memoProp;

      return {
        ...(scheduleId != null ? {scheduleId} : {}),
        familyId,
        date,
        ...(memo != null ? {memo} : {}),
      };
    }, [familyIdProp, dateProp, memoProp]);

    const dateLabelShort = useMemo(
      () => formatScheduleDateShort(dateProp ?? editingSchedule?.date),
      [dateProp, editingSchedule?.date],
    );

    const {modalRef, scheduleRef, inputKey, handleSave, handleDelete} =
      useScheduleBottomSheetModal({
        editingSchedule,
        title,
        setTitle,
        onSubmit,
        onDelete,
        onRefresh,
        scheduleType,
        participantIds: participantIdsForSubmit,
        basePayload,
      });

    const sheetAnimationConfigs = useMemo(
      () => ({
        duration: 250,
        easing: Easing.inOut(Easing.cubic),
      }),
      [],
    );

    const insets = useSafeAreaInsets();
    const bottomSafe = useMemo(
      () => getBottomSheetEditorBottomSafe(insets.bottom, getResponsiveHeight),
      [insets.bottom],
    );

    const closeSheet = useCallback(() => {
      if (closingRef.current) return;
      closingRef.current = true;
      setIsClosing(true);
      modalRef.current?.dismiss?.();
      setTimeout(() => {
        closingRef.current = false;
      }, 320);
    }, [modalRef]);

    const handleSheetDismiss = useCallback(() => {
      setIsClosing(false);
      closingRef.current = false;

      tapToResetRef.current = false;
      keyboardHeightRef.current = 0;
      keyboardOpenRef.current = false;

      setDeleteModalVisible(false);

      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }).start();
    }, [shiftAnim]);

    useImperativeHandle(ref, () => ({
      present: () => {
        setIsClosing(false);
        closingRef.current = false;

        tapToResetRef.current = false;
        keyboardOpenRef.current = false;

        setDeleteModalVisible(false);

        Animated.timing(shiftAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();

        modalRef.current?.present?.();

        requestAnimationFrame(() => {
          // 고정 snapPoints(퍼센트)일 때만 스냅 — enableDynamicSizing 빈 스냅과 충돌 시 빈 시트 방지
          try {
            modalRef.current?.snapToIndex?.(1);
          } catch {
            /* ignore */
          }
          // 열자마자 제목 포커스/키보드 올리지 않음 — 사용자가 탭할 때만 포커스
        });
      },
      dismiss: () => closeSheet(),
    }));

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

    const handleTouchInsideResetOnly = useCallback(() => {
      if (touchLockRef.current) return;
      lockTouchBriefly();

      tapToResetRef.current = true;

      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        tapToResetRef.current = false;
      });
    }, [shiftAnim, lockTouchBriefly]);

    const toggleUser = userId => {
      if (isClosing) return;
      if (isAnniversaryMode) return;
      if (userId == null || String(userId).trim() === '') return;

      const id = userId;
      if (hasId(safeSelectedIds, id)) {
        setSelectedUserIdsSafe(safeSelectedIds.filter(x => !idEq(x, id)));
      } else {
        setSelectedUserIdsSafe([...safeSelectedIds, id]);
      }
    };

    const selectAll = () => {
      if (isClosing) return;
      if (isAnniversaryMode) return;

      if (currentKind === KIND.INDIVIDUAL) {
        showToast('개별 일정은 “전체” 선택을 사용할 수 없어요.');
        return;
      }

      if (allFamilyUserIds.length === 0) {
        showToast('가족 구성원 목록을 불러오지 못했어요.');
        return;
      }

      if (isAllSelected) {
        setSelectedUserIdsSafe([]);
      } else {
        setSelectedUserIdsSafe(allFamilyUserIds);
      }
    };

    const handlePressSave = async () => {
      if (isClosing) return;

      const text = scheduleRef.current || '';
      if (!text.trim()) {
        showToast('일정 제목을 입력해주세요.');
        return;
      }

      const lengthResult = validateLength(text.trim(), {max: 200});
      if (!lengthResult.valid) {
        showToast(lengthResult.message);
        return;
      }

      const count = safeSelectedIds.length;

      if (currentKind === KIND.INDIVIDUAL) {
        if (count === 0 && currentUserId == null) {
          showToast('사용자 정보를 찾을 수 없어 일정을 저장할 수 없어요.');
          return;
        }
      }

      if (currentKind === KIND.FAMILY && count === 0) {
        showToast('가족 일정은 전체 또는 1명 이상 선택이 필요해요.');
        return;
      }

      const familyId = basePayload?.familyId;
      const date = basePayload?.date;
      if (!familyId || !date) {
        showToast('familyId/date가 없어서 저장할 수 없어요. (부모에서 내려줘야 함)');
        return;
      }

      setIsClosing(true);

      try {
        await handleSave();
      } catch (e) {
        setIsClosing(false);
        showToast('저장 실패! 콘솔에서 에러 로그 확인해줘.');
      }
    };

    const confirmDelete = async () => {
      if (isClosing) return;

      setDeleteModalVisible(false);
      setIsClosing(true);

      try {
        await handleDelete();
      } catch (e) {
        setIsClosing(false);
        showToast('삭제 실패! 콘솔에서 에러 로그 확인해줘.');
      }
    };

    const handlePressDelete = () => {
      if (isClosing) return;
      setDeleteModalVisible(true);
    };

    const footerProps = useMemo(() => {
      const saveStyle = getBottomSheetPrimarySaveButtonStyle(
        getResponsiveHeight,
        getResponsiveIconSize,
      );
      if (editingSchedule) {
        return {
          onCancel: handlePressDelete,
          onSave: handlePressSave,
          cancelLabel: '삭제하기',
          saveLabel: '저장하기',
          showCancel: true,
          autoCloseOnSave: false,
          saveButtonStyle: saveStyle,
          buttonRowStyle: {marginTop: 0},
        };
      }
      return {
        onSave: handlePressSave,
        saveLabel: '저장하기',
        showCancel: false,
        autoCloseOnSave: false,
        saveButtonStyle: saveStyle,
        buttonRowStyle: {marginTop: 0},
      };
    }, [editingSchedule, handlePressSave, handlePressDelete]);

    const memberChipData = useMemo(() => {
      const normalized = (familyUserList || [])
        .map(u => ({
          type: 'USER',
          userId: u?.userId,
          name: u?.name ?? '',
        }))
        .filter(x => x.userId != null && x.userId !== '');

      return [{type: 'ALL', userId: -1, name: '전체'}, ...normalized];
    }, [familyUserList]);

    const renderChip = useCallback(
      item => {
        const isAll = item.type === 'ALL';
        const id = item.userId;

        const selected = isAll
          ? isAllSelectedUI
          : isAnniversaryMode
          ? false
          : hasId(safeSelectedIds, id);

        const onPress = () => {
          if (isAnniversaryMode) return;
          if (isAll) return selectAll();
          return toggleUser(id);
        };

        const disabledByMode =
          (currentKind === KIND.INDIVIDUAL && isAll) || isAnniversaryMode;

        return (
          <TouchableOpacity
            key={`${item.type}-${item.userId}`}
            activeOpacity={0.85}
            onPress={onPress}
            disabled={disabledByMode}
            style={[
              styles.memberChip,
              selected && styles.memberChipSelected,
              disabledByMode && styles.memberChipDisabled,
            ]}>
            <AppText
              allowFontScaling={false}
              style={[
                styles.memberChipText,
                selected && styles.memberChipTextSelected,
              ]}
              numberOfLines={1}>
              {item.name}
            </AppText>
          </TouchableOpacity>
        );
      },
      [
        currentKind,
        isAnniversaryMode,
        isAllSelectedUI,
        safeSelectedIds,
        selectAll,
        toggleUser,
      ],
    );

    const deleteTitle = useMemo(() => '일정을 삭제할까요?', []);
    const deleteSubText = useMemo(() => '삭제하면 되돌릴 수 없어요.', []);

    const segmentValue =
      currentKind === KIND.ANNIVERSARY ? KIND.INDIVIDUAL : currentKind;

    const showParticipants = !isAnniversaryMode;

    return (
      <>
        <BottomSheetLayout
          modalRef={modalRef}
          snapPoints={sheetSnapPoints}
          sheetKey={sheetKey}
          animationConfigs={sheetAnimationConfigs}
          containerStyle={{paddingHorizontal: getResponsiveWidth(20)}}
          useInternalScroll={false}
          keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'none'}
          androidKeyboardInputMode="adjustResize"
          enableKeyboardPolicy={true}
          keyboardOpenSnapIndex={1}
          keyboardCloseSnapIndex={0}
          dismissKeyboardOnPress={true}
          onTouchInside={handleTouchInsideResetOnly}
          onDismiss={handleSheetDismiss}
          disableContentBottomPadding={true}>
          <BottomSheetScrollView
            style={{flex: 1}}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{paddingBottom: getResponsiveHeight(8)}}>
            <Animated.View style={{transform: [{translateY: shiftAnim}]}}>
              <View style={styles.content}>
                <View style={styles.heroCenter}>
                  <AppText allowFontScaling={false} style={styles.heroTitle}>
                    {editingSchedule ? '일정 수정' : '일정 추가'}
                  </AppText>
                  {!!dateLabelShort && (
                    <View style={styles.dateBadge}>
                      <AppText
                        allowFontScaling={false}
                        style={styles.dateBadgeText}>
                        {dateLabelShort}
                      </AppText>
                    </View>
                  )}
                </View>

                <View style={styles.formColumn}>
                  <View style={styles.fieldBlock}>
                    <AppText allowFontScaling={false} style={styles.sectionLabel}>
                      일정 제목
                    </AppText>
                    <View style={styles.singleLineUnderlineWrap}>
                      <BottomSheetTextInput
                        allowFontScaling={false}
                        ref={inputRef}
                        key={`input-${inputKey}`}
                        defaultValue={scheduleRef.current}
                        onChangeText={text => {
                          if (!isClosing) scheduleRef.current = text;
                        }}
                        onFocus={() => {
                          tapToResetRef.current = false;
                          ensureVisible(inputRef);
                        }}
                        placeholder="무슨 일정인가요?"
                        placeholderTextColor={COLORS.muted}
                        style={styles.scheduleTitleInput}
                        multiline
                        underlineColorAndroid="transparent"
                      />
                    </View>
                  </View>

                  <View style={styles.typeBlock}>
                    <AppText allowFontScaling={false} style={styles.sectionLabel}>
                      유형
                    </AppText>
                    <View style={styles.segmentTrack}>
                      <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => handleKindChange(KIND.INDIVIDUAL)}
                        style={[
                          styles.segmentCell,
                          segmentValue === KIND.INDIVIDUAL &&
                            styles.segmentCellActive,
                        ]}>
                        <AppText
                          allowFontScaling={false}
                          style={[
                            styles.segmentLabel,
                            segmentValue === KIND.INDIVIDUAL &&
                              styles.segmentLabelActive,
                          ]}>
                          개별
                        </AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => handleKindChange(KIND.FAMILY)}
                        style={[
                          styles.segmentCell,
                          segmentValue === KIND.FAMILY && styles.segmentCellActive,
                        ]}>
                        <AppText
                          allowFontScaling={false}
                          style={[
                            styles.segmentLabel,
                            segmentValue === KIND.FAMILY && styles.segmentLabelActive,
                          ]}>
                          가족
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {showParticipants ? (
                    <View style={styles.participantBlock}>
                      <AppText
                        allowFontScaling={false}
                        style={styles.sectionLabel}>
                        구성원
                      </AppText>
                      <ScrollView
                        horizontal
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        showsHorizontalScrollIndicator={false}
                        bounces={false}
                        contentContainerStyle={styles.chipScrollContent}
                        style={styles.chipScroll}>
                        {memberChipData.map(renderChip)}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          </BottomSheetScrollView>
          <BottomSheetFooterButtons
            bottomSafe={bottomSafe}
            includeBottomSafePadding={true}
            excludeSafeForMeasure={false}
            onLayoutHeight={undefined}
            style={[
              styles.footerFlow,
              Platform.OS === 'android' && {paddingBottom: getResponsiveHeight(12)},
            ]}
            {...footerProps}
          />
        </BottomSheetLayout>

        <CustomModal
          visible={deleteModalVisible}
          title={deleteTitle}
          subText={deleteSubText}
          closeText="취소하기"
          confirmText="삭제하기"
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={confirmDelete}
          onRequestClose={() => setDeleteModalVisible(false)}
          closeOnBackdropPress={true}
          showCloseButton={true}
          confirmTextStyle={{color: '#FFFFFF'}}
        />

        <ToastModal
          visible={toastVisible}
          onClose={hideToast}
          message={toastMessage}
        />
      </>
    );
  },
);

ScheduleEditorBottomSheetModal.displayName = 'ScheduleEditorBottomSheetModal';
export default ScheduleEditorBottomSheetModal;

const styles = StyleSheet.create({
  ...getBottomSheetEditorSharedStyles(
    getResponsiveFontSize,
    getResponsiveHeight,
    getResponsiveWidth,
  ),

  /** 중앙 묶음: 제목 + 날짜 pill */
  heroCenter: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(26),
  },
  heroTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
    letterSpacing: -0.35,
    textAlign: 'center',
  },

  dateBadge: {
    marginTop: getResponsiveHeight(6),
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(4),
    borderRadius: 999,
    backgroundColor: '#F2F2F7',
    alignSelf: 'center',
  },
  dateBadgeText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.sub,
    letterSpacing: -0.15,
  },

  /** 좌측 정렬 폼 영역 */
  formColumn: {
    alignSelf: 'stretch',
    width: '100%',
  },

  typeBlock: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: getResponsiveHeight(FLOW),
  },

  /** 섹션 구분 — 유형 / 구성원 */
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.caption,
    letterSpacing: -0.1,
    marginBottom: getResponsiveHeight(8),
  },

  /** 유형: 단일 트랙 세그먼트 (칩과 다른 패턴) */
  segmentTrack: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(120, 120, 128, 0.14)',
    borderRadius: 11,
    padding: 3,
  },
  segmentCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveHeight(9),
    borderRadius: 9,
  },
  segmentCellActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {elevation: 2},
    }),
  },
  segmentLabel: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: 'rgba(60, 60, 67, 0.72)',
    letterSpacing: -0.25,
  },
  segmentLabelActive: {
    color: COLORS.navy,
  },

  participantBlock: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: getResponsiveHeight(FLOW),
    marginTop: getResponsiveHeight(2),
    paddingTop: getResponsiveHeight(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60, 60, 67, 0.1)',
  },

  chipScroll: {
    alignSelf: 'stretch',
    maxHeight: getResponsiveHeight(40),
  },
  chipScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(4),
    paddingRight: getResponsiveWidth(8),
    paddingLeft: 0,
    gap: getResponsiveWidth(10),
  },

  /** 구성원: 둥근 사각 태그 (유형 세그먼트와 형태 구분) */
  memberChip: {
    height: getResponsiveHeight(32),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.07)',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
    flexShrink: 0,
    maxWidth: getResponsiveWidth(160),
  },
  memberChipSelected: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  memberChipDisabled: {opacity: 0.45},

  memberChipText: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#374151',
    letterSpacing: -0.15,
  },
  memberChipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },
});
