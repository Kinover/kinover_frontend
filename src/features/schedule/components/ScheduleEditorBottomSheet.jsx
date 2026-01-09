/* eslint-disable react-native/no-inline-styles */
// ScheduleEditorBottomSheetModal.jsx

import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  Text,
  View,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import {
  BottomSheetTextInput,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useScheduleBottomSheetModal} from '../hooks/useScheduleBottomSheetModal';
import ToastModal from '../../../components/ToastModal';
import BottomSheetLayout from 'components/BottomSheetLayout';
import {BACKGROUND_COLORS, BOTTOMSHEET_STYLE} from 'styles/style';

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

// ✅ 숫자 id로 통일 (백엔드 participantIds = List<Long>)
const toNumId = v => {
  if (v == null) return null;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

const uniqNums = arr =>
  Array.from(new Set((arr || []).map(toNumId).filter(v => v != null)));

const ScheduleEditorBottomSheetModal = forwardRef(
  (
    {
      editingSchedule,
      familyUserList = [],

      // ✅ 추가 모드에서 반드시 필요 (부모가 넘겨줘야 함)
      familyId: familyIdProp,
      date: dateProp,
      memo: memoProp,

      // ✅ Controlled 가능
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

    const showToast = msg => {
      setToastMessage(msg);
      setToastVisible(true);
    };
    const hideToast = () => setToastVisible(false);

    const currentKind = kindProp ?? localKind;

    const selectedUserIds = selectedUserIdsProp ?? localSelectedUserIds;

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
      currentKind === KIND.FAMILY && safeSelectedIds.length === 0;

    const setKindSafe = v => {
      if (isClosing) return;
      const setter = setKindProp ?? setLocalKind;
      setter(v);

      if (v === KIND.ANNIVERSARY) {
        setSelectedUserIds([]);
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
      return safeSelectedIds;
    }, [currentKind, safeSelectedIds]);

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

    const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], []);
    const {
      animatedSnapPoints,
      animatedHandleHeight,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

    const shiftAnim = useRef(new Animated.Value(0)).current;
    const keyboardHeightRef = useRef(0);
    const inputRef = useRef(null);

    useImperativeHandle(ref, () => ({
      present: () => {
        setIsClosing(false);
        Animated.timing(shiftAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
        modalRef.current?.present();
      },
      dismiss: () => {
        setIsClosing(true);
        modalRef.current?.dismiss();
      },
    }));

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

    const ensureVisible = refNode => {
      const kbH = keyboardHeightRef.current || 0;
      if (!kbH) return;

      const keyboardTopY = WINDOW_H - kbH;

      requestAnimationFrame(() => {
        const node = refNode?.current;
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

    const toggleUser = userId => {
      if (isClosing) return;

      if (currentKind === KIND.ANNIVERSARY) {
        showToast('기념일은 구성원을 선택하지 않아도 돼요.');
        setSelectedUserIds([]);
        return;
      }

      const id = toNumId(userId);
      if (id == null) return;

      if (currentKind === KIND.FAMILY && safeSelectedIds.length === 0) {
        setSelectedUserIds([id]);
        return;
      }

      if (safeSelectedIds.includes(id)) {
        setSelectedUserIds(safeSelectedIds.filter(x => x !== id));
      } else {
        setSelectedUserIds([...safeSelectedIds, id]);
      }
    };

    const selectAll = () => {
      if (isClosing) return;

      if (currentKind === KIND.INDIVIDUAL) {
        showToast('개별 일정은 구성원을 1명 이상 선택해주세요.');
        return;
      }

      if (currentKind === KIND.ANNIVERSARY) {
        showToast('기념일은 구성원을 선택하지 않아도 돼요.');
        setSelectedUserIds([]);
        return;
      }

      if (allFamilyUserIds.length === 0) {
        showToast('가족 구성원 목록을 불러오지 못했어요.');
        return;
      }

      setSelectedUserIds(allFamilyUserIds);
    };

    const handlePressSave = async () => {
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
        showToast('가족 일정은 ALL(전체) 또는 1명 이상 선택이 필요해요.');
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
      setIsClosing(true);
      try {
        await handleDelete();
      } catch (e) {
        setIsClosing(false);
        showToast('삭제 실패! 콘솔에서 에러 로그 확인해줘.');
      }
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
          title={editingSchedule ? '일정 수정' : '일정 추가'}
          subtitle="가족과 일정을 공유해요"
          useFixedFooter={false}
          footerProps={
            editingSchedule
              ? {
                  onCancel: handlePressDelete,
                  onSave: handlePressSave,
                  cancelLabel: '삭제하기',
                  saveLabel: '저장하기',
                }
              : {
                  onSave: handlePressSave,
                  saveLabel: '저장',
                  showCancel: false,
                }
          }
          contentTranslateY={shiftAnim}>
          <View>
            <Text style={styles.sectionLabel}>성격</Text>
            <View style={styles.kindRow}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setKindSafe(KIND.INDIVIDUAL)}
                style={[
                  styles.kindChip,
                  currentKind === KIND.INDIVIDUAL && styles.kindChipActive,
                ]}>
                <Text
                  style={[
                    styles.kindText,
                    currentKind === KIND.INDIVIDUAL && styles.kindTextActive,
                  ]}>
                  개별
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setKindSafe(KIND.FAMILY)}
                style={[
                  styles.kindChip,
                  currentKind === KIND.FAMILY && styles.kindChipActive,
                ]}>
                <Text
                  style={[
                    styles.kindText,
                    currentKind === KIND.FAMILY && styles.kindTextActive,
                  ]}>
                  가족
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setKindSafe(KIND.ANNIVERSARY)}
                style={[
                  styles.kindChip,
                  currentKind === KIND.ANNIVERSARY && styles.kindChipActive,
                ]}>
                <Text
                  style={[
                    styles.kindText,
                    currentKind === KIND.ANNIVERSARY && styles.kindTextActive,
                  ]}>
                  기념일
                </Text>
              </TouchableOpacity>
            </View>

            {(currentKind == KIND.FAMILY || currentKind == KIND.INDIVIDUAL) && (
              <>
                <Text style={styles.sectionLabel}>구성원</Text>

                <View style={styles.memberCard}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    contentContainerStyle={styles.memberScrollContent}>
                    {/* ALL */}
                    <View style={styles.memberItem}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={selectAll}
                        style={[
                          styles.avatarBtn2,
                          isAllSelected && styles.avatarBtn2Selected,
                          (currentKind === KIND.INDIVIDUAL ||
                            currentKind === KIND.ANNIVERSARY) &&
                            styles.avatarBtn2Disabled,
                        ]}>
                        <View style={styles.allCircle2}>
                          {isAllSelected && (
                            <View style={styles.avatarOverlay2} />
                          )}
                          <Text
                            style={[
                              styles.allText2,
                              isAllSelected && styles.allText2Selected,
                            ]}>
                            ALL
                          </Text>
                        </View>

                        {isAllSelected && (
                          <View style={styles.checkCenterWrap}>
                            <Image
                              source={require('../../../assets/icons/check-yellow.png')}
                              style={styles.checkCenterIcon}
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.memberName} numberOfLines={1}>
                        전체
                      </Text>
                    </View>

                    {/* USERS */}
                    {familyUserList.map(user => {
                      const id = toNumId(user?.userId);
                      if (id == null) return null;

                      const isSel = safeSelectedIds.includes(id);
                      const isLocked = currentKind === KIND.ANNIVERSARY;

                      return (
                        <View key={String(id)} style={styles.memberItem}>
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => toggleUser(id)}
                            style={[
                              styles.avatarBtn2,
                              isSel && styles.avatarBtn2Selected,
                              isLocked && styles.avatarBtn2Disabled,
                            ]}>
                            <Image
                              source={{uri: user.image}}
                              style={styles.avatarImage2}
                            />

                            {/* ✅ 선택 오버레이 + 체크 */}
                            {isSel && <View style={styles.avatarOverlay2} />}
                            {isSel && (
                              <View style={styles.checkCenterWrap}>
                                <Image
                                  source={require('../../../assets/icons/check-yellow.png')}
                                  style={styles.checkCenterIcon}
                                />
                              </View>
                            )}

                            {/* ✅ 선택 링 + 살짝 글로우 */}
                            {isSel && <View style={styles.avatarRing2} />}
                          </TouchableOpacity>

                          <Text style={styles.memberName} numberOfLines={1}>
                            {user.name}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.helperText2}>
                    {currentKind === KIND.INDIVIDUAL
                      ? '개별: 구성원 1명 이상 선택'
                      : currentKind === KIND.FAMILY
                      ? '가족: ALL 또는 여러 명 선택'
                      : '기념일: 구성원 선택 없이 저장'}
                  </Text>
                </View>
              </>
            )}

            <Text style={styles.sectionLabel}>일정 내용</Text>
            <View style={styles.inputPanel}>
              <BottomSheetTextInput
                ref={inputRef}
                key={`input-${inputKey}`}
                defaultValue={scheduleRef.current}
                onChangeText={text => {
                  if (!isClosing) scheduleRef.current = text;
                }}
                onFocus={() => ensureVisible(inputRef)}
                placeholder="예) 병원 예약, 가족 모임"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                multiline
              />
              <Text style={styles.inputHint}>
                최대 2~3줄로 간단히 적어도 좋아요
              </Text>
            </View>
          </View>
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

const COLORS = {
  BG: '#FFFFFF',
  PANEL: '#F9FAFB',
  BORDER: '#E5E7EB',
  TEXT: '#111827',
  SUB: '#6B7280',
  MUTED: '#9CA3AF',
  BRAND: '#FFC84D',
  BRAND_SOFT: '#FFF8E1',

  // ✅ 오버레이/그림자 톤
  OVERLAY: 'rgba(17, 24, 39, 0.35)',
  SHADOW: 'rgba(17, 24, 39, 0.08)',
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: BOTTOMSHEET_STYLE.sectionLabel.fontSize,
    fontFamily: BOTTOMSHEET_STYLE.sectionLabel.fontFamily,
    color: BOTTOMSHEET_STYLE.sectionLabel.color,
    marginBottom: BOTTOMSHEET_STYLE.sectionLabel.marginBottom,
    marginTop: BOTTOMSHEET_STYLE.sectionLabel.marginTop,
  },

  kindRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(8),
    marginBottom: getResponsiveHeight(16),
  },
  kindChip: {
    flex: 1,
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 14,
    backgroundColor: COLORS.PANEL,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kindChipActive: {
    backgroundColor: COLORS.BRAND_SOFT,
    borderColor: COLORS.BRAND,
  },
  kindText: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.SUB,
  },
  kindTextActive: {color: COLORS.TEXT},

  /* ---------------------- ✅ Member Selector (NEW) ---------------------- */
  memberCard: {
    backgroundColor: BACKGROUND_COLORS.secondaryBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingVertical: getResponsiveHeight(12),
    paddingTop: getResponsiveHeight(12),
    marginBottom: getResponsiveHeight(16),

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 2,
  },

  memberCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(10),
  },
  memberCardTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.TEXT,
  },

  memberBadge: {
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: 999,
    backgroundColor: COLORS.PANEL,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  memberBadgeDisabled: {opacity: 0.65},
  memberBadgeText: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-SemiBold',
    color: COLORS.SUB,
  },

  memberScrollContent: {
    paddingVertical: getResponsiveHeight(4),
  },

  memberItem: {
    width: getResponsiveWidth(76),
    alignItems: 'center',
    marginRight: getResponsiveWidth(10),
  },

  avatarBtn2: {
    width: getResponsiveIconSize(66),
    height: getResponsiveIconSize(66),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn2Selected: {
    borderColor: COLORS.BRAND,
    backgroundColor: COLORS.BRAND_SOFT,
  },
  avatarBtn2Disabled: {opacity: 0.55},

  avatarImage2: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },

  // ✅ 선택 오버레이
  avatarOverlay2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.OVERLAY,
  },

  // ✅ 선택 링
  avatarRing2: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.BRAND,
  },

  // ✅ ✅ 체크 뒤 "흰 원" 제거: 배경/테두리 없음, 체크만 띄움
  checkCenterWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [
      {translateX: -getResponsiveWidth(12)},
      {translateY: -getResponsiveWidth(12)},
    ],
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    alignItems: 'center',
    justifyContent: 'center',

    // backgroundColor: 'rgba(255, 255, 255, 0.92)',  // ❌ 제거
    // borderWidth: 1,                                 // ❌ 제거
    // borderColor: 'rgba(229, 231, 235, 0.9)',         // ❌ 제거

    // (선택) 체크가 어두운 오버레이 위에서 잘 보이게 살짝만
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 2},
      },
      android: {elevation: 3},
    }),
  },

  checkCenterIcon: {
    width: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
    resizeMode: 'contain',
  },

  memberName: {
    marginTop: getResponsiveHeight(7),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.TEXT,
    maxWidth: getResponsiveWidth(74),
    textAlign: 'center',
  },

  helperText2: {
    marginTop: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14),
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.SUB,
  },

  /* ---------------------- existing: input ---------------------- */
  inputPanel: {
    backgroundColor: COLORS.PANEL,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: getResponsiveWidth(12),
    paddingTop: getResponsiveHeight(10),
    paddingBottom: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(8),
  },

  input: {
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(10)
        : getResponsiveHeight(12),
    height: getResponsiveHeight(110),
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: COLORS.TEXT,
  },

  inputHint: {
    marginTop: getResponsiveHeight(8),
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.MUTED,
  },

  /* ---------------------- ALL 내부 ---------------------- */
  allCircle2: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  allText2: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Bold',
    color: COLORS.MUTED,
    letterSpacing: 0.2,
    zIndex: 2,
  },
  allText2Selected: {color: '#FFFFFF'},

  /* (이전 helperText 유지용) */
  helperText: {
    marginTop: getResponsiveHeight(6),
    marginLeft: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.SUB,
  },

  // (호환 위해 남겨둠 - 사용 안 해도 됨)
  panel: {
    backgroundColor: COLORS.PANEL,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingVertical: getResponsiveHeight(10),
    paddingBottom: getResponsiveHeight(12),
    marginBottom: getResponsiveHeight(16),
  },
  userScroll: {borderRadius: 14},
  userScrollContent: {
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(6),
  },
  avatarColumn: {
    width: getResponsiveWidth(70),
    height: getResponsiveHeight(98),
    marginRight: getResponsiveWidth(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveIconSize(62),
    height: getResponsiveIconSize(62),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  avatarBtnSelected: {
    borderColor: COLORS.BRAND,
    backgroundColor: COLORS.BRAND_SOFT,
  },
  avatarBtnDisabled: {opacity: 0.6},
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  avatarLabel: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginTop: getResponsiveHeight(6),
  },
  allCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allCircleSelected: {backgroundColor: COLORS.BRAND_SOFT},
  allText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Bold',
    color: COLORS.MUTED,
    letterSpacing: 0.2,
    zIndex: 2,
  },
  allTextSelected: {color: '#FFFFFF'},
  checkBadgeWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [
      {translateX: -getResponsiveWidth(9)},
      {translateY: -getResponsiveWidth(9)},
    ],
    width: getResponsiveWidth(18),
    height: getResponsiveWidth(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    width: getResponsiveWidth(17),
    height: getResponsiveWidth(17),
    resizeMode: 'contain',
  },
});
