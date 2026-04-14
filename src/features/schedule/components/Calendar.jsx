/* eslint-disable react-native/no-inline-styles */
// src/features/schedule/components/Calendar.jsx (CalendarToggle)

import React, {useRef, useMemo, useEffect, useCallback} from 'react';
import {View, TouchableOpacity, Image, PanResponder, Platform} from 'react-native';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';

import {useCalendarLayout} from '../hooks/useCalendarLayout';
import {useCalendarMode} from '../hooks/useCalendarMode';
import {useLocalDateKey} from '../hooks/useLocalDateKey';
import {useMonthDates} from '../hooks/useMonthDates';
import {useWeekDates} from '../hooks/useWeekDates';
import {useScheduleCountStyle} from '../hooks/useScheduleCountStyle';
import {useYMDPicker} from '../hooks/useYMDPicker';

import DropShadow from 'react-native-drop-shadow';
import FastImage from '@d11/react-native-fast-image';

import {
  SCHEDULE_CARD_SHADOW,
  getScheduleShadowBoxBaseStyle,
} from '../constants/scheduleDropShadow';
import {COLORS, DEFAULT_STYLE} from 'styles/style';

import DatePicker from 'react-native-date-picker';

const RADIUS = 14;

const TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  FAMILY: 'FAMILY',
  ANNIVERSARY: 'ANNIVERSARY',
};

const COLOR = {
  ANNIV: '#F59E0B',
  FAMILY: '#3B82F6',
  /** 키노 PINK 테마·kinoSelectScreen highlight와 동일 */
  INDIVIDUAL: '#EC4899',
  FOCUS_BG: 'rgba(17, 24, 39, 0.096)',
  FOCUS_BORDER: '#111827',
  FOCUS_TEXT: '#111827',
};

const normalizeBirthToKey = birth => {
  if (!birth) return null;
  const digits = String(birth).replace(/\D/g, '');
  if (digits.length < 8) return null;

  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);
  return `${y}-${m}-${d}`;
};

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

const normalizeCount = v => {
  if (v == null)
    return {
      total: 0,
      individual: 0,
      family: 0,
      anniversary: 0,
      type: null,
    };

  if (typeof v === 'string') {
    const type = String(v).toUpperCase();
    return {
      total: 1,
      individual: type === TYPE.INDIVIDUAL ? 1 : 0,
      family: type === TYPE.FAMILY ? 1 : 0,
      anniversary: type === TYPE.ANNIVERSARY ? 1 : 0,
      type,
    };
  }

  if (typeof v === 'number') {
    return {
      total: v,
      individual: v,
      family: 0,
      anniversary: 0,
      type: null,
    };
  }

  const total = Number(v.total ?? v.count ?? 0) || 0;
  const individual = Number(v.individual ?? v.personal ?? 0) || 0;
  const family = Number(v.family ?? v.shared ?? 0) || 0;
  const anniversary = Number(v.anniversary ?? 0) || 0;

  const typeRaw =
    v.type ?? v.scheduleType ?? v.kind ?? v.scheduleKind ?? v.category ?? null;
  const type = typeRaw ? String(typeRaw).toUpperCase() : null;

  const safeTotal = total || individual + family + anniversary;

  return {total: safeTotal, individual, family, anniversary, type};
};

const mergeBirthdayIntoCounts = (counts, hasBirthday) => {
  if (!hasBirthday) return counts;

  const next = {
    ...counts,
    anniversary: (counts?.anniversary || 0) + 1,
  };

  const baseTotal = Number(next?.total || 0);
  const safeTotal =
    baseTotal ||
    Number(next.individual || 0) +
      Number(next.family || 0) +
      Number(next.anniversary || 0);

  return {
    ...next,
    total: safeTotal + (baseTotal ? 1 : 0),
  };
};

export default function CalendarToggle({
  selectedDate,
  setSelectedDate,
  scheduleCountPerDay = {},
  initialMode = 'month',
  holidayMap = {},
  familyMembers = null,
  birthdayMap: birthdayMapProp = null,
  mode: modeProp = null,
  setMode: setModeProp = null,
  onPressPeopleFilter,
  peopleFilterActive = false,
  peopleFilterLoading = false,
}) {
  const styles = useScaledStyleSheet(rf => ({
    container: {
      paddingTop: getResponsiveHeight(8),
      marginBottom: getResponsiveHeight(5),
    },
    shadowBox: {
      ...getScheduleShadowBoxBaseStyle(),
    },
    calendarTouchWrap: {
      width: '100%',
      borderRadius: RADIUS,
    },
    cardInnerHeader: {
      borderRadius: RADIUS,
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
      paddingVertical: getResponsiveHeight(10),
      paddingHorizontal: getResponsiveWidth(14),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardInnerCalendar: {
      borderRadius: RADIUS,
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
      paddingTop: getResponsiveHeight(8),
      paddingBottom: getResponsiveHeight(10),
      paddingHorizontal: getResponsiveWidth(10),
      alignItems: 'center',
    },

    headerLeft: {
      flex: 1,
      minWidth: 0,
    },
    /** 달력 아이콘 + 월/주 라벨 — `iconBtn`과 동일 토큰, 너비는 내용만큼만 (아이콘은 날짜 왼쪽 = LTR 관례) */
    headerLeftDatePicker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveWidth(8),
      alignSelf: 'flex-start',
      maxWidth: '100%',
      backgroundColor: '#F3F4F6',
      borderRadius: 10,
      paddingHorizontal: getResponsiveWidth(10),
      minHeight: getResponsiveWidth(32),
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveWidth(10),
    },
    monthText: {
      flexShrink: 1,
      fontFamily: DEFAULT_STYLE().sectionTitle.fontFamily,
      fontSize: DEFAULT_STYLE().sectionTitle.fontSize,
      color: COLORS.textPrimary,
      letterSpacing: -0.2,
    },
    iconBtn: {
      width: getResponsiveWidth(32),
      height: getResponsiveWidth(32),
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      resizeMode: 'contain',
    },
    calendarIcon: {
      width: getResponsiveWidth(18),
      height: getResponsiveWidth(18),
      resizeMode: 'contain',
      tintColor: '#525252',
    },
    navButtons: {
      flexDirection: 'row',
      gap: getResponsiveWidth(6),
      alignItems: 'center',
    },
    navIcon: {
      width: getResponsiveWidth(15),
      height: getResponsiveWidth(15),
      resizeMode: 'contain',
    },
    peopleFilterBtn: {
      position: 'relative',
    },
    peopleFilterIcon: {
      width: getResponsiveWidth(18),
      height: getResponsiveWidth(18),
      resizeMode: 'contain',
    },
    peopleFilterBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: COLOR.ANNIV,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
    },
    /** 주/월 전환 — `iconBtn`과 동일 크기·배경·모서리 */
    toggleTextInIcon: {
      fontSize: rf(12.5),
      fontFamily: 'Pretendard-SemiBold',
      color: '#111827',
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
      fontSize: rf(12.5),
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
      backgroundColor: COLOR.FOCUS_BG,
      borderColor: COLOR.FOCUS_BORDER,
      borderWidth: 1,
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
      fontSize: rf(13.5),
      color: '#111827',
    },
    selectedText: {
      fontFamily: 'Pretendard-SemiBold',
      color: COLOR.FOCUS_TEXT,
    },
    holidayText: {
      color: '#EF4444',
      fontFamily: 'Pretendard-SemiBold',
    },

    absoluteLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },

    dotRow: {
      position: 'absolute',
      bottom: getResponsiveHeight(6),
      flexDirection: 'row',
      gap: getResponsiveWidth(3),
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotBase: {
      width: getResponsiveWidth(4.5),
      height: getResponsiveWidth(4.5),
      borderRadius: 999,
    },
    dotAnniv: {
      backgroundColor: COLOR.ANNIV,
    },
    dotFamily: {
      backgroundColor: COLOR.FAMILY,
    },
    dotIndividual: {
      backgroundColor: COLOR.INDIVIDUAL,
    },
  }));
  const {OUTER_HPAD, GAP, cellSize, gridWidth, cardWidth} = useCalendarLayout();

  const {
    mode,
    toggleMode,
    currentMonth,
    currentYear,
    changeMonth,
    changeWeek,
    headerLabel,
  } = useCalendarMode(
    initialMode,
    selectedDate,
    setSelectedDate,
    modeProp,
    setModeProp,
  );

  const getLocalDateKey = useLocalDateKey();

  const monthDates = useMonthDates(
    currentYear,
    currentMonth,
    selectedDate,
    getLocalDateKey,
  );

  const weekDates = useWeekDates(selectedDate, getLocalDateKey);
  const {getCountColorStyle} = useScheduleCountStyle(cellSize);

  // showYMD가 source of truth (iOS only)
  const {showYMD, openYMD, closeYMD} = useYMDPicker();

  const handleOpenYMD = useCallback(() => {
    if (Platform.OS === 'android') {
      const current =
        selectedDate instanceof Date && !isNaN(selectedDate)
          ? selectedDate
          : new Date();
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        display: 'spinner',
        onChange: (event, pickedDate) => {
          if (event?.type === 'dismissed' || !pickedDate) return;
          setSelectedDate(pickedDate);
        },
      });
    } else {
      openYMD();
    }
  }, [selectedDate, setSelectedDate, openYMD]);

  const birthdayMap = useMemo(() => {
    if (birthdayMapProp) return birthdayMapProp;
    if (familyMembers) return buildBirthdayMap(familyMembers);
    return {};
  }, [birthdayMapProp, familyMembers]);

  const isHoliday = date => {
    const key = getLocalDateKey(date);
    const day = date.getDay();
    return day === 0 || !!holidayMap?.[key];
  };

  // =========================
  // 좌우 스와이프
  // =========================
  const SWIPE_THRESHOLD = getResponsiveWidth(40);
  const SWIPE_VS_SCROLL_SLOP = 6;

  const swipePrevRef = useRef(() => {});
  const swipeNextRef = useRef(() => {});

  useEffect(() => {
    swipePrevRef.current = () => {
      if (mode === 'month') changeMonth(-1);
      else changeWeek(-1);
    };
    swipeNextRef.current = () => {
      if (mode === 'month') changeMonth(1);
      else changeWeek(1);
    };
  }, [mode, changeMonth, changeWeek]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        // 모달이 열려있으면 뒤에서 스와이프 판정 금지
        if (showYMD) return false;

        const absDx = Math.abs(g.dx);
        const absDy = Math.abs(g.dy);

        if (absDx < 10) return false;
        if (absDy > absDx + SWIPE_VS_SCROLL_SLOP) return false;
        return true;
      },
      onPanResponderRelease: (_, g) => {
        if (showYMD) return;
        if (Math.abs(g.dx) < SWIPE_THRESHOLD) return;
        if (g.dx > 0) swipePrevRef.current();
        else swipeNextRef.current();
      },
    }),
  ).current;

  // =========================
  // 월<->주 애니메이션
  // =========================
  const monthH = useSharedValue(0);
  const weekH = useSharedValue(0);

  const monthWeekRows = Math.max(1, Math.ceil(monthDates.length / 7));
  const EST_MONTH_H =
    cellSize * monthWeekRows + GAP * Math.max(0, monthWeekRows - 1);
  const EST_WEEK_H = cellSize;

  const containerH = useSharedValue(
    mode === 'month' ? EST_MONTH_H : EST_WEEK_H,
  );
  const monthOpacity = useSharedValue(mode === 'month' ? 1 : 0);
  const weekOpacity = useSharedValue(mode === 'week' ? 1 : 0);

  const onMonthLayout = useCallback(
    e => {
      const h = e?.nativeEvent?.layout?.height ?? 0;
      if (!h) return;
      monthH.value = h;
      if (mode === 'month') containerH.value = h;
    },
    [mode, monthH, containerH],
  );

  const onWeekLayout = useCallback(
    e => {
      const h = e?.nativeEvent?.layout?.height ?? 0;
      if (!h) return;
      weekH.value = h;
      if (mode === 'week') containerH.value = h;
    },
    [mode, weekH, containerH],
  );

  useEffect(() => {
    const toHeight =
      mode === 'month'
        ? monthH.value || EST_MONTH_H
        : weekH.value || EST_WEEK_H;

    containerH.value = withTiming(toHeight || 0, {duration: 260});

    if (mode === 'month') {
      monthOpacity.value = withTiming(1, {duration: 140});
      weekOpacity.value = withTiming(0, {duration: 120});
    } else {
      weekOpacity.value = withTiming(1, {duration: 140});
      monthOpacity.value = withTiming(0, {duration: 120});
    }
  }, [
    mode,
    EST_MONTH_H,
    EST_WEEK_H,
    monthH,
    weekH,
    containerH,
    monthOpacity,
    weekOpacity,
  ]);

  const gridClipStyle = useAnimatedStyle(() => ({
    height: containerH.value,
    overflow: 'hidden',
  }));

  const monthLayerStyle = useAnimatedStyle(() => ({
    opacity: monthOpacity.value,
  }));

  const weekLayerStyle = useAnimatedStyle(() => ({
    opacity: weekOpacity.value,
  }));

  const renderDots = counts => {
    const typeFamily = counts?.type === TYPE.FAMILY;
    const typeIndividual = counts?.type === TYPE.INDIVIDUAL;

    const showAnnivDot = (counts.anniversary || 0) > 0;
    const showFamilyDot = (counts.family || 0) > 0 || typeFamily;
    const showIndividualDot =
      (counts.individual || 0) > 0 || typeIndividual;

    if (!showAnnivDot && !showFamilyDot && !showIndividualDot) return null;

    return (
      <View style={styles.dotRow}>
        {showAnnivDot ? (
          <View style={[styles.dotBase, styles.dotAnniv]} />
        ) : null}
        {showFamilyDot ? (
          <View style={[styles.dotBase, styles.dotFamily]} />
        ) : null}
        {showIndividualDot ? (
          <View style={[styles.dotBase, styles.dotIndividual]} />
        ) : null}
      </View>
    );
  };

  /** 일정은 미래 날짜도 필요 — 피커 상한만 둠 (하한 1950과 대칭) */
  const computedMaxYear = useMemo(() => 2100, []);

  return (
    <View style={[styles.container, {paddingHorizontal: OUTER_HPAD}]}>
      {/* Header */}
      <DropShadow
        style={[
          styles.shadowBox,
          {
            width: cardWidth,
            ...SCHEDULE_CARD_SHADOW,
          },
        ]}>
        <View style={styles.cardInnerHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.headerLeftDatePicker}
              onPress={handleOpenYMD}
              activeOpacity={0.72}
              hitSlop={{top: 4, bottom: 4, left: 2, right: 2}}>
              <Image
                style={styles.calendarIcon}
                source={require('../../../assets/icons/calendar.png')}
              />
              <AppText
                allowFontScaling={false}
                style={styles.monthText}
                numberOfLines={1}>
                {headerLabel}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            {typeof onPressPeopleFilter === 'function' ? (
              <TouchableOpacity
                style={[
                  styles.iconBtn,
                  styles.peopleFilterBtn,
                  peopleFilterLoading ? {opacity: 0.55} : null,
                ]}
                onPress={onPressPeopleFilter}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Image
                  source={require('../../../assets/icons/tabs/2/user.png')}
                  style={styles.peopleFilterIcon}
                />
                {peopleFilterActive ? (
                  <View style={styles.peopleFilterBadge} />
                ) : null}
              </TouchableOpacity>
            ) : null}

            <View style={styles.navButtons}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  mode === 'month' ? changeMonth(-1) : changeWeek(-1)
                }
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Image
                  source={require('../../../assets/icons/leftArrow_gray_bold.png')}
                  style={styles.navIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  mode === 'month' ? changeMonth(1) : changeWeek(1)
                }
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Image
                  source={require('../../../assets/icons/rightArrow_gray_bold.png')}
                  style={styles.navIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={toggleMode}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <AppText allowFontScaling={false} style={styles.toggleTextInIcon}>
                {mode === 'month' ? '주' : '월'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </DropShadow>

      {/* Calendar */}
      <DropShadow
        style={[
          styles.shadowBox,
          {
            width: cardWidth,
            ...SCHEDULE_CARD_SHADOW,
          },
        ]}>
        {/* 모달 열리면 panHandlers 자체를 안 붙임 (더 안전) */}
        <View
          {...(!showYMD ? panResponder.panHandlers : {})}
          style={styles.calendarTouchWrap}>
          <View style={styles.cardInnerCalendar}>
            <View style={[styles.weekRow, {width: gridWidth}]}>
              {['일', '월', '화', '수', '목', '금', '토'].map(dow => {
                const isRestDow = dow === '일';
                return (
                  <View key={dow} style={[styles.weekCell, {width: cellSize}]}>
                    <AppText
                      allowFontScaling={false}
                      style={[styles.dayText, isRestDow && styles.sundayText]}>
                      {dow}
                    </AppText>
                  </View>
                );
              })}
            </View>

            <View style={styles.divider} />

            <Animated.View style={[{width: gridWidth}, gridClipStyle]}>
              {/* Month */}
              <Animated.View
                style={monthLayerStyle}
                pointerEvents={mode === 'month' ? 'auto' : 'none'}>
                <View
                  collapsable={false}
                  onLayout={onMonthLayout}
                  style={[
                    styles.dateGrid,
                    {width: gridWidth, columnGap: GAP, rowGap: GAP},
                  ]}>
                  {monthDates.map((item, idx) => {
                    const birthNames = birthdayMap?.[item.key];
                    const hasBirthday = !!birthNames?.length;

                    const baseCounts = normalizeCount(
                      scheduleCountPerDay[item.key],
                    );
                    const counts = mergeBirthdayIntoCounts(
                      baseCounts,
                      hasBirthday,
                    );

                    const total = counts.total;
                    const CIRCLE_SIZE = cellSize * 0.78;
                    const holiday = isHoliday(item.date);

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
                            {
                              width: CIRCLE_SIZE,
                              height: CIRCLE_SIZE,
                              borderRadius: CIRCLE_SIZE / 2,
                            },
                            !item.isSelected && getCountColorStyle(total),
                            item.isSelected && styles.selectedBox,
                            !item.isCurrentMonth && {opacity: 0.35},
                          ]}>
                          <AppText
                            allowFontScaling={false}
                            style={[
                              styles.dateText,
                              item.isSelected && styles.selectedText,
                              !item.isSelected && holiday && styles.holidayText,
                            ]}>
                            {item.date.getDate()}
                          </AppText>
                          {renderDots(counts)}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>

              {/* Week */}
              <Animated.View
                style={[styles.absoluteLayer, weekLayerStyle]}
                pointerEvents={mode === 'week' ? 'auto' : 'none'}>
                <View
                  collapsable={false}
                  onLayout={onWeekLayout}
                  style={[styles.weekGrid, {width: gridWidth, columnGap: GAP}]}>
                  {weekDates.map((item, idx) => {
                    const birthNames = birthdayMap?.[item.key];
                    const hasBirthday = !!birthNames?.length;

                    const baseCounts = normalizeCount(
                      scheduleCountPerDay[item.key],
                    );
                    const counts = mergeBirthdayIntoCounts(
                      baseCounts,
                      hasBirthday,
                    );

                    const total = counts.total;
                    const CIRCLE_SIZE = cellSize * 0.78;
                    const holiday = isHoliday(item.date);

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
                            {
                              width: CIRCLE_SIZE,
                              height: CIRCLE_SIZE,
                              borderRadius: CIRCLE_SIZE / 2,
                            },
                            !item.isSelected && getCountColorStyle(total),
                            item.isSelected && styles.selectedBox,
                          ]}>
                          <AppText
                            allowFontScaling={false}
                            style={[
                              styles.dateText,
                              item.isSelected && styles.selectedText,
                              !item.isSelected && holiday && styles.holidayText,
                            ]}>
                            {item.date.getDate()}
                          </AppText>
                          {renderDots(counts)}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </DropShadow>

      {Platform.OS === 'ios' && (
        <DatePicker
          modal
          open={showYMD}
          date={selectedDate instanceof Date && !isNaN(selectedDate) ? selectedDate : new Date()}
          mode="date"
          locale="ko"
          title="날짜 선택"
          confirmText="확인"
          cancelText="취소"
          onConfirm={date => {
            setSelectedDate(date);
            closeYMD();
          }}
          onCancel={closeYMD}
        />
      )}
    </View>
  );
}
