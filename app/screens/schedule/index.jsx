// ScheduleScreen.jsx
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import {ActivityIndicator} from 'react-native';

import ScheduleEditorBottomSheetModal from './scheduleEditorBottomSheet'; // 👈 추가
import {BottomSheetBackdrop} from '@gorhom/bottom-sheet';

import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';

import CalendarToggle from './calendar';
import Schedule from './schedule';
import {
  getScheduleCountPerDayThunk,
  addScheduleThunk,
  updateScheduleThunk,
  deleteScheduleThunk,
} from '../../redux/thunk/scheduleThunk';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';

export default function ScheduleScreen() {
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleCountPerDay, setScheduleCountPerDay] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const {familyId} = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [title, setTitle] = useState('');

  const currentUserId = useSelector(state => state.user.userId);

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['50%'], []);

  const formattedDate = selectedDate.toISOString().split('T')[0];
  const lastFetchedYearMonth = useRef('');

  const openSheet = schedule => {
    setEditingSchedule(schedule);
    setTitle(schedule?.title || '');
    setSelectedUserId(schedule?.userId ?? currentUserId); // default to current user
    bottomSheetRef.current?.present(); // ✅ 대신 이거!
  };

  const closeSheet = () => {
    setEditingSchedule(null);
    setTitle('');
    setSelectedUserId(null);
    bottomSheetRef.current?.dismiss();
  };

  const onSubmit = async () => {
    if (!selectedUserId || !title.trim()) return;

    const payload = {
      title,
      date: formattedDate,
      personal: !!selectedUserId,
      userId: selectedUserId,
      familyId,
    };

    if (editingSchedule) {
      payload.scheduleId = editingSchedule.scheduleId;
      await dispatch(updateScheduleThunk(payload));
    } else {
      await dispatch(addScheduleThunk(payload));
    }

    setRefreshTrigger(prev => prev + 1);
    closeSheet();
  };

  const handleCancelEdit = () => {
    setTitle(editingSchedule.title); // 원래 일정 제목으로 복구
    setSelectedUserId(editingSchedule.userId ?? null); // 유저 선택 복구
  };

  const handleDeleteSchedule = async () => {
    if (editingSchedule?.scheduleId) {
      await dispatch(deleteScheduleThunk(editingSchedule.scheduleId));
      setRefreshTrigger(prev => prev + 1);
      closeSheet();
    }
  };

  useEffect(() => {
    if (!familyId || !selectedDate) return;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const paddedMonth = month.toString().padStart(2, '0');
    const yearMonthKey = `${year}-${paddedMonth}`;

    if (lastFetchedYearMonth.current === yearMonthKey) return;

    setIsLoading(true);
    dispatch(getScheduleCountPerDayThunk({familyId, year, month})).then(res => {
      const raw =
        typeof res.payload === 'string'
          ? JSON.parse(res.payload)
          : res.payload || {};

      const normalized = {};
      Object.keys(raw).forEach(key => {
        const [y, m, d] = key.split('-');
        const paddedKey = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        normalized[paddedKey] = raw[key];
      });

      console.log('[🐾 정상화된 키들]', Object.keys(normalized));
      setScheduleCountPerDay(normalized);
      lastFetchedYearMonth.current = yearMonthKey;
      setIsLoading(false);
    });
  }, [selectedDate, familyId]);

  const handleClose = () => {
    closeSheet();
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#F9F9F9'}} edges={['']}>
      <View style={{flex: 1, backgroundColor: '#F9F9F9'}}>
        {/* ✅ 메인 콘텐츠 */}
        <ScrollView
          style={styles.mainContainer}
          showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFC84D" />
              <Text style={styles.loadingText}>일정 불러오는 중이에요...</Text>
            </View>
          ) : (
            <CalendarToggle
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              scheduleCountPerDay={scheduleCountPerDay}
            />
          )}
          <Schedule
            selectedDate={selectedDate}
            onOpenSheet={openSheet}
            refreshTrigger={refreshTrigger}
          />
        </ScrollView>

        {/* ✅ 바텀시트 + 오버레이 (gorhom에서 자동 처리됨) */}
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
          source={require('../../assets/icons/schedule-bt.png')}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}></Image>
      </TouchableOpacity>
    </SafeAreaView>
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
    paddingVertical: getResponsiveHeight(100),
  },
  loadingText: {
    marginTop: 10,
    fontSize: getResponsiveFontSize(13),
    color: '#999',
    fontFamily: 'Pretendard-Regular',
  },
});
