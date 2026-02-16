/* eslint-disable react-native/no-inline-styles */
// ScheduleEditorBottomSheetModal.jsx
// ✅ 흐름형 footer(1번) 버전 - 버벅 개선
// - 내부 탭에서 snapToIndex 제거(키보드 정책에 맡김)
// - 탭 연타 방지
// - Layout은 dismissKeyboardOnPress=true로 “키보드 열려있을 때만” dismiss 하도록

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
  Text,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

import {useScheduleBottomSheetModal} from '../hooks/useScheduleBottomSheetModal';
import ToastModal from 'components/modal/ToastModal';
import CustomModal from 'components/modal/CustomModal';
import {BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet';
import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import {BOTTOMSHEET_STYLE} from 'styles/style';

import {useSelector} from 'react-redux';
import SlideSegment from 'components/SlideSegment';
import BottomSheetFooterButtons from 'components/bottomSheet/BottomSheetFooterButtons';

const {height: WINDOW_H} = Dimensions.get('window');
const SAFE_GAP = 12;

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

const toNumId = v => {
  if (v == null) return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

const uniqNums = arr =>
  Array.from(new Set((arr || []).map(toNumId).filter(v => v != null)));

const COLORS = {
  bg: '#FFFFFF',
  text: '#0B1220',
  sub: '#566073',
  muted: '#98A2B3',
  card: '#FFFFFF',
  surface: '#F6F7FB',
  line: 'rgba(15, 23, 42, 0.08)',
  brand: '#FFC84D',
  brandDeep: '#FFB020',
  danger: '#EF4444',
  pill: 'black',
  pillText: '#FFFFFF',
};

const shadow = Platform.select({});

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

const KIND_SEGMENTS = [
  {key: KIND.INDIVIDUAL, label: '개별'},
  {key: KIND.FAMILY, label: '가족'},
];

const ScheduleEditorBottomSheetModal = forwardRef(
  (
    {
      editingSchedule,
      familyUserList = [],
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
    const fontMode = useSelector(state => state.ui.fontMode);

    const [localKind, setLocalKind] = useState(KIND.INDIVIDUAL);
    const [localSelectedUserIds, setLocalSelectedUserIds] = useState([]);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const closingRef = useRef(false);

    // ✅ shift는 “입력/콘텐츠 영역”만 올릴거라 contentWrapRef를 따로 둠
    const shiftAnim = useRef(new Animated.Value(0)).current;
    const keyboardHeightRef = useRef(0);
    const inputRef = useRef(null);

    const tapToResetRef = useRef(false);
    const keyboardOpenRef = useRef(false);

    // ✅ 내부 탭 연타 방지
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
    const isIndividualMode = currentKind === KIND.INDIVIDUAL;
    const isFamilyMode = currentKind === KIND.FAMILY;

    const setSelectedUserIdsSafe = next => {
      if (isClosing) return;
      const setter = setSelectedUserIdsProp ?? setLocalSelectedUserIds;
      setter(Array.isArray(next) ? uniqNums(next) : []);
    };

    const safeSelectedIds = useMemo(() => {
      return Array.isArray(selectedUserIds) ? uniqNums(selectedUserIds) : [];
    }, [selectedUserIds]);

    const allFamilyUserIds = useMemo(() => {
      return uniqNums((familyUserList || []).map(u => u?.userId));
    }, [familyUserList]);

    const isAllSelected =
      currentKind === KIND.FAMILY &&
      allFamilyUserIds.length > 0 &&
      safeSelectedIds.length === allFamilyUserIds.length;

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

    // ✅ 안정 키
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

      const normalizedCandidates = candidateArr ? uniqNums(candidateArr) : null;

      if (initialKind === KIND.ANNIVERSARY) {
        (setSelectedUserIdsProp ?? setLocalSelectedUserIds)([]);
        return;
      }

      if (normalizedCandidates && normalizedCandidates.length > 0) {
        (setSelectedUserIdsProp ?? setLocalSelectedUserIds)(
          uniqNums(normalizedCandidates),
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
      return safeSelectedIds;
    }, [currentKind, safeSelectedIds, isAllSelected, allFamilyUserIds]);

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

    const snapPoints = useMemo(() => {
      const fm = String(fontMode ?? '').toLowerCase();
      const isLarge = fm.includes('large') && !fm.includes('extra');
      const isXL = fm.includes('extra');

      // 첫 스냅이 기본 열림 높이 → 너무 낮으면 하단 버튼이 잘림
      if (isXL) return ['74%', '99%'];
      if (isLarge) return ['72%', '98%'];
      return ['70%', '97%'];
    }, [fontMode]);

    const bottomSafe = 0;

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
          modalRef.current?.snapToIndex?.(0);
        });
      },
      dismiss: () => closeSheet(),
    }));

    // ✅ 키보드 이벤트: 높이 추적 + shift 리셋만
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

    /**
     * ✅✅✅ 버벅 제거 핵심:
     * - 내부 탭에서는 “snapToIndex(0)” 하지 말고
     * - shift만 0으로 리셋 + (키보드 닫기는 Layout이 담당)
     * - 탭 연타 방지
     */
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

      const id = toNumId(userId);
      if (id == null) return;

      if (safeSelectedIds.includes(id)) {
        setSelectedUserIdsSafe(safeSelectedIds.filter(x => x !== id));
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
        showToast('일정 내용을 입력해주세요.');
        return;
      }

      const count = safeSelectedIds.length;

      if (currentKind === KIND.INDIVIDUAL && count === 0) {
        showToast('개별 일정은 구성원 1명 이상 선택해주세요.');
        return;
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
      return editingSchedule
        ? {
            onCancel: handlePressDelete,
            onSave: handlePressSave,
            cancelLabel: '삭제하기',
            saveLabel: '저장하기',
            autoCloseOnSave: false,
          }
        : {
            onSave: handlePressSave,
            saveLabel: '저장하기',
            showCancel: false,
            autoCloseOnSave: false,
          };
    }, [editingSchedule, handlePressDelete, handlePressSave]);

    const memberChipData = useMemo(() => {
      const normalized = (familyUserList || [])
        .map(u => ({
          type: 'USER',
          userId: toNumId(u?.userId),
          name: u?.name ?? '',
        }))
        .filter(x => x.userId != null);

      return [{type: 'ALL', userId: -1, name: '전체'}, ...normalized];
    }, [familyUserList]);

    const selectedCount = useMemo(() => {
      if (isAnniversaryMode) return 0;
      if (currentKind === KIND.FAMILY && isAllSelected)
        return allFamilyUserIds.length || safeSelectedIds.length;
      return safeSelectedIds.length;
    }, [
      isAnniversaryMode,
      currentKind,
      isAllSelected,
      allFamilyUserIds.length,
      safeSelectedIds.length,
    ]);

    const renderChip = useCallback(
      item => {
        const isAll = item.type === 'ALL';
        const id = item.userId;

        const selected = isAll
          ? isAllSelectedUI
          : isAnniversaryMode
          ? false
          : safeSelectedIds.includes(id);

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
              styles.chip,
              selected && styles.chipSelected,
              disabledByMode && styles.chipDisabled,
            ]}>
            <Text
              allowFontScaling={false}
              style={[styles.chipText, selected && styles.chipTextSelected]}
              numberOfLines={1}>
              {item.name}
            </Text>
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

    return (
      <>
        <BottomSheetLayout
          modalRef={modalRef}
          snapPoints={snapPoints}
          sheetKey={sheetKey}
          title={editingSchedule ? '일정 수정' : '일정 추가'}
          subtitle="가족과 일정을 공유해요."
          useInternalScroll={true}
          keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'none'}
          keyboardBlurBehavior="restore"
          androidKeyboardInputMode="adjustResize"
          enableKeyboardPolicy={true}
          keyboardOpenSnapIndex={1}
          keyboardCloseSnapIndex={0}
          useTouchOverlay={true}
          // ✅✅✅ 여기 중요: Layout이 “키보드 열려있을 때만” dismiss 하게
          dismissKeyboardOnPress={true}
          // ✅ 내부 탭 추가 동작은 shift 리셋만
          onTouchInside={handleTouchInsideResetOnly}
          onDismiss={handleSheetDismiss}
        >
          <SafeAreaView edges={['bottom']} style={{backgroundColor: COLORS.bg}}>
            <BottomSheetView>
              <Animated.View
                style={{
                  transform: [{translateY: shiftAnim}],
                }}
              >
                <View style={styles.content}>
                  <Text allowFontScaling={false} style={styles.sectionTitle}>
                    구분
                  </Text>

                  <SlideSegment
                    items={KIND_SEGMENTS}
                    value={currentKind}
                    onChange={setKindSafe}
                    padding={getResponsiveWidth(6)}
                    gap={getResponsiveWidth(6)}
                    containerStyle={styles.segmentWrap}
                    thumbStyle={styles.segmentThumb}
                    textStyle={styles.segmentText}
                    activeTextStyle={styles.segmentTextActive}
                  />

                  <View style={{marginTop: getResponsiveHeight(18)}}>
                    <View style={styles.sectionRow}>
                      <Text allowFontScaling={false} style={styles.sectionTitle}>
                        구성원
                      </Text>

                      {isAnniversaryMode ? null : (
                        <Text allowFontScaling={false} style={styles.countText}>
                          {selectedCount}명 선택
                        </Text>
                      )}
                    </View>

                    <View style={styles.memberCard}>
                      <View style={styles.chipWrap}>
                        {memberChipData.map(renderChip)}
                      </View>
                    </View>

                    <View style={styles.tipRow}>
                      <View style={styles.tipDot} />
                      <Text allowFontScaling={false} style={styles.tipText}>
                        {isIndividualMode ? '개별: 1명 이상' : null}
                        {isFamilyMode ? '가족: 전체 또는 여러 명' : null}
                        {isAnniversaryMode
                          ? '기념일: 구성원은 “전체”로 고정돼요.'
                          : null}
                      </Text>
                    </View>
                  </View>

                  <View style={{marginTop: getResponsiveHeight(18)}}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.sectionTitle, {marginBottom: 3}]}
                    >
                      내용
                    </Text>

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
                      placeholder="예) 병원 예약, 가족 모임"
                      placeholderTextColor={COLORS.muted}
                      style={styles.input}
                      multiline
                    />
                  </View>

                  <BottomSheetFooterButtons
                    bottomSafe={bottomSafe}
                    includeBottomSafePadding={true}
                    excludeSafeForMeasure={false}
                    onLayoutHeight={undefined}
                    style={styles.footerFlow}
                    {...footerProps}
                  />
                </View>
              </Animated.View>
            </BottomSheetView>
          </SafeAreaView>
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
  content: {
    paddingTop: getResponsiveHeight(2),
    paddingBottom: getResponsiveHeight(12),
  },

  footerFlow: {
    paddingTop: getResponsiveHeight(12),
    paddingBottom: getResponsiveHeight(2),
  },

  sectionTitle: {
    fontSize: BOTTOMSHEET_STYLE().sectionLabel.fontSize,
    fontFamily: BOTTOMSHEET_STYLE().sectionLabel.fontFamily,
    color: BOTTOMSHEET_STYLE().sectionLabel.color,
    marginBottom: BOTTOMSHEET_STYLE().sectionLabel.marginBottom,
    marginTop: BOTTOMSHEET_STYLE().sectionLabel.marginTop,
  },

  segmentWrap: {
    backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden',
  },

  segmentThumb: {
    backgroundColor: COLORS.pill,
    borderRadius: 999,
  },

  segmentText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.sub,
    letterSpacing: -0.2,
  },

  segmentTextActive: {
    color: COLORS.pillText,
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  countText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.sub,
  },

  memberCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(12),
    borderWidth: 1,
    borderColor: COLORS.line,
    ...shadow,
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: getResponsiveHeight(2),
  },

  chip: {
    height: getResponsiveHeight(34),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: getResponsiveWidth(8),
    marginBottom: getResponsiveHeight(8),
    maxWidth: getResponsiveWidth(140),
  },
  chipSelected: {
    backgroundColor: COLORS.pill,
    borderColor: COLORS.pill,
  },
  chipDisabled: {opacity: 0.45},

  chipText: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.sub,
    letterSpacing: -0.2,
  },
  chipTextSelected: {color: COLORS.pillText},

  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
    marginTop: getResponsiveHeight(4),
  },
  tipDot: {
    width: getResponsiveWidth(6),
    height: getResponsiveWidth(6),
    borderRadius: 999,
    backgroundColor: COLORS.brandDeep,
  },
  tipText: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.sub,
  },

  input: {
    minHeight: getResponsiveHeight(120),
    borderRadius: 14,
    backgroundColor: BOTTOMSHEET_STYLE().inactive.color,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(10)
        : getResponsiveHeight(12),
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: COLORS.text,
    textAlignVertical: 'top',
  },
});
