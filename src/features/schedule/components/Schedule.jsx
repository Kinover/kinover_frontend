// src/features/schedule/components/Schedule.jsx
/* eslint-disable react-native/no-inline-styles */
import React, {useMemo, useState, useCallback} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';

import {useScheduleListByDate} from '../hooks/useScheduleListByDate';
import {useFormattedScheduleDate} from '../hooks/useFormattedScheduleDate';
import {COLORS, DEFAULT_STYLE, EMPTY_STYLE} from 'styles/style';

import DropShadow from 'react-native-drop-shadow';
import BirthdayConfettiModal from './BirthdayConfettiModal';

const COLOR = {
  BLUE_BG: 'rgba(59, 130, 246, 0.14)',
  BLUE_PILL: 'rgba(59, 130, 246, 0.10)',
  BLUE_TEXT: '#1D4ED8',

  YELLOW_BG: 'rgba(255, 200, 77, 0.25)',
  YELLOW_PILL: 'rgba(255, 200, 77, 0.18)',
  YELLOW_TEXT: '#8A5A00',

  GRAY_BG: 'rgba(17, 24, 39, 0.08)',
  GRAY_PILL: 'rgba(17, 24, 39, 0.05)',
  GRAY_TEXT: '#374151',
};

const TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  FAMILY: 'FAMILY',
  ANNIVERSARY: 'ANNIVERSARY',
};

function Schedule({
  selectedDate,
  onOpenSheet,
  refreshTrigger,
  birthdayNames = [],
}) {
  const hookResult = useScheduleListByDate(selectedDate, refreshTrigger) || {};
  const individual = hookResult.individual ?? hookResult.personal ?? [];
  const family = hookResult.family ?? hookResult.shared ?? [];
  const anniversary = hookResult.anniversary ?? [];
  const scheduleList = hookResult.scheduleList ?? [];

  const formattedDate = useFormattedScheduleDate(selectedDate);

  const hasBirthday = Array.isArray(birthdayNames) && birthdayNames.length > 0;

  const displayNames =
    birthdayNames.length > 2
      ? `${birthdayNames.slice(0, 2).join(', ')} 외 ${
          birthdayNames.length - 2
        }명`
      : birthdayNames.join(', ');

  const [birthdayModalVisible, setBirthdayModalVisible] = useState(false);

  const openBirthdayModal = useCallback(() => {
    if (!hasBirthday) return;
    setBirthdayModalVisible(true);
  }, [hasBirthday]);

  const closeBirthdayModal = useCallback(() => {
    setBirthdayModalVisible(false);
  }, []);

  const namesText = useMemo(() => {
    if (!hasBirthday) return '';
    return `${displayNames} 🎉`;
  }, [hasBirthday, displayNames]);

  const getCardPreset = item => {
    const raw =
      item?.type ??
      item?.scheduleType ??
      item?.kind ??
      item?.category ??
      item?.eventType ??
      null;

    const t = String(raw || '').toUpperCase();

    const isAnniv =
      item?.isAnniversary === true ||
      t === TYPE.ANNIVERSARY ||
      t.includes('ANNIV') ||
      t.includes('ANNIVERSARY') ||
      String(raw || '')
        .toLowerCase()
        .includes('기념');

    const isFamily =
      !isAnniv &&
      (t === TYPE.FAMILY ||
        t.includes('FAMILY') ||
        item?.isShared === true ||
        item?.shared === true ||
        String(raw || '')
          .toLowerCase()
          .includes('공동'));

    if (isAnniv) {
      return {
        type: TYPE.ANNIVERSARY,
        pillText: '기념일',
        icon: '🎈',
        iconBg: COLOR.YELLOW_BG,
        pillBg: COLOR.YELLOW_PILL,
        pillTextColor: COLOR.YELLOW_TEXT,
      };
    }

    if (isFamily) {
      return {
        type: TYPE.FAMILY,
        pillText: '가족 일정',
        icon: '🤝',
        iconBg: COLOR.BLUE_BG,
        pillBg: COLOR.BLUE_PILL,
        pillTextColor: COLOR.BLUE_TEXT,
      };
    }

    return {
      type: TYPE.INDIVIDUAL,
      pillText: '개별 일정',
      icon: String(item?.userName || '가족').slice(0, 1),
      iconBg: COLOR.GRAY_BG,
      pillBg: COLOR.GRAY_PILL,
      pillTextColor: COLOR.GRAY_TEXT,
    };
  };

  const getMemberLabel = useCallback(item => {
    const names = Array.isArray(item?.participantNames)
      ? item.participantNames.filter(Boolean)
      : [];

    if (names.length === 1) return names[0];
    if (names.length > 1) return `${names[0]} 외 ${names.length - 1}명`;

    return item?.userName || '가족';
  }, []);

  const mergedForRender = useMemo(() => {
    const a = Array.isArray(anniversary) ? anniversary : [];
    const f = Array.isArray(family) ? family : [];
    const i = Array.isArray(individual) ? individual : [];
    return [...a, ...f, ...i];
  }, [anniversary, family, individual]);

  return (
    <View style={styles.container}>
      <Text allowFontScaling={false} style={styles.dateText}>
        {formattedDate}
      </Text>

      {hasBirthday && (
        <DropShadow style={[styles.cardShadowBox, styles.roundPillShadow]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openBirthdayModal}
            style={[styles.cardWrap, styles.roundPillWrap]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    {backgroundColor: COLOR.YELLOW_BG},
                  ]}>
                  <Text allowFontScaling={false} style={styles.iconText}>
                    🎂
                  </Text>
                </View>

                <View style={styles.texts}>
                  <Text allowFontScaling={false} style={styles.subtitle}>
                    오늘
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={styles.title}
                    numberOfLines={1}>
                    {displayNames}님의 생일이에요
                  </Text>
                </View>
              </View>

              <View style={[styles.pill, {backgroundColor: COLOR.YELLOW_PILL}]}>
                <Text allowFontScaling={false} style={[styles.pillText, {color: COLOR.YELLOW_TEXT}]}>
                  기념일
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </DropShadow>
      )}

      <BirthdayConfettiModal
        visible={birthdayModalVisible}
        onClose={closeBirthdayModal}
        title="생일 축하해요! 🎂"
        subText="오늘은 축하를 듬뿍 받아야 하는 날이에요"
        namesText={namesText}
      />

      <View style={styles.timelineWrapper}>
        <View style={styles.scheduleCards}>
          {mergedForRender.map(item => {
            const preset = getCardPreset(item);

            const ownerLabel =
              preset.type === TYPE.ANNIVERSARY ? '가족' : getMemberLabel(item);

            return (
              <DropShadow
                key={
                  item.scheduleId ??
                  `${preset.type}-${ownerLabel}-${item.title}`
                }
                style={[styles.cardShadowBox, styles.roundPillShadow]}>
                <TouchableOpacity
                  onPress={() => onOpenSheet(item)}
                  activeOpacity={0.9}
                  style={[styles.cardWrap, styles.roundPillWrap]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardLeft}>
                      <View
                        style={[
                          styles.iconCircle,
                          {backgroundColor: preset.iconBg},
                        ]}>
                        <Text
                          allowFontScaling={false}
                          style={styles.iconText}
                          numberOfLines={1}>
                          {preset.icon}
                        </Text>
                      </View>

                      <View style={styles.texts}>
                        <Text
                          allowFontScaling={false}
                          style={styles.subtitle}
                          numberOfLines={1}>
                          {ownerLabel}
                        </Text>
                        <Text
                          allowFontScaling={false}
                          style={styles.title}
                          numberOfLines={1}>
                          {item.title || '제목 없음'}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[styles.pill, {backgroundColor: preset.pillBg}]}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.pillText,
                          {color: preset.pillTextColor},
                        ]}>
                        {preset.pillText}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </DropShadow>
            );
          })}

          {(Array.isArray(scheduleList) ? scheduleList.length : 0) === 0 ? (
            <Text allowFontScaling={false} style={styles.emptyText}>
              {'일정이 비어 있어요.\n새로운 일정을 추가해볼까요?'}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default React.memo(Schedule);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(0),
    paddingBottom: getResponsiveHeight(200),
  },
  dateText: {
    color: COLORS.textPrimary,
    fontSize: DEFAULT_STYLE().sectionTitle.fontSize - 1.5,
    fontFamily: DEFAULT_STYLE().sectionTitle.fontFamily,
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(16),
    alignSelf: 'flex-start',
  },
  timelineWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scheduleCards: {
    flex: 1,
    width: '100%',
  },
  cardShadowBox: {
    width: '100%',
    borderRadius: 0,
    backgroundColor: 'transparent',
    marginBottom: getResponsiveHeight(10),
  },
  roundPillShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardWrap: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    // borderWidth: 1,
    // borderColor: 'rgba(17,24,39,0.08)',
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(14),
    overflow: 'hidden',
  },
  roundPillWrap: {
    minHeight: getResponsiveHeight(58),
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: getResponsiveWidth(36),
    height: getResponsiveWidth(36),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: getResponsiveFontSize(16),
    lineHeight: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  texts: {
    flexDirection: 'column',
    gap: getResponsiveHeight(2),
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
    color: '#6B7280',
  },
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14.5),
    color: '#111827',
  },
  pill: {
    paddingVertical: getResponsiveHeight(5),
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.05)',
    flexShrink: 0,
  },
  pillText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(10),
    color: '#111827',
    letterSpacing: 0.4,
  },
  emptyText: {
    marginTop: getResponsiveHeight(60),
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
    alignSelf: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
