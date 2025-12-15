// src/features/schedule/components/Calendar.jsx (CalendarToggle)
import React, {useRef, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  PanResponder,
  Platform,
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

const RADIUS = 14;

// ✅ 바깥(그림자 담당) / 안쪽(클립 담당) 분리
const shadowWrapStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
  android: {
    elevation: 6,
  },
});

/**
 * ✅ 생일 문자열을 YYYY-MM-DD로 정규화
 * - "1999-03-07", "1999.03.07", "19990307" 다 대응
 * - "03-07" 같이 연도 없는 건 표시 불가(연도 필요)
 */
const normalizeBirthToKey = birth => {
  if (!birth) return null;
  const digits = String(birth).replace(/\D/g, '');
  if (digits.length < 8) return null;

  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);
  return `${y}-${m}-${d}`;
};

/**
 * ✅ members -> { 'YYYY-MM-DD': ['이름1','이름2'] }
 * member 필드 후보: birth / birthday, nickname / name
 */
const buildBirthdayMap = members => {
  const map = {};
  (members || []).forEach(m => {
    const key = normalizeBirthToKey(m?.birth ?? m?.birthday);
    if (!key) return;

    const name = m?.nickname ?? m?.name ?? '가족';
    map[key] = map[key] ? [...map[key], name] : [name];
  });
  return map;
};

export default function CalendarToggle({
  selectedDate,
  setSelectedDate,
  scheduleCountPerDay = {},
  initialMode = 'month',
  holidayMap = {},
  // ✅ 추가: 아래 2개 중 하나만 넘기면 됨
  familyMembers = null, // [{name/nickname, birth/birthday}, ...]
  birthdayMap: birthdayMapProp = null, // {'YYYY-MM-DD': ['누구', ...]}
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

  // ✅ birthdayMap 결정: prop 우선, 없으면 familyMembers로 생성
  const birthdayMap = useMemo(() => {
    if (birthdayMapProp) return birthdayMapProp;
    if (familyMembers) return buildBirthdayMap(familyMembers);
    return {};
  }, [birthdayMapProp, familyMembers]);

  // ✅ 토/일까지 + holidayMap이면 쉬는날
  const isHoliday = date => {
    const key = getLocalDateKey(date);
    const day = date.getDay(); // 0:일, 6:토
    return day === 0 || !!holidayMap?.[key];
  };

  // =========================
  // ✅ 좌우 스와이프로 월/주 변경
  // =========================
  const SWIPE_THRESHOLD = getResponsiveWidth(40);
  const SWIPE_VS_SCROLL_SLOP = 6;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        const absDx = Math.abs(g.dx);
        const absDy = Math.abs(g.dy);

        if (absDx < 10) return false;
        if (absDy > absDx + SWIPE_VS_SCROLL_SLOP) return false;
        return true;
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < SWIPE_THRESHOLD) return;
        if (g.dx > 0) handlePrev();
        else handleNext();
      },
    }),
  ).current;

  return (
    <View style={[styles.container, {paddingHorizontal: OUTER_HPAD}]}>
      {/* =======================
          헤더 (그림자 분리 적용)
         ======================= */}
      <View style={[styles.shadowWrap, shadowWrapStyle, {width: cardWidth}]}>
        <View style={styles.cardInnerHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={openYMD}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Image
                style={styles.calendarIcon}
                source={require('../../../assets/icons/calendar.png')}
              />
            </TouchableOpacity>
            <Text style={styles.monthText}>{headerLabel}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.navButtons}>
              <TouchableOpacity
                onPress={handlePrev}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Image
                  source={{
                    uri: 'https://i.postimg.cc/4xGvZv46/Group-440-5.png',
                  }}
                  style={styles.navIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Image
                  source={{
                    uri: 'https://i.postimg.cc/WbLg6mkB/Group-441-2.png',
                  }}
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
      </View>

      {/* =======================
          캘린더 카드 (그림자 분리 + 스와이프)
         ======================= */}
      <View
        {...panResponder.panHandlers}
        style={[styles.shadowWrap, shadowWrapStyle, {width: cardWidth}]}>
        <View style={styles.cardInnerCalendar}>
          {/* 요일 헤더 */}
          <View style={[styles.weekRow, {width: gridWidth}]}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => {
              const isRestDow = d === '일';
              return (
                <View key={d} style={[styles.weekCell, {width: cellSize}]}>
                  <Text
                    style={[styles.dayText, isRestDow && styles.sundayText]}>
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

                const birthNames = birthdayMap?.[item.key];
                const hasBirthday = !!birthNames?.length;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCell,
                      {width: cellSize, height: cellSize},
                    ]}
                    onPress={() => setSelectedDate(item.date)}
                    hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                    <View
                      style={[
                        styles.innerCircle,
                        hasBirthday && styles.birthdayRing,

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

                      {/* ✅ 생일 표시 (작은 점) */}
                      {/* {hasBirthday && <View style={styles.birthdayDot} />} */}
                      {/* {hasBirthday && (
    <View style={styles.birthdayBadge}>
      <Text style={styles.birthdayBadgeText}>🎂</Text>
    </View>
  )} */}
                      {/* {hasBirthday && (
  <View style={styles.birthdayDots}>
    <View style={styles.birthdayDotMini} />
    <View style={styles.birthdayDotMini} />
  </View>
)} */}
                      {/* {hasBirthday && <View style={styles.balloonTail} />} */}
                      {/* {hasBirthday && (
                        <>
                          <View style={[styles.confetti, {top: 6, left: 8}]} />
                          <View
                            style={[styles.confetti, {top: 14, right: 10}]}
                          />
                        </>
                      )} */}
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

                const birthNames = birthdayMap?.[item.key];
                const hasBirthday = !!birthNames?.length;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dayCell,
                      {width: cellSize, height: cellSize},
                    ]}
                    onPress={() => setSelectedDate(item.date)}
                    hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                    <View
                      style={[
                        styles.innerCircle,
                        hasBirthday && styles.birthdayRing,
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
                      {/* ✅ 생일 표시 (작은 점) */}
                      {hasBirthday && (
                        <>
                          <View style={[styles.confetti, {top: 6, left: 8}]} />
                          <View
                            style={[styles.confetti, {top: 14, right: 10}]}
                          />
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <YMDPickerModal
        visible={showYMD}
        onClose={closeYMD}
        onConfirm={date => {
          closeYMD();
          setSelectedDate(date);
        }}
        initialDate={selectedDate}
        minYear={1950}
        maxYear={2025}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: getResponsiveHeight(8),
    marginBottom: getResponsiveHeight(5),
  },

  // ✅ 그림자 컨테이너(바깥): shadow/elevation만 담당
  shadowWrap: {
    alignSelf: 'center',
    borderRadius: RADIUS,
    backgroundColor: '#FFFFFF', // ✅ Android elevation 안정화
    marginBottom: getResponsiveHeight(10),
  },

  // ✅ 안쪽: 둥근 모서리 + 클립(overflow) 담당
  cardInnerHeader: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
  },

  cardInnerCalendar: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    paddingTop: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(10),
    alignItems: 'center',

    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
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
    tintColor: '#111827',
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
    paddingVertical: getResponsiveHeight(5),
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: 999,
  },

  toggleActive: {},

  toggleText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13.5),
    color: '#6B7280',
  },

  toggleTextActive: {
    color: '#111827',
    fontFamily: 'Pretendard-SemiBold',
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
    borderColor: 'white',
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

  // ✅ 생일 표시 점
  birthdayDot: {
    marginTop: getResponsiveHeight(3),
    width: getResponsiveWidth(5),
    height: getResponsiveWidth(5),
    borderRadius: 999,
    backgroundColor: '#FF5A5F',
  },

  birthdayBadge: {
    position: 'absolute',
    top: getResponsiveHeight(2),
    right: getResponsiveWidth(2),
    width: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
    borderRadius: 999,
    backgroundColor: '#FFF', // 배경 깔아서 가독성 확보
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
  },
  birthdayBadgeText: {
    fontSize: getResponsiveFontSize(10.5),
    lineHeight: getResponsiveFontSize(12),
  },
  birthdayDots: {
    marginTop: getResponsiveHeight(3),
    flexDirection: 'row',
    gap: getResponsiveWidth(2),
  },
  birthdayDotMini: {
    width: getResponsiveWidth(4),
    height: getResponsiveWidth(4),
    borderRadius: 999,
    backgroundColor: '#FF5A5F',
  },
  birthdayRing: {
    borderWidth: 1.5,
    borderColor: '#FF7A7A',
    borderStyle: 'dashed', // iOS 느낌 좋음
  },
  balloonTail: {
    position: 'absolute',
    bottom: -getResponsiveHeight(4),
    width: getResponsiveWidth(6),
    height: getResponsiveHeight(6),
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  // confetti: {
  //   position: 'absolute',
  //   width: 3,
  //   height: 3,
  //   borderRadius: 999,
  //   backgroundColor: '#FF9AA2',
  //   opacity: 0.7,
  // },
});
