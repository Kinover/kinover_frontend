/* eslint-disable react-native/no-inline-styles */
// src/features/schedule/screens/ScheduleScreen.jsx
import React, {useMemo, useState, useCallback} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';

import {useSelector, useDispatch} from 'react-redux';

import ScheduleEditorBottomSheetModal from '../components/ScheduleEditorBottomSheet';
import CalendarToggle from '../components/Calendar';
import Schedule from '../components/Schedule';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';

import YellowSpinner from '../../../components/YellowSpinner';

import {useScheduleDate} from '../hooks/useScheduleDate';
import {useScheduleCounts} from '../hooks/useScheduleCounts';
import {useScheduleEditor} from '../hooks/useScheduleEditor';

import useHolidayMap from '../hooks/useHolidayMap';
import {useLocalDateKey} from '../hooks/useLocalDateKey';

import {
  addScheduleThunk,
  updateScheduleThunk,
  deleteScheduleThunk,
} from '../store/scheduleThunk';

import {hapticLight} from '../../../utils/haptic';
import DropShadow from 'react-native-drop-shadow';
import {BACKGROUND_COLORS, LAYOUT_STYLE} from 'styles/style';

import ScheduleGuideModal from '../components/ScheduleGuideModal';

const toId = v => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

// ✅ participantIds를 서버 DTO(List<Long>)에 맞게 number[]로 강제 변환
const toLongArray = raw => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(v => {
      if (v == null) return null;
      const n = Number(String(v).trim());
      return Number.isFinite(n) ? n : null;
    })
    .filter(v => v != null);
};

export default function ScheduleScreen() {
  const dispatch = useDispatch();

  const {familyId} = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const currentUserId = useSelector(state => state.user.userId);

  const [calendarMode, setCalendarMode] = useState('month');

  // ✅ 바텀시트(일정 편집) 전용: 다중 선택 배열
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  /** =========================
   * 날짜 관련
   ========================= */
  const {selectedDate, setSelectedDate, formattedDate, year, month} =
    useScheduleDate();

  const holidayMap = useHolidayMap(year);
  const getLocalDateKey = useLocalDateKey();
  const selectedDateKey = getLocalDateKey(selectedDate);

  /** =========================
   * 생일 맵
   ========================= */
  const birthdayMap = useMemo(() => {
    const map = {};

    (familyUserList || []).forEach(u => {
      const birthRaw = u?.birth ?? u?.birthday;
      if (!birthRaw) return;

      const birthDate = new Date(birthRaw);
      if (isNaN(birthDate.getTime())) return;

      const mm = birthDate.getMonth() + 1;
      const dd = birthDate.getDate();

      const thisYearBirth = new Date(year, mm - 1, dd, 12, 0, 0);
      const key = getLocalDateKey(thisYearBirth);

      const name = u?.nickname ?? u?.name ?? '가족';
      map[key] = map[key] ? [...map[key], name] : [name];
    });

    return map;
  }, [familyUserList, year, getLocalDateKey]);

  /** =========================
   * 일정 개수 / 로딩
   ========================= */
  const {
    scheduleCountPerDay,
    isLoading,
    refreshTrigger,
    setRefreshTrigger,
    bumpCount,
  } = useScheduleCounts(familyId, year, month);

  /** =========================
   * Pull to Refresh
   ========================= */
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    if (isLoading) return;

    setRefreshing(true);
    setRefreshTrigger(Date.now());

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, [isLoading, setRefreshTrigger]);

  /** =========================
   * 바텀시트 / 편집 상태
   ========================= */
  const {
    editingSchedule,
    selectedUserId, // ✅ 조회/필터용(단일)
    setSelectedUserId,
    title,
    setTitle,
    bottomSheetRef,
    openSheet,
    closeSheet,
    handleCancelEdit,
  } = useScheduleEditor(currentUserId);

  /** =========================
   * ✅ IMPORTANT: openSheet 래핑
   * - Schedule.jsx에서 주입한 __forcedKind를 절대 잃지 않게
   ========================= */
  const handleOpenSheet = useCallback(
    item => {
      if (!item) {
        openSheet(null);
        return;
      }

      const forced = item?.__forcedKind;
      if (forced) {
        openSheet({...item, __forcedKind: forced});
      } else {
        openSheet(item);
      }
    },
    [openSheet],
  );

  const birthdayNamesForSelectedDate = birthdayMap?.[selectedDateKey] ?? [];

  /** =========================
   * ✅ CRUD: thunk 직접 dispatch
   ========================= */
  const onSubmit = useCallback(
    async incoming => {
      const rawTitle = incoming?.title;
      const finalTitle = typeof rawTitle === 'string' ? rawTitle.trim() : '';
      if (!finalTitle) return;

      const finalFamilyId = incoming?.familyId ?? familyId;
      const finalDate = incoming?.date ?? formattedDate;

      const scheduleId =
        incoming?.scheduleId ??
        editingSchedule?.scheduleId ??
        editingSchedule?.id ??
        undefined;

      const typeRaw =
        incoming?.type ??
        incoming?.scheduleType ??
        incoming?.kind ??
        incoming?.__forcedKind ??
        editingSchedule?.__forcedKind;

      const type = typeRaw ? String(typeRaw).toUpperCase() : null;

      const rawParticipantIds = incoming?.participantIds;
      let participantIds = toLongArray(rawParticipantIds);

      if (type === 'FAMILY' && participantIds.length === 0) {
        participantIds = (familyUserList || [])
          .map(u => Number(u?.userId))
          .filter(n => Number.isFinite(n));
      }

      const payload = {
        ...(scheduleId != null ? {scheduleId} : {}),
        familyId: finalFamilyId,
        date: finalDate,
        title: finalTitle,
        ...(incoming?.memo != null ? {memo: incoming.memo} : {}),
        ...(type != null ? {type} : {}),
        ...(type === 'ANNIVERSARY'
          ? {participantIds: []}
          : rawParticipantIds !== undefined
          ? {participantIds}
          : {}),
      };

      if (!payload.familyId || !payload.date || !payload.type) {
        console.log('❌ [Schedule onSubmit] 필수값 누락:', payload);
        return;
      }

      if (payload.type !== 'ANNIVERSARY') {
        const ids = Array.isArray(payload.participantIds)
          ? payload.participantIds
          : [];
        if (ids.length === 0) {
          throw new Error('PARTICIPANTS_REQUIRED');
        }
      }

      const refresh = {
        familyId: payload.familyId,
        date: payload.date,
        year,
        month,
        userId: selectedUserId,
      };

      try {
        if (editingSchedule) {
          await dispatch(updateScheduleThunk(payload, refresh));
        } else {
          bumpCount(selectedDateKey, 1);
          try {
            await dispatch(addScheduleThunk(payload, refresh));
          } catch (e) {
            bumpCount(selectedDateKey, -1);
            throw e;
          }
        }
      } catch (e) {
        console.log('=== [Schedule submit error] ===');
        console.log('status:', e?.response?.status);
        console.log('data:', e?.response?.data);
        console.log('url:', e?.config?.url);
        console.log('method:', e?.config?.method);
        console.log('request payload:', e?.config?.data);
        console.log('request headers:', e?.config?.headers);
        throw e;
      } finally {
        setRefreshTrigger(prev => prev + 1);
        closeSheet();
      }
    },
    [
      dispatch,
      familyId,
      familyUserList,
      formattedDate,
      year,
      month,
      selectedUserId,
      editingSchedule,
      bumpCount,
      selectedDateKey,
      setRefreshTrigger,
      closeSheet,
    ],
  );

  const onDelete = useCallback(async () => {
    if (!editingSchedule?.scheduleId) return;

    const refresh = {
      familyId,
      date: formattedDate,
      year,
      month,
      userId: selectedUserId,
    };

    try {
      const deleteKey =
        editingSchedule?.date && String(editingSchedule.date).includes('-')
          ? editingSchedule.date
          : selectedDateKey;

      bumpCount(deleteKey, -1);

      await dispatch(deleteScheduleThunk(editingSchedule.scheduleId, refresh));
    } catch (e) {
      console.log('=== [Schedule delete error] ===');
      console.log('status:', e?.response?.status);
      console.log('data:', e?.response?.data);
      throw e;
    } finally {
      setRefreshTrigger(prev => prev + 1);
      closeSheet();
    }
  }, [
    dispatch,
    editingSchedule,
    familyId,
    formattedDate,
    year,
    month,
    selectedUserId,
    bumpCount,
    selectedDateKey,
    setRefreshTrigger,
    closeSheet,
  ]);

  const handleFabPress = useCallback(() => {
    if (isLoading) return;
    hapticLight();

    const me = toId(currentUserId);
    setSelectedUserIds(me ? [me] : []);

    openSheet(null);
  }, [isLoading, openSheet, currentUserId]);

  return (
    <View style={styles.container}>
      {/* ✅✅✅ 일정 가이드 모달 추가 (화면 로딩 준비되면 표시) */}
      <ScheduleGuideModal
        enabled={true}
        ready={!isLoading && !!familyId}
        forceVisible={false}
      />

      <ScrollView
        style={styles.mainContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isLoading}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <CalendarToggle
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          scheduleCountPerDay={scheduleCountPerDay}
          holidayMap={holidayMap}
          birthdayMap={birthdayMap}
          mode={calendarMode}
          setMode={setCalendarMode}
        />

        <Schedule
          selectedDate={selectedDate}
          onOpenSheet={handleOpenSheet}
          refreshTrigger={refreshTrigger}
          birthdayNames={birthdayNamesForSelectedDate}
        />
      </ScrollView>

      <ScheduleEditorBottomSheetModal
        ref={bottomSheetRef}
        editingSchedule={editingSchedule}
        familyUserList={familyUserList}
        familyId={familyId}
        date={formattedDate}
        selectedUserIds={selectedUserIds}
        setSelectedUserIds={setSelectedUserIds}
        title={title}
        setTitle={setTitle}
        onSubmit={onSubmit}
        onDelete={onDelete}
        onRefresh={handleRefresh}
      />

      <DropShadow
        style={{
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.08,
          shadowRadius: 3,
        }}>
        <TouchableOpacity
          style={[styles.fab, isLoading && {opacity: 0.4}]}
          onPress={handleFabPress}
          activeOpacity={0.8}>
          <Image
            source={require('../../../assets/icons/tabs/3/three.png')}
            style={{
              alignSelf: 'center',
              width: '45%',
              height: '45%',
              resizeMode: 'contain',
            }}
            tintColor={'white'}
          />
        </TouchableOpacity>
      </DropShadow>

      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <YellowSpinner />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9'},
  mainContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT_STYLE().screenPaddingHorizontal,
    paddingTop: getResponsiveHeight(5),
  },
  fab: {
    position: 'absolute',
    bottom: getResponsiveHeight(110),
    right: getResponsiveWidth(13),
    width: getResponsiveIconSize(65),
    height: getResponsiveIconSize(65),
    backgroundColor: BACKGROUND_COLORS.primaryBg,
    borderRadius: 999,
    justifyContent: 'center',
  },
  fabIcon: {
    alignSelf: 'center',
    width: '40%',
    height: '40%',
    resizeMode: 'contain',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249,249,249,0.6)',
  },
});
