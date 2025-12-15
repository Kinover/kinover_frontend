/* eslint-disable react-native/no-inline-styles */
// ScheduleScreen.jsx
import React, {useMemo} from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
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
// import SwipeNavigator from 'components/SwipeNavigator';

// 날짜 → "YYYY-MM-DD" 키로 변환하는 훅 (달력에서 이미 쓰는 것)
import useHolidayMap from '../hooks/useHolidayMap';
import {useLocalDateKey} from '../hooks/useLocalDateKey';

// 🔹 공통 인앱 가이드 훅 & 모달
import useGuide from 'hooks/useGuide';
import GuideModal from 'components/GuideModal';

// 🔹 일정 화면 가이드 스텝
const SCHEDULE_GUIDE_STEPS = [
  {
    title: '날짜별 일정 한눈에 보기',
    description:
      '위쪽 달력 아이콘을 눌러 날짜를 선택하면, 그날에 등록된 가족 일정이 아래에 정리되어 보여요.',
  },
  {
    title: '바쁜 날 쉽게 알아보기',
    description:
      '날짜에 칠해진 동그라미 색이 진해질수록 일정이 많다는 뜻이에요. 바쁜 날을 바로 확인할 수 있어요.',
  },
  {
    title: '가족별 일정 확인하기',
    description:
      '일정 카드에서 어떤 가족의 일정인지 확인하며, 하루 동안의 흐름을 함께 살펴볼 수 있어요.',
  },
  {
    title: '일정 추가·수정·삭제',
    description:
      '오른쪽 아래 동그란 버튼을 눌러 일정을 추가하고, 기존 일정을 눌러 내용을 수정하거나 삭제할 수 있어요.',
  },
];

export default function ScheduleScreen() {
  const {familyId} = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const currentUserId = useSelector(state => state.user.userId);

  // const year = selectedDate.getFullYear();

  // 날짜 관련 상태
  const {selectedDate, setSelectedDate, formattedDate, year, month} =
    useScheduleDate();
  const holidayMap = useHolidayMap(year);

  // 날짜 → "YYYY-MM-DD" 로 변환하는 함수
  const getLocalDateKey = useLocalDateKey();
  const selectedDateKey = getLocalDateKey(selectedDate); // ✅ 달력 key와 동일 포맷

  const birthdayMap = useMemo(() => {
    const map = {};

    (familyUserList || []).forEach(u => {
      const birthRaw = u?.birth ?? u?.birthday;
      if (!birthRaw) return;

      const birthDate = new Date(birthRaw);
      if (isNaN(birthDate.getTime())) return;

      const mm = birthDate.getMonth() + 1;
      const dd = birthDate.getDate();

      // ✅ "현재 달력 연도"로 생일 날짜 만들기
      // (타임존 꼬임 방지용으로 정오(12:00) 추천)
      const thisYearBirth = new Date(year, mm - 1, dd, 12, 0, 0);

      // ✅ CalendarToggle이 쓰는 키 생성 방식과 100% 동일하게 맞춤
      const key = getLocalDateKey(thisYearBirth);

      const name = u?.nickname ?? u?.name ?? '가족';
      map[key] = map[key] ? [...map[key], name] : [name];
    });

    return map;
  }, [familyUserList, year, getLocalDateKey]);
  // 일정 개수, 로딩, 리프레시
  const {
    scheduleCountPerDay,
    isLoading,
    refreshTrigger,
    setRefreshTrigger,
    bumpCount,
  } = useScheduleCounts(familyId, year, month);

  // 바텀시트 + 편집 상태
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

  // CRUD 액션
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
    selectedDateKey, // ✅ 여기서 넘겨줌
  });

  // 🔹 인앱 가이드 훅은 무조건 여기서 항상 호출 (조건 X)
  const guideEnabled = !familyId;
  const {
    isGuideVisible,
    guideStep,
    currentGuide,
    totalSteps,
    nextStep,
    skipGuide,
  } = useGuide('SCHEDULE_GUIDE_SHOWN_V1', SCHEDULE_GUIDE_STEPS, guideEnabled);

  // 🔹 로딩 분기
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <YellowSpinner />
      </View>
    );
  }
  const birthdayNamesForSelectedDate = birthdayMap?.[selectedDateKey] ?? [];

  return (
    // <SwipeNavigator rightTo="추억" leftTo="소통">
    <View style={styles.container}>
      {/* 메인 콘텐츠 */}
      <ScrollView
        style={styles.mainContainer}
        showsVerticalScrollIndicator={false}>
        <CalendarToggle
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          scheduleCountPerDay={scheduleCountPerDay} // 🔹 날짜별 개수 map
          holidayMap={holidayMap}
          birthdayMap={birthdayMap} // ✅ 추가
        />

        <Schedule
          selectedDate={selectedDate}
          onOpenSheet={openSheet}
          refreshTrigger={refreshTrigger}
          birthdayNames={birthdayNamesForSelectedDate} // ✅ 추가
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

      {/* 플로팅 추가 버튼 */}
      <TouchableOpacity style={styles.fab} onPress={() => openSheet(null)}>
        <Image
          source={require('../../../assets/icons/schedule-bt.png')}
          style={styles.fabIcon}
        />
      </TouchableOpacity>

      {/* 인앱 가이드 모달 */}
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
    // </SwipeNavigator>
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
    bottom: getResponsiveHeight(20),
    right: getResponsiveWidth(18),
    width: getResponsiveIconSize(60),
    height: getResponsiveIconSize(60),
  },
  fabIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
