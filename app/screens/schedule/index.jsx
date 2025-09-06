// ScheduleScreen.jsx
import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import {ActivityIndicator} from 'react-native';

import ScheduleEditorBottomSheetModal from './scheduleEditorBottomSheet';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';

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

  const {familyId} = useSelector(state => state.family);
  const familyUserList = useSelector(state => state.userFamily.familyUserList);
  const currentUserId = useSelector(state => state.user.userId);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleCountPerDay, setScheduleCountPerDay] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [title, setTitle] = useState('');

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['50%'], []);

  const toLocalYMD = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formattedDate = toLocalYMD(selectedDate);
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const lastFetchedYearMonth = useRef('');

  const openSheet = schedule => {
    setEditingSchedule(schedule || null);
    setTitle(schedule?.title || '');
    setSelectedUserId(schedule?.userId ?? currentUserId);
    bottomSheetRef.current?.present?.();
  };

  const closeSheet = () => {
    setEditingSchedule(null);
    setTitle('');
    setSelectedUserId(null);
    bottomSheetRef.current?.dismiss?.();
  };

  // ✅ count 즉시 반영용 낙관적 업데이트
  const bumpCount = (ymd, delta) => {
    setScheduleCountPerDay(prev => {
      const next = {...prev};
      const cur = Number(next[ymd] ?? 0);
      const val = cur + delta;
      if (val <= 0) {
        delete next[ymd];
      } else {
        next[ymd] = val;
      }
      return next;
    });
  };

  const onSubmit = async finalTitle => {
    if (!finalTitle?.trim()) return;

    const payload = {
      title: finalTitle.trim(),
      date: formattedDate,
      personal: !!selectedUserId,
      userId: selectedUserId,
      familyId,
    };

    try {
      if (editingSchedule) {
        await dispatch(
          updateScheduleThunk(
            {...payload, scheduleId: editingSchedule.scheduleId},
            {
              familyId,
              date: formattedDate,
              year,
              month,
              userId: selectedUserId,
            },
          ),
        ).unwrap();
      } else {
        bumpCount(formattedDate, 1);
        await dispatch(
          addScheduleThunk(payload, {
            familyId,
            date: formattedDate,
            year,
            month,
            userId: selectedUserId,
          }),
        ).unwrap();
      }
    } finally {
      lastFetchedYearMonth.current = '';
      await dispatch(
        getScheduleCountPerDayThunk({familyId, year, month}),
      ).unwrap();
      setRefreshTrigger(prev => prev + 1);
      closeSheet();
    }
  };

  // 편집 취소 시 복구
  const handleCancelEdit = () => {
    if (!editingSchedule) return;
    setTitle(editingSchedule.title);
    setSelectedUserId(editingSchedule.userId ?? null);
  };

  // ✅ 삭제
  const handleDeleteSchedule = async () => {
    if (!editingSchedule?.scheduleId) return;
    try {
      // 💥 낙관적 -1
      bumpCount(editingSchedule.date ?? formattedDate, -1);
      await dispatch(
        deleteScheduleThunk(editingSchedule.scheduleId, {
          familyId,
          date: formattedDate,
          year,
          month,
          userId: selectedUserId,
        }),
      ).unwrap();
    } finally {
      lastFetchedYearMonth.current = ''; // 캐시 무시
      await dispatch(
        getScheduleCountPerDayThunk({familyId, year, month}),
      ).unwrap();
      setRefreshTrigger(prev => prev + 1);
      closeSheet();
    }
  };

  // ✅ 월 단위 카운트 최초/월 변경/refreshTrigger 변경 시 fetch
  useEffect(() => {
    if (!familyId) return;

    const paddedMonth = String(month).padStart(2, '0');
    const yearMonthKey = `${year}-${paddedMonth}`;

    setIsLoading(true);
    dispatch(getScheduleCountPerDayThunk({familyId, year, month}))
      .then(res => {
        const raw =
          typeof res.payload === 'string'
            ? JSON.parse(res.payload)
            : res.payload || {};

        const normalized = {};
        Object.keys(raw).forEach(key => {
          const [y, m, d] = key.split('-');
          const paddedKey = `${y}-${String(m).padStart(2, '0')}-${String(
            d,
          ).padStart(2, '0')}`;
          normalized[paddedKey] = raw[key];
        });

        setScheduleCountPerDay(normalized);
        lastFetchedYearMonth.current = yearMonthKey;
      })
      .finally(() => setIsLoading(false));
  }, [familyId, year, month, refreshTrigger]);

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
          {isLoading ? (
            // 🔒 로딩 중에는 날짜/일정 컴포넌트 전혀 렌더 안 함
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFC84D" />
              {/* <Text style={styles.loadingText}>일정을 불러오는 중입니다.</Text> */}
            </View>
          ) : (
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
          )}
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

      {/* 플로팅 추가 버튼 (원하면 로딩 때 숨기고 싶으면 { !isLoading && (...) } 로 감싸면 돼) */}
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
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingTop: '70%',
  },
  loadingText: {
    marginTop: 10,
    fontSize: getResponsiveFontSize(13),
    color: '#999',
    fontFamily: 'Pretendard-Regular',
  },
});
