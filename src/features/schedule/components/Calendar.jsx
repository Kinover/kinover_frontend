// src/features/schedule/components/Calendar.jsx (CalendarToggle)
import React, {useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  PanResponder,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import YMDPickerModal from './YMDPickerModal';
import {useCalendarLayout} from '../hooks/useCalendarLayout';

import {useCalendarMode} from '../hooks/useCalendarMode';
import {useLocalDateKey} from '../hooks/useLocalDateKey';
import {useMonthDates} from '../hooks/useMonthDates';
import {useWeekDates} from '../hooks/useWeekDates';
import {useScheduleCountStyle} from '../hooks/useScheduleCountStyle';
import {useYMDPicker} from '../hooks/useYMDPicker';

export default function CalendarToggle({
  selectedDate,
  setSelectedDate,
  scheduleCountPerDay = {},
  initialMode = 'month',
  holidayMap = {},
}) {
  const {OUTER_HPAD, GAP, cellSize, gridWidth, cardWidth} = useCalendarLayout();

  const {
    mode,
    toggleMode,
    currentMonth,
    currentYear,
    changeMonth,
    changeWeek,
    headerLabel,
  } = useCalendarMode(initialMode, selectedDate, setSelectedDate);

  const getLocalDateKey = useLocalDateKey();

  const monthDates = useMonthDates(
    currentYear,
    currentMonth,
    selectedDate,
    getLocalDateKey,
  );

  const weekDates = useWeekDates(selectedDate, getLocalDateKey);

  const {getCountColorStyle} = useScheduleCountStyle(cellSize);

  const {showYMD, openYMD, closeYMD} = useYMDPicker();

  const handlePrev = () => {
    mode === 'month' ? changeMonth(-1) : changeWeek(-1);
  };

  const handleNext = () => {
    mode === 'month' ? changeMonth(1) : changeWeek(1);
  };

  // ✅ 토/일까지 + holidayMap이면 쉬는날
  const isHoliday = date => {
    const key = getLocalDateKey(date);
    const day = date.getDay(); // 0:일, 6:토
    return day === 0 || day === 6 || !!holidayMap?.[key];
  };

  // =========================
  // ✅ 좌우 스와이프로 월/주 변경
  // =========================
  const SWIPE_THRESHOLD = getResponsiveWidth(40); // 이 거리 이상 밀면 페이지 전환
  const SWIPE_VS_SCROLL_SLOP = 6; // 세로 스크롤이 더 크면 스와이프 무시

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        const absDx = Math.abs(g.dx);
        const absDy = Math.abs(g.dy);

        // 수평이 확실히 우세할 때만 잡기
        if (absDx < 10) return false;
        if (absDy > absDx + SWIPE_VS_SCROLL_SLOP) return false;
        return true;
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < SWIPE_THRESHOLD) return;

        // 오른쪽으로 밀면 "이전", 왼쪽으로 밀면 "다음"
        if (g.dx > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      },
    }),
  ).current;

  return (
    <View style={[styles.container, {paddingHorizontal: OUTER_HPAD}]}>
      {/* 헤더 */}
      <View style={[styles.header, {width: cardWidth, alignSelf: 'center'}]}>
        <View style={styles.headerLeft}>
          <Text style={styles.monthText}>{headerLabel}</Text>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={openYMD}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Image
              style={styles.calendarIcon}
              source={require('../../../assets/icons/calendar.png')}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.navButtons}>
            <TouchableOpacity
              onPress={handlePrev}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Image
                source={{uri: 'https://i.postimg.cc/4xGvZv46/Group-440-5.png'}}
                style={styles.navIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
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
              onPress={toggleMode}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Text style={[styles.toggleText, styles.toggleTextActive]}>
                {mode === 'month' ? '주' : '월'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ✅ 여기(캘린더 카드)에 제스처 붙이면 됨 */}
      <View
        {...panResponder.panHandlers}
        style={[styles.calendarCard, {width: cardWidth, alignSelf: 'center'}]}>
        {/* 요일 헤더 */}
        <View style={[styles.weekRow, {width: gridWidth}]}>
          {['일', '월', '화', '수', '목', '금', '토'].map(d => {
            const isRestDow = d === '일' || d === '토';
            return (
              <View key={d} style={[styles.weekCell, {width: cellSize}]}>
                <Text style={[styles.dayText, isRestDow && styles.sundayText]}>
                  {d}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.divider} />

        {mode === 'month' ? (
          <View
            style={[
              styles.dateGrid,
              {width: gridWidth, columnGap: GAP, rowGap: GAP},
            ]}>
            {monthDates.map((item, idx) => {
              const count = scheduleCountPerDay[item.key] || 0;
              const CIRCLE_SIZE = cellSize * 0.78;
              const holiday = isHoliday(item.date);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dayCell, {width: cellSize, height: cellSize}]}
                  onPress={() => setSelectedDate(item.date)}
                  hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                  <View
                    style={[
                      styles.innerCircle,
                      {
                        width: CIRCLE_SIZE,
                        height: CIRCLE_SIZE,
                        borderRadius: CIRCLE_SIZE / 2,
                      },
                      getCountColorStyle(count),
                      item.isSelected && styles.selectedBox,
                      !item.isCurrentMonth && {opacity: 0.35},
                    ]}>
                    <Text
                      style={[
                        styles.dateText,
                        item.isSelected && styles.selectedText,
                        holiday && styles.holidayText,
                      ]}>
                      {item.date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[styles.weekGrid, {width: gridWidth, columnGap: GAP}]}>
            {weekDates.map((item, idx) => {
              const count = scheduleCountPerDay[item.key] || 0;
              const CIRCLE_SIZE = cellSize * 0.78;
              const holiday = isHoliday(item.date);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dayCell, {width: cellSize, height: cellSize}]}
                  onPress={() => setSelectedDate(item.date)}
                  hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                  <View
                    style={[
                      styles.innerCircle,
                      {
                        width: CIRCLE_SIZE,
                        height: CIRCLE_SIZE,
                        borderRadius: CIRCLE_SIZE / 2,
                      },
                      getCountColorStyle(count),
                      item.isSelected && styles.selectedBox,
                    ]}>
                    <Text
                      style={[
                        styles.dateText,
                        item.isSelected && styles.selectedText,
                        holiday && styles.holidayText,
                      ]}>
                      {item.date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <YMDPickerModal
        visible={showYMD}
        onClose={closeYMD}
        onConfirm={date => {
          closeYMD();
          setSelectedDate(date);
        }}
        initialDate={selectedDate}
        minYear={2000}
        maxYear={2100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: getResponsiveHeight(8),
    marginBottom: getResponsiveHeight(16),
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14),
    marginBottom: getResponsiveHeight(12),
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 1,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },

  monthText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(20),
    color: '#111827',
    letterSpacing: -0.2,
  },

  iconBtn: {
    width: getResponsiveWidth(32),
    height: getResponsiveWidth(32),
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },

  calendarIcon: {
    width: getResponsiveWidth(18),
    height: getResponsiveWidth(18),
    resizeMode: 'contain',
  },

  navButtons: {
    flexDirection: 'row',
    gap: getResponsiveWidth(6),
    alignItems: 'center',
  },

  navIcon: {
    width: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
    resizeMode: 'contain',
  },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    padding: 2,
  },

  toggleChip: {
    paddingVertical: getResponsiveHeight(6),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 999,
  },

  toggleActive: {
    backgroundColor: '#111827',
  },

  toggleText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
    color: '#6B7280',
  },

  toggleTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
  },

  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingTop: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(10),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 1,
    alignItems: 'center',
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: getResponsiveHeight(6),
  },

  weekCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  dayText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.5),
    color: '#6B7280',
    textAlign: 'center',
  },

  sundayText: {
    color: '#EF4444',
  },

  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#EEF2F7',
    marginTop: getResponsiveHeight(6),
    marginBottom: getResponsiveHeight(10),
  },

  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  selectedBox: {
    backgroundColor: '#FFF3D2',
    borderColor: '#FFB000',
  },

  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  weekGrid: {
    flexDirection: 'row',
  },

  dateText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13.5),
    color: '#111827',
  },

  selectedText: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },

  holidayText: {
    color: '#EF4444',
    fontFamily: 'Pretendard-SemiBold',
  },
});
