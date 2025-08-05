import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Image} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';

export default function Calendar({
  selectedDate,
  setSelectedDate,
  scheduleCountPerDay = {},
}) {
  const [monthDates, setMonthDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const getCountColorStyle = count => {
    if (count >= 4) return {backgroundColor: '#FFB50E'}; // 파스텔 블루
    if (count === 3) return {backgroundColor: '#FFD370'}; // 파스텔 퍼플
    if (count === 2) return {backgroundColor: '#FFE5A9'}; // 파스텔 민트
    if (count === 1) return {backgroundColor: '#FFF4D8'}; // 파스텔 옐로우
    return {};
  };

  useEffect(() => {
    setCurrentMonth(selectedDate.getMonth());
    setCurrentYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const getLocalDateKey = date => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const updateMonthDates = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay()); // 일요일부터 시작

    const totalDays = 37;
    const dates = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate); // ✅ 항상 복사
      d.setDate(startDate.getDate() + i); // ✅ 안전하게 날짜 밀기

      const count = scheduleCountPerDay[getLocalDateKey(d)] || 0;

      dates.push({
        date: d,
        isSelected: getLocalDateKey(d) === getLocalDateKey(selectedDate),
        isCurrentMonth: d.getMonth() === currentMonth,
        count,
      });
    }

    setMonthDates(dates);
  };

  useEffect(() => {
    updateMonthDates();
  }, [currentMonth, currentYear, scheduleCountPerDay, selectedDate]);

  const changeMonth = direction => {
    const newDate = new Date(currentYear, currentMonth + direction, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
    setSelectedDate(newDate);
  };

  return (
    <View style={styles.mainCalendarContainer}>
      <View style={styles.header}>
        <Text style={styles.monthText}>
          {currentYear}년 {currentMonth + 1}월
        </Text>

        <View style={styles.monthChangeButtonGroup}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Image
              source={{uri: 'https://i.postimg.cc/4xGvZv46/Group-440-5.png'}}
              style={{width: 15, height: 15, resizeMode: 'contain'}}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Image
              source={{uri: 'https://i.postimg.cc/WbLg6mkB/Group-441-2.png'}}
              style={{width: 15, height: 15, resizeMode: 'contain'}}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekRow}>
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <View key={day} style={{flex: 1, alignItems: 'center'}}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 날짜 그리드 */}
      <View style={styles.dateGrid}>
        {monthDates.map((item, index) => {
          console.log(
            `[DEBUG] ${item.date.toISOString().slice(0, 10)} | 일정 수: ${
              item.count
            } | 선택됨: ${item.isSelected} | 이번 달: ${item.isCurrentMonth}`,
          );
          console.log('[📦 키 목록]', Object.keys(scheduleCountPerDay));

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayBox,
                getCountColorStyle(item.count),
                item.isSelected && styles.selectedBox,
                !item.isCurrentMonth && {opacity: 0.3},
              ]}
              onPress={() => setSelectedDate(item.date)}>
              <Text
                style={[
                  styles.dateText,
                  item.isSelected && styles.selectedText,
                ]}>
                {item.date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCalendarContainer: {
    paddingTop: 12,
    paddingHorizontal: 3,
    marginBottom: getResponsiveHeight(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(25),
    paddingHorizontal: 10,
  },
  monthText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(19),
  },
  monthChangeButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(10),
  },
  dayText: {
    textAlign: 'center',
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Medium',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  dateText: {
    paddingVertical: getResponsiveHeight(12.5),
    fontSize: getResponsiveFontSize(17),
  },
  selectedBox: {
    backgroundColor: '#FFF3D2',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFB000',
  },
  selectedText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
