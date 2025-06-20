import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';

export default function Calendar({selectedDate, setSelectedDate}) {
  const [monthDates, setMonthDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const updateMonthDates = date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay()); // 일요일부터

    const totalDays = 37; // 6줄 × 7칸
    const dates = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push({
        date: d,
        isSelected: d.toDateString() === date.toDateString(),
        isCurrentMonth: d.getMonth() === month,
      });
    }

    setMonthDates(dates);
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  useEffect(() => {
    updateMonthDates(selectedDate);
  }, [selectedDate]);

  const changeMonth = direction => {
    const newDate = new Date(currentYear, currentMonth + direction, 1);
    setSelectedDate(newDate);
    updateMonthDates(newDate);
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
          <Text key={day} style={styles.dayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* 날짜 그리드 */}
      <View style={styles.dateGrid}>
        {monthDates.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayBox,
              item.isSelected && styles.selectedBox,
              !item.isCurrentMonth && {opacity: 0.3},
            ]}
            onPress={() => setSelectedDate(item.date)}>
            <Text
              style={[styles.dateText, item.isSelected && styles.selectedText]}>
              {item.date.getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCalendarContainer: {
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: 20,
    padding: 16,
    marginBottom: getResponsiveHeight(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(20),
  },
  monthText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(18),
  },
  monthChangeButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Medium',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayBox: {
    width: `${100 / 7}%`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: getResponsiveFontSize(15),
    paddingVertical: getResponsiveHeight(12.5),
  },
  selectedBox: {
    backgroundColor: '#FFF3D2',
    borderRadius: 999,
  },
  selectedText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
