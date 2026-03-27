/* eslint-disable react-native/no-inline-styles */
// src/features/schedule/screens/ScheduleScreen.jsx
import React, {useMemo, useState, useCallback, useRef} from 'react';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
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
import SchedulePeopleFilterModal from '../components/SchedulePeopleFilterModal';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';

import YellowSpinner from 'components/yellowSpinner';

import {useScheduleDate} from '../hooks/useScheduleDate';
import {useScheduleCounts} from '../hooks/useScheduleCounts';
import {useScheduleCountsFilteredByUsers} from '../hooks/useScheduleCountsFilteredByUsers';
import {useScheduleEditor} from '../hooks/useScheduleEditor';

import useHolidayMap from '../hooks/useHolidayMap';
import {useLocalDateKey} from '../hooks/useLocalDateKey';

import {
  addScheduleThunk,
  updateScheduleThunk,
  deleteScheduleThunk,
} from '../store/scheduleThunk';

import {hapticLight} from 'utils/haptic';
import DropShadow from 'react-native-drop-shadow';
import {SCHEDULE_CARD_SHADOW} from '../constants/scheduleDropShadow';
import {BACKGROUND_COLORS, LAYOUT_STYLE} from 'styles/style';

import ScheduleGuideModal from '../components/ScheduleGuideModal';
import {
  STORE_MOCK_ENABLED,
  getStoreMockFamilyUserListForSchedule,
  getStoreMockUser,
} from '../../home/utils/storeMockData';

const toId = v => {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

// participantIds를 서버 DTO(List<Long>)에 맞게 number[]로 강제 변환
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
  const styles = useScaledStyleSheet(rf => ({

  container: {flex: 1, backgroundColor: '#F9F9F9'},
  mainContentWrap: {flex: 1},
  mainContainer: {
    flex: 1,
    paddingHorizontal: LAYOUT_STYLE().screenPaddingHorizontal,
    paddingTop: getResponsiveHeight(5),
  },
  fabContainer: {
    position: 'absolute',
    bottom: getResponsiveHeight(110),
    right: getResponsiveWidth(13),
    width: getResponsiveIconSize(65),
    height: getResponsiveIconSize(65),
  },
  fabShadow: {
    width: '100%',
    height: '100%',
  },
  fabMeasure: {
    ...StyleSheet.absoluteFillObject,
  },
  fab: {
    width: '100%',
    height: '100%',
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

  }));
  const dispatch = useDispatch();
  const guideCalendarRef = useRef(null);
  const guideFabRef = useRef(null);
  const blockOpenUntilRef = useRef(0);

  const shouldBlockOpen = useCallback(() => {
    return Date.now() < (blockOpenUntilRef.current || 0);
  }, []);

  const blockOpenFor = useCallback((ms = 420) => {
    blockOpenUntilRef.current = Date.now() + ms;
  }, []);

  const {familyId: reduxFamilyId} = useSelector(state => state.family);
  const reduxFamilyUserList = useSelector(
    state => state.userFamily.familyUserList,
  );
  const familyId = STORE_MOCK_ENABLED ? 'mock-family' : reduxFamilyId;
  const familyUserList = STORE_MOCK_ENABLED
    ? getStoreMockFamilyUserListForSchedule()
    : reduxFamilyUserList;
  const reduxUserId = useSelector(state => state.user.userId);
  const currentUserId = STORE_MOCK_ENABLED
    ? getStoreMockUser()?.userId ?? reduxUserId
    : reduxUserId;

  const [calendarMode, setCalendarMode] = useState('month');

  const [selectedUserIds, setSelectedUserIds] = useState([]);

  /** 달력·목록 “누구 일정만 볼지” 필터 (빈 배열 = 전체) */
  const [scheduleViewFilterUserIds, setScheduleViewFilterUserIds] = useState(
    [],
  );
  const [peopleFilterModalVisible, setPeopleFilterModalVisible] =
    useState(false);

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
    scheduleCountPerDay: baseScheduleCountPerDay,
    isLoading,
    refreshTrigger,
    setRefreshTrigger,
    bumpCount,
  } = useScheduleCounts(familyId, year, month);

  const {scheduleCountPerDay: scheduleCountPerDayForCalendar, loadingFiltered} =
    useScheduleCountsFilteredByUsers({
      familyId,
      year,
      month,
      baseCountPerDay: baseScheduleCountPerDay,
      filterUserIds: scheduleViewFilterUserIds,
      refreshTrigger,
    });

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
    selectedUserId, // 조회/필터용(단일)
    setSelectedUserId,
    title,
    setTitle,
    bottomSheetRef,
    openSheet,
    closeSheet,
    handleCancelEdit,
  } = useScheduleEditor(currentUserId);

 /** =========================
 * IMPORTANT: openSheet 래핑
 * - Schedule.jsx에서 주입한 __forcedKind를 절대 잃지 않게
   ========================= */
  const handleOpenSheet = useCallback(
    item => {
      if (shouldBlockOpen()) return;

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
    [openSheet, shouldBlockOpen],
  );

  const birthdayNamesForSelectedDate = birthdayMap?.[selectedDateKey] ?? [];

 /** =========================
 * CRUD: thunk 직접 dispatch
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
      let participantIds = STORE_MOCK_ENABLED
        ? Array.isArray(rawParticipantIds)
          ? [...rawParticipantIds]
          : []
        : toLongArray(rawParticipantIds);

      if (type === 'FAMILY' && participantIds.length === 0) {
        const fallbackIds = (familyUserList || [])
          .map(u => u?.userId)
          .filter(id => id != null && id !== '');
        participantIds = STORE_MOCK_ENABLED ? fallbackIds : toLongArray(fallbackIds);
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
 // config.headers는 로깅하지 말 것 (토큰 등 민감 정보 포함)
        if (__DEV__) {
          console.log('=== [Schedule submit error] ===');
          console.log('status:', e?.response?.status);
          console.log('data:', e?.response?.data);
          console.log('url:', e?.config?.url);
          console.log('method:', e?.config?.method);
        }
        throw e;
      } finally {
        blockOpenFor();
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
      blockOpenFor,
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
      blockOpenFor();
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
    blockOpenFor,
  ]);

  const handleFabPress = useCallback(() => {
    if (shouldBlockOpen()) return;
    if (isLoading) return;
    hapticLight();

    const me = toId(currentUserId);
    setSelectedUserIds(me ? [me] : []);

    openSheet(null);
  }, [isLoading, openSheet, currentUserId, shouldBlockOpen]);

 // iOS: 가이드 모달 닫은 뒤 터치 복구용
  const [contentKey, setContentKey] = useState(0);
  const handleGuideAfterClose = useCallback(() => setContentKey(k => k + 1), []);

  return (
    <View style={styles.container}>
      <ScheduleGuideModal
        enabled={true}
        ready={!isLoading && !!familyId}
        forceVisible={false}
        onAfterClose={handleGuideAfterClose}
        targetRef={guideCalendarRef}
        targetRefsByKey={{
          pick_date: guideCalendarRef,
          add: guideFabRef,
        }}
      />

      <View key={contentKey} style={styles.mainContentWrap}>
        <ScrollView
          style={styles.mainContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isLoading}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
        <View ref={guideCalendarRef} collapsable={false}>
          <CalendarToggle
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            scheduleCountPerDay={scheduleCountPerDayForCalendar}
            holidayMap={holidayMap}
            birthdayMap={birthdayMap}
            mode={calendarMode}
            setMode={setCalendarMode}
            onPressPeopleFilter={() => setPeopleFilterModalVisible(true)}
            peopleFilterActive={scheduleViewFilterUserIds.length > 0}
            peopleFilterLoading={loadingFiltered}
          />
        </View>

        <Schedule
          selectedDate={selectedDate}
          onOpenSheet={handleOpenSheet}
          refreshTrigger={refreshTrigger}
          birthdayNames={birthdayNamesForSelectedDate}
          familyId={familyId}
          familyUserList={familyUserList}
          currentUserId={currentUserId}
          viewFilterUserIds={scheduleViewFilterUserIds}
        />
      </ScrollView>
      </View>

      <SchedulePeopleFilterModal
        visible={peopleFilterModalVisible}
        onClose={() => setPeopleFilterModalVisible(false)}
        onApply={setScheduleViewFilterUserIds}
        familyUserList={familyUserList}
        currentUserId={currentUserId}
        selectedUserIds={scheduleViewFilterUserIds}
      />

      <ScheduleEditorBottomSheetModal
        ref={bottomSheetRef}
        editingSchedule={editingSchedule}
        familyUserList={familyUserList}
        familyId={familyId}
        date={formattedDate}
        currentUserId={currentUserId}
        selectedUserIds={selectedUserIds}
        setSelectedUserIds={setSelectedUserIds}
        title={title}
        setTitle={setTitle}
        onSubmit={onSubmit}
        onDelete={onDelete}
        onRefresh={handleRefresh}
      />

      {/* FAB를 화면 하단 고정하려면, 레이아웃 기준을 줄 수 있는 절대 위치 래퍼 필요 */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <DropShadow
          pointerEvents="box-none"
          style={[styles.fabShadow, SCHEDULE_CARD_SHADOW]}>
          {/* 가이드 측정용: 버튼과 동일 위치/크기 (터치 통과) */}
          <View
            ref={guideFabRef}
            collapsable={false}
            pointerEvents="none"
            style={styles.fabMeasure}
          />
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
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <YellowSpinner />
        </View>
      )}
    </View>
  );
}

