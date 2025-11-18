// CalendarToggle.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import YMDPickerModal from './YMDPickerModal';
import { useCalendarLayout } from '../hooks/useCalendarLayout';

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
  initialMode = 'month', // 'month' | 'week'
}) {
  const {OUTER_HPAD, GAP, cellSize, gridWidth} = useCalendarLayout();

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

  const {getCountColorStyle /*, renderCountBadge*/} =
    useScheduleCountStyle(cellSize);

  const {showYMD, openYMD, closeYMD} = useYMDPicker();

  const handlePrev = () => {
    mode === 'month' ? changeMonth(-1) : changeWeek(-1);
  };

  const handleNext = () => {
    mode === 'month' ? changeMonth(1) : changeWeek(1);
  };

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
            onPress={openYMD}
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
            const count = scheduleCountPerDay[item.key] || 0;
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
                {/* 필요하면 다시 사용
                {renderCountBadge(count)}
                */}
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
            const count = scheduleCountPerDay[item.key] || 0;
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
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(20)
        : getResponsiveFontSize(21),
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
    paddingHorizontal: getResponsiveWidth(10),
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    borderRadius: 40,
  },
  toggleActive: {backgroundColor: 'lightgray'},
  toggleText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13),
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  toggleTextActive: {
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
    fontSize: getResponsiveFontSize(15.5),
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '700',
    color: '#444',
  },
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
    fontSize: getResponsiveFontSize(15.5),
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
