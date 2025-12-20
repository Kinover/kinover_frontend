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

import {useSelector} from 'react-redux';

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
import {useScheduleCrud} from '../hooks/useScheduleCRUD';

import useHolidayMap from '../hooks/useHolidayMap';
import {useLocalDateKey} from '../hooks/useLocalDateKey';

// 🔹 인앱 가이드
import useGuide from 'hooks/useGuide';
// import GuideModal from 'components/GuideModal';

// ✅ HAPTIC (경로는 네 프로젝트에 맞게 유지/조정)
import {hapticLight} from '../../../utils/haptic';

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

export default function ScheduleScreen() {
  const {familyId} = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const currentUserId = useSelector(state => state.user.userId);

  const [calendarMode, setCalendarMode] = useState('month');

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

    // 🔄 강제 갱신 트리거
    setRefreshTrigger(Date.now());

    // UX용 최소 딜레이
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }, [isLoading, setRefreshTrigger]);

  /** =========================
   * 바텀시트 / 편집 상태
   ========================= */
  const {
    editingSchedule,
    selectedUserId,
    setSelectedUserId,
    title,
    setTitle,
    bottomSheetRef,
    openSheet,
    closeSheet,
    handleCancelEdit,
  } = useScheduleEditor(currentUserId);

  /** =========================
   * CRUD
   ========================= */
  const {onSubmit, handleDeleteSchedule} = useScheduleCrud({
    familyId,
    year,
    month,
    formattedDate,
    selectedUserId,
    editingSchedule,
    bumpCount,
    setRefreshTrigger,
    closeSheet,
    selectedDateKey,
  });

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

  // ✅ FAB 클릭 핸들러 (햅틱 포함)
  const handleFabPress = useCallback(() => {
    if (isLoading) return;
    hapticLight();
    openSheet(null);
  }, [isLoading, openSheet]);

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
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        title={title}
        setTitle={setTitle}
        onSubmit={onSubmit}
        onDelete={handleDeleteSchedule}
        onCancelEdit={handleCancelEdit}
      />

      {/* 플로팅 버튼 */}
      <TouchableOpacity
        style={[styles.fab, isLoading && {opacity: 0.4}]}
        onPress={handleFabPress}
        activeOpacity={0.8}>
        <Image
          source={require('../../../assets/icons/schedule-bt.png')}
          style={styles.fabIcon}
        />
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
    paddingHorizontal: getResponsiveWidth(15),
    paddingTop: getResponsiveHeight(5),
  },

  fab: {
    position: 'absolute',
    bottom: getResponsiveHeight(110),
    right: getResponsiveWidth(18),
    width: getResponsiveIconSize(60),
    height: getResponsiveIconSize(60),
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
