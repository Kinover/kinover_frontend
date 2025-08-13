import React, {useMemo, useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import YMDPickerModal from './YMDPickerModal'; // ← 추가

export default function CalendarToggle({
  selectedDate,
  setSelectedDate,
  scheduleCountPerDay = {},
  initialMode = 'month', // 'month' | 'week'
}) {
  const [mode, setMode] = useState(initialMode);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [showYMD, setShowYMD] = useState(false); // ← 추가

  useEffect(() => {
    setCurrentMonth(selectedDate.getMonth());
    setCurrentYear(selectedDate.getFullYear());
  }, [selectedDate]);

  // 색 단계
  const COUNT_COLORS = {
    1: '#FFF4D8',
    2: '#FFE5A9',
    3: '#FFD370',
    4: '#FFB50E', // 4+
  };

  // 카운트 뱃지 렌더
  const renderCountBadge = count => {
    if (!count || count <= 0) return null;
    const level = count >= 4 ? 4 : count;
    return (
      <View style={[styles.countBadge, {backgroundColor: COUNT_COLORS[level]}]}>
        {/* <Text style={styles.countBadgeText}>{count}</Text> */}
      </View>
    );
  };
  const getLocalDateKey = date => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getCountColorStyle = count => {
    if (count >= 4) return {backgroundColor: '#FFB50E'};
    if (count === 3) return {backgroundColor: '#FFD370'};
    if (count === 2) return {backgroundColor: '#FFE5A9'};
    if (count === 1) return {backgroundColor: '#FFF4D8'};
    return {};
  };

  // 월간: 6행(42칸) 그리드 생성
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
        count: scheduleCountPerDay[key] || 0,
        isCurrentMonth: d.getMonth() === currentMonth,
        isSelected: key === getLocalDateKey(selectedDate),
      });
    }
    return arr;
  }, [currentMonth, currentYear, scheduleCountPerDay, selectedDate]);

  // 주간: 선택된 날짜가 포함된 주(일~토)
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = getLocalDateKey(d);
      return {
        date: d,
        count: scheduleCountPerDay[key] || 0,
        isSelected: key === getLocalDateKey(selectedDate),
      };
    });
  }, [selectedDate, scheduleCountPerDay]);

  const changeMonth = dir => {
    // dir: -1 / +1
    const newDate = new Date(currentYear, currentMonth + dir, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
    setSelectedDate(newDate);
  };

  const changeWeek = dir => {
    // dir: -1 / +1 (주 이동)
    const d = new Date(selectedDate);
    d.setDate(selectedDate.getDate() + dir * 7);
    setSelectedDate(d);
  };

  const headerLabel =
    mode === 'month'
      ? `${currentYear}년 ${currentMonth + 1}월`
      : `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월`;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignContent: 'center',
            alignItems: 'center',
            gap: getResponsiveWidth(10),
          }}>
          <Text style={styles.monthText}>{headerLabel}</Text>

          {/* ✅ Y/M/D 버튼 추가 */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowYMD(true)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Image
              style={{flex: 1, width: '100%', height: '100%'}}
              source={require('../../assets/icons/calendar.png')}></Image>
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
              style={[styles.toggleChip, styles.toggleActive]} // 항상 칩 모양 유지
              onPress={() => setMode(m => (m === 'month' ? 'week' : 'month'))}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Text style={[styles.toggleText, styles.toggleTextActive]}>
                {mode === 'month' ? '주' : '월'}
                {/* 현재 모드에 맞춰 라벨 변경 */}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekRow}>
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <View key={d} style={{flex: 1, alignItems: 'center'}}>
            <Text style={styles.dayText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* 콘텐츠 */}
      {mode === 'month' ? (
        <View style={styles.dateGrid}>
          {monthDates.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dayBox,
                getCountColorStyle(item.count),
                item.isSelected && styles.selectedBox,
                !item.isCurrentMonth && {opacity: 0.3},
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
              {renderCountBadge(item.count)}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.weekGrid}>
          {weekDates.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.weekDayBox,
                getCountColorStyle(item.count),
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
            </TouchableOpacity>
          ))}
        </View>
      )}
      <YMDPickerModal
        visible={showYMD}
        onClose={() => setShowYMD(false)}
        onConfirm={date => {
          setShowYMD(false);
          setSelectedDate(date); // 선택 반영 → Month/Week 자동 동기화
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(16),
    paddingHorizontal: 10,
  },
  monthText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(19),
    color: '#1E1E1E',
    alignSelf: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F3F3',
    borderRadius: 999,
    alignItems: 'center',
    alignContent: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  toggleChip: {
    paddingVertical: getResponsiveHeight(5),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 30,
  },
  toggleActive: {
    backgroundColor: 'lightgray',
  },
  toggleText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13),
    color: '#7C7C7C',
  },
  toggleTextActive: {
    color: '#1E1E1E',
    fontFamily: 'Pretendard-SemiBold',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  navIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },

  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(10),
    paddingHorizontal: 2,
  },
  dayText: {
    textAlign: 'center',
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-Medium',
    color: '#444',
  },

  // month grid
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  pickBtn: {
    paddingVertical: getResponsiveHeight(6),
    paddingHorizontal: getResponsiveWidth(10),
    backgroundColor: '#F3F3F3',
    borderRadius: 8,
  },
  pickBtnText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
    color: '#333',
  },
  dayBox: {
    width: `${100 / 7}%`,
    height: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F9F9F9',
  },

  // week grid
  weekGrid: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 2,
  },
  weekDayBox: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F9F9F9',
  },

  dateText: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-Regular',
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
  iconBtn: {
    position: 'relative',
    width: getResponsiveWidth(20),
    height: getResponsiveWidth(20),
    // backgroundColor: '#F3F3F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
