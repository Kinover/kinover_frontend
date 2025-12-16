/* eslint-disable react-native/no-inline-styles */
// Schedule.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';

import {useScheduleListByDate} from '../hooks/useScheduleListByDate';
import {useFormattedScheduleDate} from '../hooks/useFormattedScheduleDate';
import {EMPTY_STYLE} from 'styles/style';

function Schedule({
  selectedDate,
  onOpenSheet,
  refreshTrigger,
  birthdayNames = [],
}) {
  const {scheduleList} = useScheduleListByDate(selectedDate, refreshTrigger);
  const formattedDate = useFormattedScheduleDate(selectedDate);

  const hasBirthday = Array.isArray(birthdayNames) && birthdayNames.length > 0;

  // 이름이 길면 깔끔하게 줄이기
  const displayNames =
    birthdayNames.length > 2
      ? `${birthdayNames.slice(0, 2).join(', ')} 외 ${
          birthdayNames.length - 2
        }명`
      : birthdayNames.join(', ');

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{formattedDate}</Text>

      {/* ✅ 생일 배너 (미니멀 + 고급 버전) */}
      {hasBirthday && (
        <View style={styles.birthdayWrap}>
          <View style={styles.birthdayHeaderRow}>
            <View style={styles.birthdayLeft}>
              <View style={styles.birthdayIconCircle}>
                <Text style={styles.birthdayIconText}>🎂</Text>
              </View>
              <View style={styles.birthdayTexts}>
                <Text style={styles.birthdaySubtitle}>오늘</Text>
                <Text style={styles.birthdayTitle} numberOfLines={1}>
                  {displayNames}님의 생일이에요
                </Text>
              </View>
            </View>
            <View style={styles.birthdayPill}>
              <Text style={styles.birthdayPillText}>HBD</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.timelineWrapper}>
        <View style={styles.scheduleCards}>
          {scheduleList.map(schedule => (
            <TouchableOpacity
              key={schedule.scheduleId}
              onPress={() => onOpenSheet(schedule)}
              style={styles.card}>
              <Image
                style={styles.cardBg}
                source={require('../../../assets/images/schedule.png')}
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  {schedule.userName || '가족'}
                </Text>
                <Text style={styles.cardMemo}>
                  {schedule.title || '제목 없음'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {scheduleList.length === 0 ? (
            <Text style={styles.emptyText}>
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
    paddingBottom: getResponsiveHeight(150),
  },

  dateText: {
    color: 'black',
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(16),
    alignSelf: 'flex-start',
    fontWeight: Platform.OS === 'ios' ? undefined : 'bold',
  },

  /* =========================
   * ✅ Birthday Banner (V2)
   * ========================= */
  birthdayWrap: {
    width: '100%',
    borderRadius: getResponsiveHeight(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(14),
    marginBottom: getResponsiveHeight(12),

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 8},
    elevation: 2,
  },

  birthdayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  birthdayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },

  birthdayIconCircle: {
    width: getResponsiveWidth(36),
    height: getResponsiveWidth(36),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 200, 77, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  birthdayIconText: {
    fontSize: getResponsiveFontSize(16),
    lineHeight: getResponsiveFontSize(18),
  },

  birthdayTexts: {
    flexDirection: 'column',
    gap: getResponsiveHeight(2),
  },

  birthdaySubtitle: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
    color: '#6B7280',
  },

  birthdayTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14.5),
    color: '#111827',
  },

  birthdayPill: {
    paddingVertical: getResponsiveHeight(5),
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.05)',
  },

  birthdayPillText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(11.5),
    color: '#111827',
    letterSpacing: 0.4,
  },

  birthdayDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(17,24,39,0.06)',
    marginTop: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(10),
  },

  birthdayNamesLine: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14),
    color: '#111827',
    lineHeight: getResponsiveFontSize(18),
  },

  /* =========================
   * Original Schedule styles
   * ========================= */
  timelineWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  scheduleCards: {
    flex: 1,
    width: '100%',
    gap: getResponsiveHeight(10),
  },

  card: {
    position: 'relative',
    width: '100%',
    height: getResponsiveHeight(70),
    overflow: 'hidden',
    borderRadius: getResponsiveHeight(12),
  },

  cardBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
  },

  cardContent: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(16),
    paddingTop: getResponsiveHeight(11),
  },

  cardTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(13.5)
        : getResponsiveFontSize(14.5),
    fontWeight: Platform.OS === 'android' ? '500' : undefined,
    marginBottom: getResponsiveHeight(2),
  },

  cardMemo: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(12.5)
        : getResponsiveFontSize(13),
    fontWeight: Platform.OS === 'android' ? '500' : undefined,
    color: '#6E6E6E',
    paddingTop: getResponsiveHeight(2),
  },

  memoIcon: {
    position: 'absolute',
    right: getResponsiveWidth(20),
    bottom: getResponsiveHeight(27.5),
  },

  icon: {
    width: 20,
    height: 20,
  },

  plus: {
    color: '#FFC84D',
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    resizeMode: 'contain',
  },

  emptyText: {
    marginTop: getResponsiveHeight(60),
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontFamily: EMPTY_STYLE.emptyFontFamily,
    color: EMPTY_STYLE.emptyColor,
    alignSelf: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
