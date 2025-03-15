import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
} from "react-native";
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from "../../utils/responsive";

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

export default function ScheduleScreen({navigation}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [hasMemoryButton, setHasMemoryButton] = useState(false); // 해당 요소에 따라 true / false 설정

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

  // useEffect(() => {
  //   if(hasMemoryButton===false){
  //   setHasMemoryButton(true);
  //   }
  //   else if(hasMemoryButton===true){
  //     setHasMemoryButton(false);
  //   }
  // }, []);

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
              style={styles.monthChangeButton}
            >
              <Image
                source={{
                  uri: "https://i.postimg.cc/4xGvZv46/Group-440-5.png",
                }}
                style={{
                  width: getResponsiveWidth(5.63),
                  height: getResponsiveHeight(11.26),
                }}
              ></Image>
              {/* <Text style={styles.monthChangeText}>{"<"}</Text> */}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => changeWeek(1)}
              style={styles.monthChangeButton}
            >
              <Image
                source={{
                  uri: "https://i.postimg.cc/WbLg6mkB/Group-441-2.png",
                }}
                style={{
                  width: getResponsiveWidth(5.63),
                  height: getResponsiveHeight(11.26),
                }}
              ></Image>
            </TouchableOpacity>
          </View>
        </View>

        {/* 📌 주간 캘린더 */}
        <View style={styles.weekContainer}>
          <View style={styles.weekDatesContainer}>
            {weekDates.map((item, index) => (
              <View key={index} style={styles.dayContainer}>
                <Text style={styles.dayText}>
                  {["월", "화", "수", "목", "금", "토", "일"][index]}
                </Text>
                {/* 📌 요일 추가 */}
                <View style={styles.ovalGroup}>
                  <Text style={styles.ovalLeft}></Text>
                  <Text style={styles.ovalRight}></Text>
                </View>
                {/* 📌 아이콘 */}
                <Text
                  style={[
                    styles.dateText,
                    item.isSelected ? styles.selectedText : {},
                  ]}
                >
                  {item.date.getDate()}
                </Text>
                {/* 📌 날짜 */}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 일정 */}
      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>
          <Text style={styles.scheduleTitleHightlight}>{"가족 "}</Text>일정은
          <Text style={styles.scheduleTitleHightlight}>{" 2개 "}</Text>있어요.
        </Text>
        <View style={styles.scheduleElement}>
        <Text
            style={[
              styles.scheduleText,
              {
                width: 220 // "추억 글쓰기" 버튼이 없을 경우 width 240 적용
              },
            ]}
          >
            오후 6시 중식당으로
          </Text>
          <TouchableOpacity
            onPress={() => alert("Button Pressed")}
            style={styles.scheduleButton}
          >
            <Image
              style={styles.buttonIconMemo}
              source={{ uri: "https://i.postimg.cc/TYsZknFG/Group-485.png" }}
            ></Image>
            <Text style={styles.buttonText}>메모</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => alert("Button Pressed")}
            style={styles.scheduleButton}
          >
            <Image
              style={styles.buttonIconMemory}
              source={{ uri: "https://i.postimg.cc/cJfC1xwg/Group-486.png" }}
            ></Image>
            <Text style={styles.buttonText}>추억 글쓰기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleElement}>
          <Text
            style={[
              styles.scheduleText,
              {
                width: 220 // "추억 글쓰기" 버튼이 없을 경우 width 240 적용
              },
            ]}
          >
            할머니 생신
          </Text>
          <TouchableOpacity
            onPress={() => alert("Button Pressed")}
            style={styles.scheduleButton}
          >
            <Image
              style={styles.buttonIconMemo}
              source={{ uri: "https://i.postimg.cc/TYsZknFG/Group-485.png" }}
            ></Image>
            <Text style={styles.buttonText}>메모</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => alert("Button Pressed")}
            style={styles.scheduleButton}
          >
            <Image
              style={styles.buttonIconMemory}
              source={{ uri: "https://i.postimg.cc/cJfC1xwg/Group-486.png" }}
            ></Image>
            <Text style={styles.buttonText}>추억 글쓰기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleElement}>
          <Text
            style={[
              styles.scheduleAddText,
              {
                width: 270 // "추억 글쓰기" 버튼이 없을 경우 width 240 적용
              },
            ]}
          >  + 일정을 추가하세요
          </Text>
          <TouchableOpacity
            onPress={() => alert("Button Pressed")}
            style={[styles.scheduleButton, { backgroundColor: "#D9D9D9" }]}
          >
            <Image
              style={styles.buttonIconMemo}
              source={{ uri: "https://i.postimg.cc/TYsZknFG/Group-485.png" }}
            ></Image>
            <Text style={styles.buttonText}>메모</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.scheduleTitle}>
          <Text style={styles.scheduleTitleHightlight}>{"나의 "}</Text>일정은
          <Text style={styles.scheduleTitleHightlight}>{" 1개 "}</Text>있어요.
        </Text>

        <View style={styles.scheduleElement}>
          <Text
            style={[
              styles.scheduleText,
              {
                width: 270 // "추억 글쓰기" 버튼이 없을 경우 width 240 적용
              },
            ]}
          >
            면접
          </Text>
          <TouchableOpacity
            onPress={() => alert("Button Pressed")}
            style={styles.scheduleButton}
          >
            <Image
              style={styles.buttonIconMemo}
              source={{ uri: "https://i.postimg.cc/TYsZknFG/Group-485.png" }}
            ></Image>
            <Text style={styles.buttonText}>메모</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleElement}>
          <Text
            style={[
              styles.scheduleAddText,
              {
                width: 270 // "추억 글쓰기" 버튼이 없을 경우 width 240 적용
              },
            ]}
          >  + 일정을 추가하세요
          </Text>
          <TouchableOpacity
            onPress={() => alert("Button Pressed")}
            style={[styles.scheduleButton, { backgroundColor: "#D9D9D9" }]}
          >
            <Image
              style={styles.buttonIconMemo}
              source={{ uri: "https://i.postimg.cc/TYsZknFG/Group-485.png" }}
            ></Image>
            <Text style={styles.buttonText}>메모</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(20),
  },

  mainCalendarContainer: {
    // position:'relative',
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: getResponsiveWidth(30),
    paddingVertical: getResponsiveHeight(30),
    borderColor: "#FFC84D",
    borderWidth: 1,
    borderRadius: 20,
    width: getResponsiveWidth(350),
    height: getResponsiveHeight(148),
    marginBottom: getResponsiveHeight(20),
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: getResponsiveHeight(20),
    width: getResponsiveWidth(310),
  },

  monthChangeButtonGroup: {
    display: "flex",
    flexDirection: "row",
    gap: getResponsiveWidth(20),
  },

  monthText: {
    fontFamily: "Pretendard-Bold",
    fontSize: getResponsiveFontSize(15),
  },

  monthChangeButton: {
    color: "black",
  },

  weekContainer: {
    // marginBottom: 10,
    paddingHorizontal: getResponsiveWidth(10),
  },
  weekDatesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: getResponsiveWidth(310),
  },

  dayContainer: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(60),
    justifyContent: "space-between",
    alignItems: "center",
    // margin: 5,
    borderRadius: 10,
    backgroundColor: "white",
    flexDirection: "column", // 📌 세로 방향 정렬
    gap: getResponsiveHeight(5), // 📌 아이콘과 날짜 사이 여백 조정
  },

  dayText: {
    fontFamily: "Pretendard-Regular",
    fontSize: getResponsiveFontSize(12),
    color: "black",
  },

  dateText: {
    fontSize: getResponsiveFontSize(11),
    fontWeight: "bold",
    color: "#333",
  },

  ovalGroup: {
    width: getResponsiveWidth(34),
    height: getResponsiveHeight(30), // 높이 지정 필수
    position: "relative", // 자식 요소들이 절대 위치 지정 가능  },
  },

  ovalLeft: {
    position: "absolute",
    width: getResponsiveWidth(25.33),
    height: getResponsiveHeight(18.33),
    backgroundColor: "rgba(255, 200, 77, 0.6)", // ✅ FFC84D 색상 + 70% 투명도
    borderRadius: getResponsiveHeight(9.165),
    transform: [{ rotate: "45.65deg" }], // ✅ 45도 회전
    left: 0,
    top: getResponsiveHeight(5),
  },

  ovalRight: {
    position: "absolute",
    width: getResponsiveWidth(25.33),
    height: getResponsiveHeight(18.33),
    backgroundColor: "rgba(255, 195, 222, 0.6)", // ✅ FFC84D 색상 + 70% 투명도
    borderRadius: getResponsiveHeight(9.165),
    transform: [{ rotate: "134.35deg" }], // ✅ 45도 회전
    right: 0,
    top: getResponsiveHeight(5),
  },

  selectedText: {
    color: "gray",
  },

  scheduleContainer: {
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    // height:"auto",
    alignItems: "center",
    justifyContent: "center",
  },

  scheduleTitle: {
    fontFamily: "Pretendard-Light",
    fontSize: getResponsiveFontSize(15),
    marginTop: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(15),
  },

  scheduleTitleHightlight: {
    fontFamily: "Pretendard-Bold",
    fontSize: getResponsiveFontSize(20),
  },

  scheduleElement: {
    flexDirection: "row",
    width: getResponsiveWidth(340),
    justifyContent: "center",
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 10,
    gap: 13,
  },

  scheduleText: {
    width: "auto", // 기본적으로 auto 적용
    // width: getResponsiveWidth(240),
    fontSize: getResponsiveFontSize(15),
    backgroundColor: "#FFC84D",
    borderRadius: 10,
    paddingLeft: 20,
    lineHeight: getResponsiveHeight(46.89),
  },

  scheduleAddText: {
    width: "auto", // 기본적으로 auto 적용
    // width: getResponsiveWidth(240),
    fontSize: getResponsiveFontSize(15),
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
    paddingLeft: 20,
    lineHeight: getResponsiveHeight(46.89),
  },

  scheduleButton: {
    position: "relative",
    backgroundColor: "#FFC84D",
    width: getResponsiveWidth(52),
    height: getResponsiveHeight(47),
    alignItems: "center",
    borderRadius: 10,
  },


  buttonIconMemo: {
    position: "absolute",
    bottom: getResponsiveHeight(20),
    width: getResponsiveWidth(18.84),
    height: getResponsiveHeight(20.48),
  },

  buttonIconMemory: {
    position: "absolute",
    bottom: getResponsiveHeight(22),
    width: getResponsiveWidth(20),
    height: getResponsiveHeight(14.3),
  },

  buttonText: {
    position: "absolute",
    bottom: getResponsiveHeight(10),
    fontSize: 10,
  },
});
