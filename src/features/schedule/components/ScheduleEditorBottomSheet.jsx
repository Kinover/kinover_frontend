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
import { View, StyleSheet, Platform, Keyboard, Animated, Modal } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useReduxFontMode} from 'hooks/useReduxFontMode';
import {getSheetSnapPointsByTier} from 'utils/layoutMetrics';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';

import {useScheduleBottomSheetModal} from '../hooks/useScheduleBottomSheetModal';
import ToastModal from 'components/modal/ToastModal';
import CustomModal from 'components/modal/CustomModal';
import {validateLength} from 'utils/validation';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import CustomInput from 'components/CustomInput';
import BottomSheetLayout from 'components/bottomSheet/BottomSheetLayout';
import BottomSheetFooterButtons from 'components/bottomSheet/BottomSheetFooterButtons';
import {
  BOTTOM_SHEET_BUTTON_LABELS,
  getScheduleEditorTitle,
} from 'constants/bottomSheetTitles';
import {
  BOTTOM_SHEET_EDITOR_COLORS as COLORS,
  BOTTOM_SHEET_EDITOR_FLOW as FLOW,
  getBottomSheetEditorBottomSafe,
  getBottomSheetEditorSharedStyles,
  getBottomSheetPrimarySaveButtonStyle,
} from 'components/bottomSheet/bottomSheetEditorSharedStyles';
import {BOTTOMSHEET_STYLE} from 'styles/style';
import {Easing} from 'react-native-reanimated';
import {FONTS} from 'styles/typography';
import {useColors, useIsDark} from 'hooks/useColors';

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
const hasId = (ids, id) =>
  (Array.isArray(ids) ? ids : []).some(x => idEq(x, id));

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

const participantIdsKey = ids =>
  !ids?.length
    ? ''
    : [...new Set((ids || []).map(v => String(v)))].sort().join('\u0001');

/** 편집 모드에서 저장 버튼(변경 없음 비활성화)용 스냅샷 — 로드 effect와 동일 규칙 */
function getEditBaseline(es) {
  if (!es) return null;
  const initTitle = String(
    es?.title ?? es?.name ?? es?.scheduleTitle ?? '',
  ).trim();
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
  const normalizedCandidates = candidateArr ? uniqIds(candidateArr) : [];
  const idsKey =
    initialKind === KIND.ANNIVERSARY
      ? ''
      : participantIdsKey(normalizedCandidates);
  return {title: initTitle, kind: initialKind, idsKey};
}

/** YYYY-MM-DD 문자열 → Date 객체 */
function parseDateString(raw) {
  if (!raw) return new Date();
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return new Date();
}

/** Date 객체 → YYYY-MM-DD 문자열 */
function toDateString(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${dd}`;
}

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
    const themeColors = useColors();
    const isDark = useIsDark();
    const styles = useScaledStyleSheet(
      rf => makeStyles(rf, themeColors, isDark),
      [themeColors, isDark],
    );
    const fontMode = useReduxFontMode();

    const [localKind, setLocalKind] = useState(KIND.INDIVIDUAL);
    const [localSelectedUserIds, setLocalSelectedUserIds] = useState([]);

    const [localDate, setLocalDate] = useState(null); // YYYY-MM-DD 문자열
    const [iosPickerVisible, setIosPickerVisible] = useState(false);
    const [iosTempDate, setIosTempDate] = useState(new Date());

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isClosing, setIsClosing] = useState(false);
    const [isTitleFocused, setIsTitleFocused] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const closingRef = useRef(false);

    const inputRef = useRef(null);
    const blurTitleInput = useCallback(() => {
      inputRef.current?.blur?.();
      setIsTitleFocused(false);
    }, []);

    const titleFocusInteractionRef = useRef(false);
    const titleFocusInteractionTimerRef = useRef(null);
    const markTitleFocusInteraction = useCallback(() => {
      titleFocusInteractionRef.current = true;
      if (titleFocusInteractionTimerRef.current) {
        clearTimeout(titleFocusInteractionTimerRef.current);
      }
      titleFocusInteractionTimerRef.current = setTimeout(() => {
        titleFocusInteractionRef.current = false;
      }, 220);
    }, []);

    const touchLockRef = useRef(false);
    const touchLockTimerRef = useRef(null);
    const lockTouchBriefly = useCallback(() => {
      touchLockRef.current = true;
      if (touchLockTimerRef.current) clearTimeout(touchLockTimerRef.current);
      touchLockTimerRef.current = setTimeout(() => {
        touchLockRef.current = false;
      }, 180);
    }, []);
    useEffect(() => {
      return () => {
        if (touchLockTimerRef.current) clearTimeout(touchLockTimerRef.current);
        if (titleFocusInteractionTimerRef.current) {
          clearTimeout(titleFocusInteractionTimerRef.current);
        }
      };
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

    const sheetSnapPoints = useMemo(() => {
      const [first] = getSheetSnapPointsByTier({
        fontMode,
        normal: ['74%', '92%'],
        large: ['84%', '93%'],
        xl: ['92%', '94%'],
      });
      return [first];
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
      // localDate가 있으면 우선 사용 (사용자가 바텀시트에서 변경한 날짜)
      const date = localDate ?? es?.date ?? dateProp;

      const scheduleId =
        es?.scheduleId ?? es?.id ?? es?.scheduleID ?? undefined;

      const memo = es?.memo ?? memoProp;

      return {
        ...(scheduleId != null ? {scheduleId} : {}),
        familyId,
        date,
        ...(memo != null ? {memo} : {}),
      };
    }, [familyIdProp, dateProp, memoProp, localDate]);

    const dateLabelShort = useMemo(
      () => formatScheduleDateShort(localDate ?? dateProp ?? editingSchedule?.date),
      [localDate, dateProp, editingSchedule?.date],
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

    useEffect(() => {
      setTitleDraft(String(scheduleRef.current ?? ''));
    }, [inputKey, scheduleRef]);

    const sheetAnimationConfigs = useMemo(
      () => ({
        duration: 180,
        easing: Easing.out(Easing.cubic),
      }),
      [],
    );

    const insets = useSafeAreaInsets();
    const bottomSafe = useMemo(
      () => getBottomSheetEditorBottomSafe(insets.bottom, getResponsiveHeight),
      [insets.bottom],
    );
    const SHEET_H = useMemo(() => getResponsiveHeight(330), []);
    const sheetY = useRef(new Animated.Value(SHEET_H)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    const openAndroidDatePicker = useCallback(() => {
      const current = parseDateString(localDate ?? dateProp ?? editingSchedule?.date);
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        display: 'spinner',
        onChange: (event, selectedDate) => {
          if (event?.type === 'dismissed') return;
          if (!selectedDate) return;
          setLocalDate(toDateString(selectedDate));
        },
      });
    }, [localDate, dateProp, editingSchedule?.date]);

    const openIOSActionSheet = useCallback(() => {
      const current = parseDateString(localDate ?? dateProp ?? editingSchedule?.date);
      setIosTempDate(current);
      setIosPickerVisible(true);
      sheetY.setValue(SHEET_H);
      backdropOpacity.setValue(0);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(sheetY, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, [
      localDate,
      dateProp,
      editingSchedule?.date,
      SHEET_H,
      sheetY,
      backdropOpacity,
    ]);

    const closeIOSActionSheet = useCallback(() => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: SHEET_H,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIosPickerVisible(false);
      });
    }, [SHEET_H, sheetY, backdropOpacity]);

    const confirmIOSActionSheet = useCallback(() => {
      setLocalDate(toDateString(iosTempDate));
      closeIOSActionSheet();
    }, [iosTempDate, closeIOSActionSheet]);

    const closeSheet = useCallback(() => {
      if (closingRef.current) return;
      closingRef.current = true;
      setIsClosing(true);
      setIsTitleFocused(false);
      modalRef.current?.dismiss?.();
      setTimeout(() => {
        closingRef.current = false;
      }, 320);
    }, [modalRef]);

    const handleSheetDismiss = useCallback(() => {
      setIsClosing(false);
      closingRef.current = false;
      setIsTitleFocused(false);

      setDeleteModalVisible(false);
      setIosPickerVisible(false);
    }, []);

    useImperativeHandle(ref, () => ({
      present: () => {
        setIsClosing(false);
        closingRef.current = false;
        setIsTitleFocused(false);

        setDeleteModalVisible(false);
        setIosPickerVisible(false);

        // 열릴 때마다 날짜 초기화 (편집 중인 일정 날짜 or 선택된 날짜)
        const initDate = editingScheduleRef.current?.date ?? dateProp ?? null;
        setLocalDate(initDate);

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

    const handleTouchInsideResetOnly = useCallback(() => {
      if (!isTitleFocused) return;
      if (titleFocusInteractionRef.current) return;
      if (touchLockRef.current) return;
      lockTouchBriefly();
      blurTitleInput();
    }, [lockTouchBriefly, isTitleFocused, blurTitleInput]);

    const toggleUser = userId => {
      if (isClosing) return;
      if (isAnniversaryMode) return;
      if (userId == null || String(userId).trim() === '') return;

      const id = userId;
      if (currentKind === KIND.INDIVIDUAL) {
        // 개별 일정은 1명만 선택 가능(라디오 선택처럼 동작)
        if (hasId(safeSelectedIds, id)) return;
        setSelectedUserIdsSafe([id]);
        return;
      }

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
        showToast('개인 일정은 “전체” 선택을 사용할 수 없어요.');
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

      Keyboard.dismiss();

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
        if (count === 0) {
          showToast('일정 대상 구성원을 선택해주세요.');
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
        showToast('일정을 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    };

    const confirmDelete = async () => {
      if (isClosing) return;

      Keyboard.dismiss();

      setDeleteModalVisible(false);
      setIsClosing(true);

      try {
        await handleDelete();
      } catch (e) {
        setIsClosing(false);
        showToast('일정을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
      }
    };

    const handlePressDelete = () => {
      if (isClosing) return;
      setDeleteModalVisible(true);
    };

    const canSave = useMemo(() => {
      const titleText = String(titleDraft ?? '').trim();
      const hasTitle = titleText.length > 0;
      const titleValid = validateLength(titleText, {max: 200}).valid;

      const rawDate = basePayload?.date;
      const hasDate =
        rawDate != null &&
        (rawDate instanceof Date
          ? !Number.isNaN(rawDate.getTime())
          : String(rawDate).trim().length > 0);

      const hasKind =
        currentKind === KIND.INDIVIDUAL ||
        currentKind === KIND.FAMILY ||
        currentKind === KIND.ANNIVERSARY;

      const hasParticipants =
        currentKind === KIND.ANNIVERSARY
          ? true
          : currentKind === KIND.INDIVIDUAL || currentKind === KIND.FAMILY
          ? safeSelectedIds.length > 0
          : false;

      return hasTitle && titleValid && hasDate && hasKind && hasParticipants;
    }, [titleDraft, basePayload?.date, currentKind, safeSelectedIds]);

    const editBaseline = useMemo(
      () => getEditBaseline(editingSchedule),
      [editingSchedule],
    );

    const hasScheduleEdits = useMemo(() => {
      if (!editingSchedule || !editBaseline) return true;
      const curTitle = String(titleDraft ?? '').trim();
      if (curTitle !== editBaseline.title) return true;
      if (currentKind !== editBaseline.kind) return true;
      if (currentKind === KIND.ANNIVERSARY) return false;
      return participantIdsKey(safeSelectedIds) !== editBaseline.idsKey;
    }, [
      editingSchedule,
      editBaseline,
      titleDraft,
      currentKind,
      safeSelectedIds,
    ]);

    const footerProps = useMemo(() => {
      const saveStyle = getBottomSheetPrimarySaveButtonStyle(
        getResponsiveHeight,
        getResponsiveIconSize,
      );
      if (editingSchedule) {
        return {
          onCancel: handlePressDelete,
          onSave: handlePressSave,
          cancelLabel: BOTTOM_SHEET_BUTTON_LABELS.DELETE,
          saveLabel: BOTTOM_SHEET_BUTTON_LABELS.SAVE_ACTION,
          showCancel: true,
          saveDisabled: !canSave || isClosing || !hasScheduleEdits,
          autoCloseOnSave: false,
          saveButtonStyle: saveStyle,
          buttonRowStyle: {marginTop: 0},
        };
      }
      return {
        onSave: handlePressSave,
        saveLabel: BOTTOM_SHEET_BUTTON_LABELS.SAVE_ACTION,
        showCancel: false,
        saveDisabled: !canSave || isClosing,
        autoCloseOnSave: false,
        saveButtonStyle: saveStyle,
        buttonRowStyle: {marginTop: 0},
      };
    }, [
      editingSchedule,
      handlePressSave,
      handlePressDelete,
      canSave,
      isClosing,
      hasScheduleEdits,
      closeSheet,
    ]);

    const memberChipData = useMemo(() => {
      const normalized = (familyUserList || [])
        .map(u => ({
          type: 'USER',
          userId: u?.userId,
          name: u?.name ?? '',
        }))
        .filter(x => x.userId != null && x.userId !== '');

      if (currentKind === KIND.FAMILY) {
        return [{type: 'ALL', userId: -1, name: '전체'}, ...normalized];
      }
      return normalized;
    }, [familyUserList, currentKind]);

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
          <SpringPressable
            key={`${item.type}-${item.userId}`}
            activeOpacity={0.75}
            onPress={onPress}
            disabled={disabledByMode}
            hitSlop={{top: 4, bottom: 4, left: 2, right: 2}}
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
          </SpringPressable>
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

    const showParticipants =
      currentKind === KIND.FAMILY || currentKind === KIND.INDIVIDUAL;

    return (
      <>
        <BottomSheetLayout
          modalRef={modalRef}
          snapPoints={sheetSnapPoints}
          sheetKey={sheetKey}
          title={getScheduleEditorTitle(!!editingSchedule)}
          headerCentered={true}
          onHeaderClosePress={closeSheet}
          animationConfigs={sheetAnimationConfigs}
          containerStyle={{paddingHorizontal: getResponsiveWidth(20)}}
          useInternalScroll={false}
          enableContentPanningGesture={true}
          androidKeyboardInputMode="adjustNothing"
          keyboardOpenSnapIndex={0}
          keyboardCloseSnapIndex={0}
          {...sheetKeyboardProps}
          dismissKeyboardOnPress={true}
          onTouchInside={handleTouchInsideResetOnly}
          onDismiss={handleSheetDismiss}
          disableContentBottomPadding={true}>
          <BottomSheetScrollView
            style={{flex: 1}}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{paddingBottom: getResponsiveHeight(8)}}>
            <View>
              <View style={styles.content}>
                <View style={styles.formColumn}>
                  {/* 날짜 */}
                  <View style={styles.fieldBlock}>
                    <RequiredFieldLabel
                      label="날짜"
                      style={styles.sectionLabel}
                      requiredMarkStyle={styles.requiredMark}
                    />
                    <SpringPressable
                      activeOpacity={0.7}
                      onPress={() => {
                        Keyboard.dismiss();
                        if (Platform.OS === 'android') {
                          openAndroidDatePicker();
                        } else {
                          openIOSActionSheet();
                        }
                      }}
                      style={styles.dateFieldRow}>
                      <AppText
                        allowFontScaling={false}
                        style={styles.dateFieldText}>
                        {dateLabelShort || '날짜를 선택해주세요'}
                      </AppText>
                    </SpringPressable>
                  </View>

                  {/* 제목 */}
                  <View style={styles.fieldBlock}>
                    <RequiredFieldLabel
                      label="제목"
                      style={styles.sectionLabel}
                      requiredMarkStyle={styles.requiredMark}
                    />
                    <View
                      style={[
                        styles.singleLineUnderlineWrap,
                        isTitleFocused && styles.singleLineUnderlineWrapFocused,
                      ]}>
                      <CustomInput
                        bottomSheet
                        allowFontScaling={false}
                        disableFocusStyle={true}
                        disableBaseStyle={true}
                        ref={inputRef}
                        key={`input-${inputKey}`}
                        defaultValue={scheduleRef.current}
                        onChangeText={text => {
                          if (!isClosing) {
                            scheduleRef.current = text;
                            setTitleDraft(text);
                          }
                        }}
                        onTouchStart={markTitleFocusInteraction}
                        onFocus={() => {
                          markTitleFocusInteraction();
                          setIsTitleFocused(true);
                        }}
                        onBlur={() => {
                          setIsTitleFocused(false);
                        }}
                        placeholder="무슨 일정인가요?"
                        placeholderTextColor={COLORS.muted}
                        style={styles.scheduleTitleInput}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                  </View>

                  <View style={styles.typeBlock}>
                    <RequiredFieldLabel
                      label="유형"
                      style={styles.sectionLabel}
                      requiredMarkStyle={styles.requiredMark}
                    />
                    <View style={styles.segmentTrack}>
                      <SpringPressable
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
                          개인
                        </AppText>
                      </SpringPressable>
                      <SpringPressable
                        activeOpacity={0.92}
                        onPress={() => handleKindChange(KIND.FAMILY)}
                        style={[
                          styles.segmentCell,
                          segmentValue === KIND.FAMILY &&
                            styles.segmentCellActive,
                        ]}>
                        <AppText
                          allowFontScaling={false}
                          style={[
                            styles.segmentLabel,
                            segmentValue === KIND.FAMILY &&
                              styles.segmentLabelActive,
                          ]}>
                          가족
                        </AppText>
                      </SpringPressable>
                    </View>
                  </View>

                  {showParticipants ? (
                    <View style={styles.participantBlock}>
                      <RequiredFieldLabel
                        label="구성원"
                        style={styles.sectionLabel}
                        requiredMarkStyle={styles.requiredMark}
                      />
                      <View style={styles.chipWrap}>
                        {memberChipData.map(renderChip)}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </BottomSheetScrollView>
          <BottomSheetFooterButtons
            bottomSafe={bottomSafe}
            includeBottomSafePadding={true}
            excludeSafeForMeasure={false}
            onLayoutHeight={undefined}
            style={[
              styles.footerFlow,
              Platform.OS === 'android' && {
                paddingBottom: getResponsiveHeight(12),
              },
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
          confirmTextStyle={{color: '#111827'}}
        />

        <ToastModal
          visible={toastVisible}
          onClose={hideToast}
          message={toastMessage}
        />
        {Platform.OS === 'ios' && (
          <Modal
            visible={iosPickerVisible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={closeIOSActionSheet}>
            <View style={[StyleSheet.absoluteFill, {justifyContent: 'flex-end'}]}>
              <Animated.View
                style={[styles.sheetBackdrop, {opacity: backdropOpacity}]}>
                <SpringPressable
                  activeOpacity={1}
                  style={StyleSheet.absoluteFill}
                  onPress={closeIOSActionSheet}
                />
              </Animated.View>

              <Animated.View
                style={[styles.sheetBox, {transform: [{translateY: sheetY}]}]}
                pointerEvents="auto">
                <View style={styles.sheetHeader}>
                  <SpringPressable
                    activeOpacity={0.8}
                    onPress={closeIOSActionSheet}
                    style={styles.sheetHeaderBtn}>
                    <AppText style={styles.sheetHeaderText}>취소</AppText>
                  </SpringPressable>

                  <AppText style={styles.sheetTitle}>날짜 선택</AppText>

                  <SpringPressable
                    activeOpacity={0.8}
                    onPress={confirmIOSActionSheet}
                    style={styles.sheetHeaderBtn}>
                    <AppText
                      style={[styles.sheetHeaderText, {color: COLORS.brand}]}>
                      확인
                    </AppText>
                  </SpringPressable>
                </View>

                <View style={styles.sheetPickerArea}>
                  <DateTimePicker
                    value={iosTempDate}
                    mode="date"
                    display="spinner"
                    locale="ko-KR"
                    onChange={(event, selectedDate) => {
                      if (!selectedDate) return;
                      setIosTempDate(selectedDate);
                    }}
                    style={styles.sheetDatePicker}
                  />
                </View>

                <View style={{height: getResponsiveHeight(14)}} />
              </Animated.View>
            </View>
          </Modal>
        )}
      </>
    );
  },
);

ScheduleEditorBottomSheetModal.displayName = 'ScheduleEditorBottomSheetModal';
export default ScheduleEditorBottomSheetModal;

const makeStyles = (rf, themeColors, isDarkMode) => {
  const shared = getBottomSheetEditorSharedStyles(
    rf,
    getResponsiveHeight,
    getResponsiveWidth,
    themeColors,
    isDarkMode,
  );
  return StyleSheet.create({
  ...shared,

  dateFieldRow: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: isDarkMode ? themeColors.borderSubtle : '#F5F5F5',
    borderRadius: getResponsiveWidth(12),
    backgroundColor: isDarkMode ? themeColors.surfaceMuted : '#F5F5F5',
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(11),
    marginTop: getResponsiveHeight(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateFieldText: {
    fontSize: rf(16),
    fontFamily: FONTS.REGULAR,
    color: isDarkMode ? themeColors.textPrimary : COLORS.text,
    letterSpacing: -0.18,
  },

  /** 좌측 정렬 폼 영역 */
  formColumn: {
    alignSelf: 'stretch',
    width: '100%',
  },
  footerFlow: {
    alignSelf: 'stretch',
    width: '100%',
    paddingTop: getResponsiveHeight(6),
    paddingBottom: getResponsiveHeight(2),
  },

  typeBlock: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: getResponsiveHeight(FLOW),
  },

  /** 섹션 구분 — 유형 / 구성원 */
  sectionLabel: {
    alignSelf: 'flex-start',
    ...BOTTOMSHEET_STYLE().sectionLabel,
  },
  requiredMark: {
    color: '#EF4444',
    fontFamily: FONTS.SEMI_BOLD,
  },

  /** 유형: 단일 트랙 세그먼트 (칩과 다른 패턴) */
  segmentTrack: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: '#F5F5F5',
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
    fontSize: rf(14),
    fontFamily: FONTS.SEMI_BOLD,
    color: 'rgba(60, 60, 67, 0.72)',
    letterSpacing: -0.25,
  },
  segmentLabelActive: {
    color: '#111827',
  },

  scheduleTitleInput: {
    ...shared.scheduleTitleInput,
    minHeight: getResponsiveHeight(30),
    maxHeight: getResponsiveHeight(80),
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    includeFontPadding: false,
    fontSize: rf(16),
    fontFamily: FONTS.REGULAR,
    color: isDarkMode ? themeColors.textPrimary : COLORS.text,
    lineHeight: rf(21),
    letterSpacing: -0.18,
    textAlign: 'left',
    textAlignVertical: 'center',
  },

  participantBlock: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: getResponsiveHeight(6),
    marginTop: getResponsiveHeight(2),
    paddingTop: getResponsiveHeight(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(60, 60, 67, 0.1)',
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 0,
    rowGap: getResponsiveHeight(10),
    columnGap: getResponsiveWidth(8),
  },

  /** 구성원: 둥근 사각 태그 (유형 세그먼트와 형태 구분) */
  memberChip: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(18),
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
    flexShrink: 0,
  },
  memberChipSelected: {
    backgroundColor: '#FFC84D',
  },
  memberChipDisabled: {opacity: 0.45},

  memberChipText: {
    fontSize: rf(13.5),
    fontFamily: FONTS.MEDIUM,
    color: '#6B7280',
    letterSpacing: -0.15,
  },
  memberChipTextSelected: {
    color: '#111827',
    fontFamily: FONTS.SEMI_BOLD,
  },

  // iOS 날짜 액션시트 (기간설정 모달과 동일 톤)
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: getResponsiveWidth(18),
    borderTopRightRadius: getResponsiveWidth(18),
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sheetHeader: {
    height: getResponsiveHeight(50),
    paddingHorizontal: getResponsiveWidth(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  sheetHeaderBtn: {
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(8),
    minWidth: getResponsiveWidth(56),
  },
  sheetHeaderText: {
    fontSize: rf(13),
    fontFamily: FONTS.SEMI_BOLD,
    color: '#6B7280',
    textAlign: 'center',
  },
  sheetTitle: {
    fontSize: rf(13),
    fontFamily: FONTS.SEMI_BOLD,
    color: 'black',
    textAlign: 'center',
  },
  sheetPickerArea: {
    paddingVertical: getResponsiveHeight(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDatePicker: {
    width: '100%',
    height: getResponsiveHeight(220),
    alignSelf: 'center',
  },
  });
};
