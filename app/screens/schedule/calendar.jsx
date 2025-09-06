import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';
import YMDPickerModal from './YMDPickerModal';

export default function CalendarToggle({
  selectedDate,
  setSelectedDate,
  scheduleCountPerDay = {},
  initialMode = 'month', // 'month' | 'week'
}) {
  const {width: screenWidth} = useWindowDimensions();

  const [mode, setMode] = useState(initialMode);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [showYMD, setShowYMD] = useState(false);

  useEffect(() => {
    setCurrentMonth(selectedDate.getMonth());
    setCurrentYear(selectedDate.getFullYear());
  }, [selectedDate]);

  // 🔧 공통 셀 크기 계산 (주/월 동일) + 좌우 여백
  const OUTER_HPAD = getResponsiveWidth(20);
  const GAP = getResponsiveWidth(6);
  const availableWidth = screenWidth - OUTER_HPAD * 2;
  const cellSize = Math.floor((availableWidth - GAP * 6) / 7); // 7열 + 간격 6개
  const gridWidth = cellSize * 7 + GAP * 6;

  // 색 단계
  const COUNT_COLORS = {
    1: '#FFC74D', // 더 진한 옐로우
    2: '#FFB300', // 골드빛 강한 노랑
    3: '#FF9F00', // 오렌지빛 머스터드
    4: '#E68900', // 진한 오렌지-브라운
  };

  const renderCountBadge = count => {
    if (!count || count <= 0) return null;
    const level = count >= 4 ? 4 : count;
    const size = cellSize * 0.22;
    return (
      <View
        style={[
          styles.countBadge,
          {
            backgroundColor: COUNT_COLORS[level],
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  };

  // YYYY-MM-DD (로컬 기준)
  const getLocalDateKey = date => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getCountColorStyle = count => {
    if (count >= 4) return {backgroundColor: '#FFB84D99'}; // 조금 진한 오렌지-노랑
    if (count === 3) return {backgroundColor: '#FFC94D77'}; // 골드빛 진노랑
    if (count === 2) return {backgroundColor: '#FFD84D55'}; // 선명한 노랑
    if (count === 1) return {backgroundColor: '#FFEB4D33'}; // 기본 노랑보다 살짝 진하게
    return {};
  };

  // 월간: 6행(42칸)
  const monthDates = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay()); // 일요일 시작
    const arr = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = getLocalDateKey(d);
      arr.push({
        date: d,
        isCurrentMonth: d.getMonth() === currentMonth,
        isSelected: key === getLocalDateKey(selectedDate),
      });
    }
    return arr;
  }, [currentMonth, currentYear, selectedDate]);

  // 주간: 선택 주(일~토)
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = getLocalDateKey(d);
      return {
        date: d,
        isSelected: key === getLocalDateKey(selectedDate),
      };
    });
  }, [selectedDate]);

  const changeMonth = dir => {
    const newDate = new Date(currentYear, currentMonth + dir, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
    setSelectedDate(newDate);
  };

  const changeWeek = dir => {
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() + dir * 7);
    setSelectedDate(d);
  };

  const headerLabel =
    mode === 'month'
      ? `${currentYear}년 ${currentMonth + 1}월`
      : `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월`;

  return (
    <View style={[styles.container, {paddingHorizontal: OUTER_HPAD}]}>
      {/* 헤더 */}
      <View style={[styles.header, {width: gridWidth, alignSelf: 'center'}]}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: getResponsiveWidth(10),
          }}>
          <Text style={styles.monthText}>{headerLabel}</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowYMD(true)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Image
              style={{flex: 1, width: '100%', height: '100%'}}
              source={require('../../assets/icons/calendar.png')}
            />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: getResponsiveWidth(10),
          }}>
          <View style={styles.navButtons}>
            <TouchableOpacity
              onPress={() =>
                mode === 'month' ? changeMonth(-1) : changeWeek(-1)
              }
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Image
                source={{uri: 'https://i.postimg.cc/4xGvZv46/Group-440-5.png'}}
                style={styles.navIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                mode === 'month' ? changeMonth(1) : changeWeek(1)
              }
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Image
                source={{uri: 'https://i.postimg.cc/WbLg6mkB/Group-441-2.png'}}
                style={styles.navIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.toggleChip, styles.toggleActive]}
              onPress={() => setMode(m => (m === 'month' ? 'week' : 'month'))}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Text style={[styles.toggleText, styles.toggleTextActive]}>
                {mode === 'month' ? '주' : '월'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 요일 헤더 */}
      <View style={[styles.weekRow, {width: gridWidth, alignSelf: 'center'}]}>
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <View key={d} style={{width: cellSize, alignItems: 'center'}}>
            <Text style={styles.dayText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* 월간 */}
      {mode === 'month' ? (
        <View
          style={[
            styles.dateGrid,
            {
              width: gridWidth,
              columnGap: GAP,
              rowGap: GAP,
              alignSelf: 'center',
            },
          ]}>
          {monthDates.map((item, idx) => {
            const key = getLocalDateKey(item.date);
            const count = scheduleCountPerDay[key] || 0; // ← 보정 없이 그대로 사용
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  {
                    width: cellSize,
                    height: cellSize,
                    borderRadius: cellSize / 2,
                  },
                  getCountColorStyle(count),
                  item.isSelected && styles.selectedBox,
                  !item.isCurrentMonth && {opacity: 0.35},
                ]}
                onPress={() => setSelectedDate(item.date)}
                hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                <Text
                  style={[
                    styles.dateText,
                    item.isSelected && styles.selectedText,
                  ]}>
                  {item.date.getDate()}
                </Text>
                {/* {renderCountBadge(count)} */}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        // 주간
        <View
          style={[
            styles.weekGrid,
            {width: gridWidth, columnGap: GAP, alignSelf: 'center'},
          ]}>
          {weekDates.map((item, idx) => {
            const key = getLocalDateKey(item.date);
            const count = scheduleCountPerDay[key] || 0; // ← 보정 없이 그대로 사용
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  {
                    width: cellSize,
                    height: cellSize,
                    borderRadius: cellSize / 2,
                  },
                  getCountColorStyle(count),
                  item.isSelected && styles.selectedBox,
                ]}
                onPress={() => setSelectedDate(item.date)}
                hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                <Text
                  style={[
                    styles.dateText,
                    item.isSelected && styles.selectedText,
                  ]}>
                  {item.date.getDate()}
                </Text>
                {/* {renderCountBadge(count)} */}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <YMDPickerModal
        visible={showYMD}
        onClose={() => setShowYMD(false)}
        onConfirm={date => {
          setShowYMD(false);
          setSelectedDate(date);
        }}
        initialDate={selectedDate}
        minYear={2000}
        maxYear={2100}
      />
    </View>
  );
}

/* ================== styles ================== */
const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingHorizontal: 3,
    marginBottom: getResponsiveHeight(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    alignSelf: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(16),
    paddingHorizontal: getResponsiveWidth(10),
  },
  monthText: {
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '700',
    fontSize: Platform.OS === 'android' ?getResponsiveFontSize(21):getResponsiveFontSize(23),
    color: '#1E1E1E',
    alignSelf: 'center',
    lineHeight: Platform.OS === 'android' ? 22 : 'auto',
    textAlignVertical: 'bottom',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F3F3',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleChip: {
    paddingVertical: getResponsiveHeight(4),
    paddingHorizontal: getResponsiveWidth(12),
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    borderRadius: 40,
  },
  toggleActive: {backgroundColor: 'lightgray'},
  toggleText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13),
    // color: '#7C7C7C',
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  toggleTextActive: {
    // color: '#1E1E1E',
    color: 'white',
    textAlignVertical: 'center',
    textAlign: 'center',

    fontFamily: 'Pretendard-SemiBold',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  navIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(10),
  },
  dayText: {
    textAlign: 'center',
    fontSize: getResponsiveFontSize(16.5),
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '700',
    color: '#444',
  },

  // ✅ 공통 셀 스타일 (주/월 동일 크기)
  dayCell: {
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F9F9F9',
    textAlign: 'center',
    textAlignVertical: 'center',
  },

  // 월/주 컨테이너
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
  },

  dateText: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-Regular',
    color: '#111',
  },
  selectedBox: {
    backgroundColor: '#FFF3D2',
    borderColor: '#FFB000',
    borderWidth: 1,
  },
  selectedText: {
    color: '#333',
    fontFamily: 'Pretendard-SemiBold',
  },
  countBadge: {
    position: 'absolute',
    bottom: getResponsiveHeight(6),
    right: getResponsiveWidth(6),
  },
  iconBtn: {
    position: 'relative',
    width: getResponsiveWidth(20),
    height: getResponsiveWidth(20),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
