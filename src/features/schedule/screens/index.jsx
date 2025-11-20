/* eslint-disable react-native/no-inline-styles */
// ScheduleScreen.jsx
import React from 'react';
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

export default function ScheduleScreen() {
  const {familyId} = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const currentUserId = useSelector(state => state.user.userId);

  // 날짜 관련 상태
  const {selectedDate, setSelectedDate, formattedDate, year, month} =
    useScheduleDate();

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
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <YellowSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 메인 콘텐츠 */}
      <ScrollView
        style={styles.mainContainer}
        showsVerticalScrollIndicator={false}>
        <CalendarToggle
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          scheduleCountPerDay={scheduleCountPerDay}
        />

        <Schedule
          selectedDate={selectedDate}
          onOpenSheet={openSheet}
          refreshTrigger={refreshTrigger}
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
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(10),
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
