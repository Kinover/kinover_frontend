import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';
import Schedule from './schedule';

// 📌 선택한 날짜가 속한 주의 시작 날짜를 구하는 함수
const getWeekStartDate = (date) => {
  const newDate = new Date(date);
  const dayOfWeek = newDate.getDay(); // 0(일) ~ 6(토)

  // 일요일(0)을 포함하는 주의 시작을 월요일(1)로 계산
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일이 시작일
  newDate.setDate(newDate.getDate() + diff); // 주 시작일로 조정
  return newDate;
};

// 📌 현재 선택한 날짜 기준으로 한 주의 날짜를 설정하는 함수
const updateWeekDates = (date, setWeekDates) => {
  const startDate = getWeekStartDate(date); // 주 시작일을 구함
  const newWeekDates = [];

  // 7일을 계산하여 주의 모든 날짜를 배열에 담음
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i); // 각 날짜를 계산
    newWeekDates.push({
      date: currentDate,
      isSelected: currentDate.toDateString() === date.toDateString(), // 선택된 날짜를 확인
    });
  }

  // 주의 날짜 배열을 업데이트
  setWeekDates(newWeekDates);
};

export default function ScheduleScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // 📌 초기 상태로 한 주의 날짜를 설정
  useEffect(() => {
    updateWeekDates(selectedDate, setWeekDates);
    setCurrentMonth(selectedDate.getMonth()); // 선택된 날짜에 맞춰 월 업데이트
    setCurrentYear(selectedDate.getFullYear()); // 선택된 날짜에 맞춰 년도 업데이트
  }, [selectedDate]);

  // 📌 주 변경 함수
  const changeWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction * 7); // 한 주 전후로 날짜 변경
    setSelectedDate(newDate);
  };

  return (
    <ScrollView style={styles.mainContainer}>
      {/* 📌 월, 년도 표시와 주 변경 버튼 */}
      <View style={styles.mainCalendarContainer}>
        <View style={styles.header}>
          <Text style={styles.monthText}>
            {currentYear}년 {currentMonth + 1}월
          </Text>

          <View style={styles.monthChangeButtonGroup}>
            <TouchableOpacity
              onPress={() => changeWeek(-1)}
              style={styles.monthChangeButton}>
              <Image
                source={{
                  uri: 'https://i.postimg.cc/4xGvZv46/Group-440-5.png',
                }}
                style={{
                  width: getResponsiveWidth(5.63),
                  height: getResponsiveHeight(11.26),
                }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => changeWeek(1)}
              style={styles.monthChangeButton}>
              <Image
                source={{
                  uri: 'https://i.postimg.cc/WbLg6mkB/Group-441-2.png',
                }}
                style={{
                  width: getResponsiveWidth(5.63),
                  height: getResponsiveHeight(11.26),
                }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 📌 주간 캘린더 */}
        <View style={styles.weekContainer}>
          <View style={styles.weekDatesContainer}>
            {weekDates.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dayContainer}
                onPress={() => setSelectedDate(item.date)} // 선택한 날짜로 변경
              >
                <Text style={styles.dayText}>
                  {['월', '화', '수', '목', '금', '토', '일'][index]}
                </Text>
                <View style={styles.ovalGroup}>
                  <Text style={styles.ovalLeft}></Text>
                  <Text style={styles.ovalRight}></Text>
                </View>
                <Text
                  style={[
                    styles.dateText,
                    item.isSelected ? styles.selectedText : {},
                  ]}
                >
                  {item.date.getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* 일정 */}
      <Schedule selectedDate={selectedDate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(20),
  },

  mainCalendarContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(30),
    paddingVertical: getResponsiveHeight(30),
    borderColor: '#FFC84D',
    borderWidth: 1,
    borderRadius: 20,
    width: getResponsiveWidth(350),
    height: getResponsiveHeight(148),
    marginBottom: getResponsiveHeight(20),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(20),
    width: getResponsiveWidth(310),
  },

  monthChangeButtonGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: getResponsiveWidth(20),
  },

  monthText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(15),
  },

  monthChangeButton: {
    color: 'black',
  },

  weekContainer: {
    paddingHorizontal: getResponsiveWidth(10),
  },

  weekDatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: getResponsiveWidth(310),
  },

  dayContainer: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(60),
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'white',
    flexDirection: 'column', // 📌 세로 방향 정렬
    gap: getResponsiveHeight(5), // 📌 아이콘과 날짜 사이 여백 조정
  },

  dayText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12),
    color: 'black',
  },

  dateText: {
    fontSize: getResponsiveFontSize(11),
    fontWeight: 'bold',
    color: '#333',
  },

  ovalGroup: {
    width: getResponsiveWidth(34),
    height: getResponsiveHeight(30), // 높이 지정 필수
    position: 'relative',
  },

  ovalLeft: {
    position: 'absolute',
    width: getResponsiveWidth(25.33),
    height: getResponsiveHeight(18.33),
    backgroundColor: 'rgba(255, 200, 77, 0.6)', // ✅ FFC84D 색상 + 70% 투명도
    borderRadius: getResponsiveHeight(9.165),
    transform: [{ rotate: '45.65deg' }],
    left: 0,
    top: getResponsiveHeight(5),
  },

  ovalRight: {
    position: 'absolute',
    width: getResponsiveWidth(25.33),
    height: getResponsiveHeight(18.33),
    backgroundColor: 'rgba(255, 195, 222, 0.6)', // ✅ FFC84D 색상 + 70% 투명도
    borderRadius: getResponsiveHeight(9.165),
    transform: [{ rotate: '134.35deg' }],
    right: 0,
    top: getResponsiveHeight(5),
  },

  selectedText: {
    color: 'gray',
  },

  scheduleContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scheduleTitle: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
    marginTop: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(15),
  },

  scheduleTitleHightlight: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(20),
  },

  scheduleElement: {
    flexDirection: 'row',
    width: getResponsiveWidth(340),
    justifyContent: 'center',
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 10,
    gap: 13,
  },

  scheduleText: {
    fontSize: getResponsiveFontSize(15),
    backgroundColor: '#FFC84D',
    borderRadius: 10,
    paddingLeft: 20,
    lineHeight: getResponsiveHeight(46.89),
  },

  scheduleAddText: {
    fontSize: getResponsiveFontSize(15),
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    paddingLeft: 20,
    lineHeight: getResponsiveHeight(46.89),
  },

  scheduleButton: {
    position: 'relative',
    backgroundColor: '#FFC84D',
    width: getResponsiveWidth(52),
    height: getResponsiveHeight(47),
    alignItems: 'center',
    borderRadius: 10,
  },

  buttonIconMemo: {
    position: 'absolute',
    bottom: getResponsiveHeight(20),
    width: getResponsiveWidth(18.84),
    height: getResponsiveHeight(20.48),
  },

  buttonText: {
    position: 'absolute',
    bottom: getResponsiveHeight(10),
    fontSize: 10,
  },
});
