/* eslint-disable react-native/no-inline-styles */
// ScheduleScreen.jsx
import React, {useMemo, useState, useCallback} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  RefreshControl,
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

// ✅ thunk 직접 사용 (useScheduleCrud 안 씀)
import {
  addScheduleThunk,
  updateScheduleThunk,
  deleteScheduleThunk,
} from '../store/scheduleThunk';

// 🔹 인앱 가이드
import useGuide from 'hooks/useGuide';
// import GuideModal from 'components/GuideModal';

// ✅ HAPTIC
import {hapticLight} from '../../../utils/haptic';
import DropShadow from 'react-native-drop-shadow';

const SCHEDULE_GUIDE_STEPS = [
  {
    title: '날짜별 일정 한눈에 보기',
    description:
      '위쪽 달력에서 날짜를 선택하면, 그날에 등록된 가족 일정이 아래에 정리되어 보여요.',
  },
  {
    title: '바쁜 날 쉽게 알아보기',
    description: '날짜에 표시된 색이 진해질수록 일정이 많다는 뜻이에요.',
  },
  {
    title: '가족별 일정 확인하기',
    description: '일정 카드에서 어떤 가족의 일정인지 바로 확인할 수 있어요.',
  },
  {
    title: '일정 추가·수정·삭제',
    description: '오른쪽 아래 버튼을 눌러 일정을 추가하거나 수정할 수 있어요.',
  },
];

// ✅ id를 string으로 통일(화면 내부에서만)
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

  // ✅ 바텀시트(일정 편집) 전용: 다중 선택 배열(문자열로 관리해도 OK)
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
   * 가이드
   ========================= */
  const guideEnabled = !familyId;
  const {
    isGuideVisible,
    guideStep,
    currentGuide,
    totalSteps,
    nextStep,
    skipGuide,
  } = useGuide('SCHEDULE_GUIDE_SHOWN_V1', SCHEDULE_GUIDE_STEPS, guideEnabled);

  const birthdayNamesForSelectedDate = birthdayMap?.[selectedDateKey] ?? [];

  /** =========================
   * ✅ CRUD: thunk 직접 dispatch
   * - payload.userId(작성자) 보내지 않음
   * - participantIds는 number[]로 변환해서 보냄 (DTO List<Long>)
   * - refreshAfterMutation은 thunk 내부에서 가족조회/카운트 갱신 처리
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

      const type = incoming?.type; // 'INDIVIDUAL' | 'FAMILY' | 'ANNIVERSARY'
      const rawParticipantIds = incoming?.participantIds;

      // ✅ 서버 DTO(List<Long>)에 맞춰 number[]로 강제 변환
      const participantIds = toLongArray(rawParticipantIds);

      const payload = {
        ...(scheduleId != null ? {scheduleId} : {}),
        familyId: finalFamilyId,
        date: finalDate,
        title: finalTitle,
        ...(incoming?.memo != null ? {memo: incoming.memo} : {}),
        ...(type != null ? {type} : {}),
        // ✅ ANNIVERSARY는 비워서 보냄(혹은 아예 생략)
        ...(type === 'ANNIVERSARY'
          ? {participantIds: []}
          : rawParticipantIds !== undefined
          ? {participantIds}
          : {}),
      };

      if (!payload.familyId || !payload.date || !payload.type) return;

      // ✅ INDIVIDUAL/FAMILY는 1명 이상 필요
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
        userId: selectedUserId, // (선택) thunk 내부에서 mode==='USER'일 때만 사용됨
        // mode: 'USER', // 필요할 때만 켜
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
      // mode: 'USER',
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

  // ✅ FAB 클릭 핸들러 (햅틱 포함)
  // - "추가" 모드 기본 선택: 현재 유저 1명 선택(개별 일정 기본값이면 자연스러움)
  const handleFabPress = useCallback(() => {
    if (isLoading) return;
    hapticLight();

    const me = toId(currentUserId);
    setSelectedUserIds(me ? [me] : []);

    openSheet(null);
  }, [isLoading, openSheet, currentUserId]);

  return (
    <View style={styles.container}>
      {/* 메인 콘텐츠 */}
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
          onOpenSheet={openSheet}
          refreshTrigger={refreshTrigger}
          birthdayNames={birthdayNamesForSelectedDate}
        />
      </ScrollView>

      {/* 바텀시트 */}
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

      {/* 플로팅 버튼 */}
      <TouchableOpacity
        style={[styles.fab, isLoading && {opacity: 0.4}]}
        onPress={handleFabPress}
        activeOpacity={0.8}>
        <DropShadow
          style={{
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 5},
            shadowOpacity: 0.3,
            shadowRadius: 2,
          }}>
          <Image
            source={require('../../../assets/icons/schedule-bt.png')}
            style={styles.fabIcon}
          />
        </DropShadow>
      </TouchableOpacity>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <YellowSpinner />
        </View>
      )}

      {/* 가이드 모달 */}
      {/* {currentGuide && (
        <GuideModal
          visible={isGuideVisible}
          step={guideStep}
          totalSteps={totalSteps}
          title={currentGuide.title}
          description={currentGuide.description}
          onNext={nextStep}
          onSkip={skipGuide}
        />
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(14),
    paddingTop: getResponsiveHeight(5),
  },

  fab: {
    position: 'absolute',
    bottom: getResponsiveHeight(110),
    right: getResponsiveWidth(14),
    width: getResponsiveIconSize(65),
    height: getResponsiveIconSize(65),
  },
  fabIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249,249,249,0.6)',
  },
});
