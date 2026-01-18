/* eslint-disable react-native/no-inline-styles */
// ScheduleEditorBottomSheetModal.jsx

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
  SafeAreaView,
} from 'react-native';

import {BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useScheduleBottomSheetModal} from '../hooks/useScheduleBottomSheetModal';
import ToastModal from '../../../components/ToastModal';
import BottomSheetLayout from 'components/BottomSheetLayout';
import {BOTTOMSHEET_STYLE} from 'styles/style';
import {BottomSheetButtons} from 'components/BottomSheetButtons';

const {height: WINDOW_H} = Dimensions.get('window');
const SAFE_GAP = 12;

// ✅ footer 높이만큼 본문 바닥 여유 (버튼 가림/측정 보정용)
const FOOTER_SPACE = getResponsiveHeight(86);

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

  pill: '#0B1220',
  pillText: '#FFFFFF',
};

const shadow = Platform.select({

});

const shadowStrong = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  android: {elevation: 4},
  default: {},
});

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
    const [localKind, setLocalKind] = useState(KIND.INDIVIDUAL);
    const [localSelectedUserIds, setLocalSelectedUserIds] = useState([]);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isClosing, setIsClosing] = useState(false);

    const closingRef = useRef(false);

    // ✅ "내용만" 올리는 값(미세 보정용)
    const shiftAnim = useRef(new Animated.Value(0)).current;
    const keyboardHeightRef = useRef(0);
    const inputRef = useRef(null);

    const tapToResetRef = useRef(false);
    const isPresentedRef = useRef(false);

    // ✅ 키보드 상태(스냅 제어용)
    const keyboardOpenRef = useRef(false);

    const showToast = msg => {
      setToastMessage(msg);
      setToastVisible(true);
    };
    const hideToast = () => setToastVisible(false);

    const currentKind = kindProp ?? localKind;
    const selectedUserIds = selectedUserIdsProp ?? localSelectedUserIds;
    const isAnniversaryMode = currentKind === KIND.ANNIVERSARY;

    const setSelectedUserIds = next => {
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

    const setKindSafe = v => {
      if (isClosing) return;
      const setter = setKindProp ?? setLocalKind;
      setter(v);

      // ✅ 기념일이면 구성원 선택 비움
      if (v === KIND.ANNIVERSARY) {
        (setSelectedUserIdsProp ?? setLocalSelectedUserIds)([]);
      }
    };

    useEffect(() => {
      const raw =
        editingSchedule?.kind ??
        editingSchedule?.type ??
        editingSchedule?.scheduleType ??
        editingSchedule?.category ??
        null;

      const t = String(raw || '').toLowerCase();

      const isAnniv =
        editingSchedule?.isAnniversary === true ||
        t.includes('anniv') ||
        t.includes('anniversary') ||
        t.includes('기념');

      const isFamily =
        editingSchedule?.isShared === true ||
        editingSchedule?.shared === true ||
        t.includes('family') ||
        t.includes('공동') ||
        t.includes('shared') ||
        editingSchedule?.userId == null;

      let initialKind = KIND.INDIVIDUAL;
      if (isAnniv) initialKind = KIND.ANNIVERSARY;
      else if (isFamily) initialKind = KIND.FAMILY;

      if (!editingSchedule) initialKind = KIND.INDIVIDUAL;

      (setKindProp ?? setLocalKind)(initialKind);

      const candidateIds =
        editingSchedule?.userIds ??
        editingSchedule?.participantIds ??
        editingSchedule?.participants ??
        editingSchedule?.memberIds ??
        null;

      const candidateArr = Array.isArray(candidateIds)
        ? candidateIds
        : candidateIds
        ? [candidateIds]
        : editingSchedule?.userId != null
        ? [editingSchedule.userId]
        : null;

      const normalizedCandidates = candidateArr ? uniqNums(candidateArr) : null;

      if (
        normalizedCandidates &&
        (initialKind === KIND.INDIVIDUAL || initialKind === KIND.FAMILY)
      ) {
        (setSelectedUserIdsProp ?? setLocalSelectedUserIds)(
          uniqNums(normalizedCandidates),
        );
      } else {
        (setSelectedUserIdsProp ?? setLocalSelectedUserIds)([]);
      }
    }, [editingSchedule]);

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
      const familyId = editingSchedule?.familyId ?? familyIdProp;
      const date = editingSchedule?.date ?? dateProp;

      const scheduleId =
        editingSchedule?.scheduleId ??
        editingSchedule?.id ??
        editingSchedule?.scheduleID ??
        undefined;

      const memo = editingSchedule?.memo ?? memoProp;

      return {
        ...(scheduleId != null ? {scheduleId} : {}),
        familyId,
        date,
        ...(memo != null ? {memo} : {}),
      };
    }, [editingSchedule, familyIdProp, dateProp, memoProp]);

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
      isPresentedRef.current = false;

      tapToResetRef.current = false;
      keyboardHeightRef.current = 0;
      keyboardOpenRef.current = false;

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
        isPresentedRef.current = true;

        tapToResetRef.current = false;
        keyboardOpenRef.current = false;

        Animated.timing(shiftAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();

        modalRef.current?.present?.();
      },
      dismiss: () => closeSheet(),
    }));

    // ✅ 키보드 show/hide 시: 시트 스냅으로 "인풋이 보이게"
    useEffect(() => {
      const onShow = e => {
        keyboardOpenRef.current = true;
        keyboardHeightRef.current = e?.endCoordinates?.height || 0;

        // ✅ 핵심: 키보드 뜨면 시트 자체를 크게 (90%)
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

        // ✅ 키보드 내려가면 기본 스냅 복귀
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
    }, [shiftAnim, modalRef]);

    /**
     * ✅ input이 "아직도" 가려지면 내용만 추가로 올림(미세 보정)
     * - UserBottomSheet 로직 그대로: limitY에 FOOTER_SPACE까지 고려
     */
    const ensureVisible = useCallback(
      refNode => {
        if (tapToResetRef.current) return;

        const kbH = keyboardHeightRef.current || 0;

        requestAnimationFrame(() => {
          if (tapToResetRef.current) return;

          const node = refNode?.current;
          if (!node || typeof node.measureInWindow !== 'function') return;

          node.measureInWindow((x, y, w, h) => {
            if (tapToResetRef.current) return;

            const inputBottomY = y + h;
            const baseLimit = kbH ? WINDOW_H - kbH : WINDOW_H;

            // ✅ footer는 키보드 위로 안 올라가니까,
            // ✅ 입력이 footer 영역까지 고려해서 보이게 해야 함
            const limitY = baseLimit - SAFE_GAP - FOOTER_SPACE;

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
    }, [shiftAnim, modalRef]);

    const toggleUser = userId => {
      if (isClosing) return;
      if (isAnniversaryMode) return;

      const id = toNumId(userId);
      if (id == null) return;

      if (safeSelectedIds.includes(id)) {
        setSelectedUserIds(safeSelectedIds.filter(x => x !== id));
      } else {
        setSelectedUserIds([...safeSelectedIds, id]);
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

      setSelectedUserIds(allFamilyUserIds);
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
        showToast(
          'familyId/date가 없어서 저장할 수 없어요. (부모에서 내려줘야 함)',
        );
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

    const handlePressDelete = async () => {
      if (isClosing) return;

      setIsClosing(true);

      try {
        await handleDelete();
      } catch (e) {
        setIsClosing(false);
        showToast('삭제 실패! 콘솔에서 에러 로그 확인해줘.');
      }
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

    // ✅ "칩" 데이터: 전체를 맨 앞에
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

        const selected = isAll ? isAllSelected : safeSelectedIds.includes(id);

        const onPress = () => {
          if (isAnniversaryMode) return;
          if (isAll) return selectAll();
          return toggleUser(id);
        };

        const disabledByMode = currentKind === KIND.INDIVIDUAL && isAll;

        return (
          <TouchableOpacity
            key={`${item.type}-${item.userId}`}
            activeOpacity={0.85}
            onPress={onPress}
            disabled={isAnniversaryMode || disabledByMode}
            style={[
              styles.chip,
              selected && styles.chipSelected,
              (isAnniversaryMode || disabledByMode) && styles.chipDisabled,
            ]}>
            <Text
              style={[styles.chipText, selected && styles.chipTextSelected]}
              numberOfLines={1}>
              {item.name}
            </Text>
            {selected ? <View style={styles.chipDot} /> : null}
          </TouchableOpacity>
        );
      },
      [
        currentKind,
        isAnniversaryMode,
        isAllSelected,
        safeSelectedIds,
        selectAll,
        toggleUser,
      ],
    );

    return (
      <>
        <BottomSheetLayout
          modalRef={modalRef}
          // ✅ 2단 스냅: 기본 78%, 키보드 시 90%
          snapPoints={['78%', '98%']}
          keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : 'none'}
          androidKeyboardInputMode="adjustNothing"
          onDismiss={handleSheetDismiss}
          title={editingSchedule ? '일정 수정' : '일정 추가'}
          subtitle="가족과 일정을 공유해요."
          useInternalScroll={false}>
          <SafeAreaView style={{flex: 1, backgroundColor: COLORS.bg}}>
            {/* ✅ 바텀시트 내부 아무 데나 탭하면 키보드 내림 + 원복 */}
            <View
              style={{flex: 1}}
              onStartShouldSetResponder={() => true}
              onResponderRelease={dismissKeyboardAndReset}>
              <BottomSheetView style={{flex: 1}}>
                <Animated.View
                  style={{
                    flex: 1,
                    transform: [{translateY: shiftAnim}],
                    // ✅ footer 공간 확보 (UserBottomSheet처럼)
                    paddingBottom: FOOTER_SPACE + getResponsiveHeight(18),
                  }}>
                  <View style={styles.content}>
                    {/* ----------------- 1) 구분 ----------------- */}
                    <Text style={styles.sectionTitle}>구분</Text>
                    <View style={styles.segmentWrap}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setKindSafe(KIND.INDIVIDUAL)}
                        style={[
                          styles.segmentItem,
                          currentKind === KIND.INDIVIDUAL &&
                            styles.segmentItemActive,
                        ]}>
                        <Text
                          style={[
                            styles.segmentText,
                            currentKind === KIND.INDIVIDUAL &&
                              styles.segmentTextActive,
                          ]}>
                          개별
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setKindSafe(KIND.FAMILY)}
                        style={[
                          styles.segmentItem,
                          currentKind === KIND.FAMILY &&
                            styles.segmentItemActive,
                        ]}>
                        <Text
                          style={[
                            styles.segmentText,
                            currentKind === KIND.FAMILY &&
                              styles.segmentTextActive,
                          ]}>
                          가족
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setKindSafe(KIND.ANNIVERSARY)}
                        style={[
                          styles.segmentItem,
                          currentKind === KIND.ANNIVERSARY &&
                            styles.segmentItemActive,
                        ]}>
                        <Text
                          style={[
                            styles.segmentText,
                            currentKind === KIND.ANNIVERSARY &&
                              styles.segmentTextActive,
                          ]}>
                          기념일
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* ----------------- 2) 구성원 ----------------- */}
                    <View style={{marginTop: getResponsiveHeight(18)}}>
                      <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>구성원</Text>

                        {isAnniversaryMode ? (
                          <View style={styles.badgeInfo}>
                            <Text style={styles.badgeInfoText}>자동</Text>
                          </View>
                        ) : (
                          <Text style={styles.countText}>
                            {selectedCount}명 선택
                          </Text>
                        )}
                      </View>

                      {isAnniversaryMode ? (
                        <View style={styles.infoCard}>
                          <Text style={styles.infoTitle}>
                            기념일은 구성원 선택이 필요 없어요
                          </Text>
                          <Text style={styles.infoDesc}>
                            저장하면 가족 공통 기념일로 등록돼요.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.memberCard}>
                          <View style={styles.chipWrap}>
                            {memberChipData.map(renderChip)}
                          </View>

                          <View style={styles.tipRow}>
                            <View style={styles.tipDot} />
                            <Text style={styles.tipText}>
                              개별: 1명 이상 · 가족: 전체 또는 여러 명
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* ----------------- 3) 일정 내용 ----------------- */}
                    <View style={{marginTop: getResponsiveHeight(18)}}>
                      <Text style={[styles.sectionTitle, {marginBottom: 3}]}>
                        내용
                      </Text>
                      <Text style={styles.inputHelp}>
                        핵심만 짧게 적어도 충분해요.
                      </Text>

                      <BottomSheetTextInput
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

                    {/* ----------------- Footer Buttons ----------------- */}
                    <View style={styles.footerFixed}>
                      <BottomSheetButtons {...footerProps} />
                    </View>
                  </View>
                </Animated.View>
              </BottomSheetView>
            </View>
          </SafeAreaView>
        </BottomSheetLayout>

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
    flex: 1,
    paddingTop: getResponsiveHeight(6),
    // ✅ 여기 paddingBottom은 Animated.View에서 footer 공간 확보하니까 과하게 안 줘도 됨
    paddingBottom: getResponsiveHeight(18),
  },

  footerFixed: {
    paddingTop: getResponsiveHeight(12),
    paddingBottom: getResponsiveHeight(2),
  },

  sectionTitle: {
    fontSize: BOTTOMSHEET_STYLE.sectionLabel.fontSize,
    fontFamily: BOTTOMSHEET_STYLE.sectionLabel.fontFamily,
    color: COLORS.text,
    marginBottom: getResponsiveHeight(10),
    marginTop: getResponsiveHeight(6),
  },

  /* ----------------- Segment Control ----------------- */
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    padding: getResponsiveWidth(6),
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  segmentItem: {
    flex: 1,
    height: getResponsiveHeight(38),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: COLORS.pill,
    ...shadowStrong,
  },
  segmentText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.sub,
    letterSpacing: -0.2,
  },
  segmentTextActive: {color: COLORS.pillText},

  /* ----------------- Section Row ----------------- */
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeInfo: {
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  badgeInfoText: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.sub,
  },
  countText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.sub,
  },

  /* ----------------- Info Card ----------------- */
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(14),
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  infoTitle: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.text,
    marginBottom: getResponsiveHeight(6),
  },
  infoDesc: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.sub,
    lineHeight: getResponsiveFontSize(17),
  },

  /* ----------------- Member (Chip) Card ----------------- */
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
    backgroundColor: COLORS.surface,
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

  chipDot: {
    marginLeft: getResponsiveWidth(6),
    width: getResponsiveWidth(6),
    height: getResponsiveWidth(6),
    borderRadius: 999,
    backgroundColor: COLORS.brand,
  },

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

  /* ----------------- Input ----------------- */
  input: {
    minHeight: getResponsiveHeight(120),
    borderRadius: 14,
    backgroundColor: COLORS.surface,
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
  inputHelp: {
    marginBottom: getResponsiveHeight(10),
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
});
