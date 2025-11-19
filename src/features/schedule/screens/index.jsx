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
  getResponsiveFontSize,
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

  if (isLoading)
    {return (
      <View style={styles.loadingContainer}>
        <YellowSpinner />
      </View>
    );}

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F9F9F9',
        width: '100%',
        alignContent: 'center',
        alignItems: 'center',
      }}>
      <View style={{flex: 1, backgroundColor: '#F9F9F9'}}>
        {/* ✅ 메인 콘텐츠 */}
        <ScrollView
          style={styles.mainContainer}
          showsVerticalScrollIndicator={false}>
          <>
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
          </>
        </ScrollView>

        {/* ✅ 바텀시트 */}
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
      </View>

      {/* 플로팅 추가 버튼 */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: getResponsiveHeight(15),
          right: getResponsiveWidth(15),
          width: getResponsiveIconSize(75),
          height: getResponsiveIconSize(75),
          zIndex: 0,
        }}
        onPress={() => openSheet(null)}>
        <Image
          source={require('../../../assets/icons/schedule-bt.png')}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(10),
    backgroundColor: '#F9F9F9',
  },
  sheetTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontFamily: 'Pretendard-Regular',
    marginBottom: 20,
    fontSize: getResponsiveFontSize(13),
    color: '#212121',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F2F2F2',
  },
  saveButton: {
    backgroundColor: '#FFC84D',
  },
  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
