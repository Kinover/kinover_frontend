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

import DropShadow from 'react-native-drop-shadow';

function Schedule({
  selectedDate,
  onOpenSheet,
  refreshTrigger,
  birthdayNames = [],
}) {
  const {scheduleList} = useScheduleListByDate(selectedDate, refreshTrigger);
  const formattedDate = useFormattedScheduleDate(selectedDate);

  const hasBirthday = Array.isArray(birthdayNames) && birthdayNames.length > 0;

  const displayNames =
    birthdayNames.length > 2
      ? `${birthdayNames.slice(0, 2).join(', ')} 외 ${
          birthdayNames.length - 2
        }명`
      : birthdayNames.join(', ');

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{formattedDate}</Text>

      {/* ✅ 생일 배너 */}
      {hasBirthday && (
        <DropShadow
          style={[
            styles.cardShadowBox, // ✅ 스케줄 카드랑 동일 스타일
            styles.roundPillShadow,
          ]}>
          <View style={[styles.cardWrap, styles.roundPillWrap]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardLeft}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>🎂</Text>
                </View>

                <View style={styles.texts}>
                  <Text style={styles.subtitle}>오늘</Text>
                  <Text style={styles.title} numberOfLines={1}>
                    {displayNames}님의 생일이에요
                  </Text>
                </View>
              </View>

              <View style={styles.pill}>
                <Text style={styles.pillText}>HBD</Text>
              </View>
            </View>
          </View>
        </DropShadow>
      )}

      <View style={styles.timelineWrapper}>
        <View style={styles.scheduleCards}>
          {scheduleList.map(schedule => (
            <DropShadow
              key={schedule.scheduleId}
              style={[styles.cardShadowBox, styles.roundPillShadow]}>
              <TouchableOpacity
                onPress={() => onOpenSheet(schedule)}
                activeOpacity={0.9}
                style={[styles.cardWrap, styles.roundPillWrap]}>
                {/* ✅ 배경 이미지(텍스처) */}
                {/* <Image
                  style={styles.cardBg}
                  source={require('../../../assets/images/schedule1.png')}
                /> */}

                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardLeft}>
                    {/* ✅ 생일 카드처럼 왼쪽 동그라미(아이콘 대신 첫 글자) */}
                    <View style={styles.iconCircle}>
                      <Text style={styles.initialText} numberOfLines={1}>
                        {String(schedule.userName || '가족').slice(0, 1)}
                      </Text>
                    </View>

                    <View style={styles.texts}>
                      <Text style={styles.subtitle} numberOfLines={1}>
                        {schedule.userName || '가족'}
                      </Text>
                      <Text style={styles.title} numberOfLines={1}>
                        {schedule.title || '제목 없음'}
                      </Text>
                    </View>
                  </View>

                  {/* ✅ 우측 칩(상태/고정 포인트) */}
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>일정</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </DropShadow>
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
    paddingBottom: getResponsiveHeight(200),
  },
  dateText: {
    color: 'black',
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-SemiBold',
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(16),
    alignSelf: 'flex-start',
    fontWeight: Platform.OS === 'ios' ? undefined : 'bold',
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

  /* =========================
   * ✅ 공통: 생일/스케줄 "완전 동일" 카드 스타일
   * ========================= */
  cardShadowBox: {
    width: '100%',
    borderRadius: 0,
    backgroundColor: 'transparent',
    marginBottom: getResponsiveHeight(10),
  },

  roundPillShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },

  cardWrap: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(14),
    overflow: 'hidden', // ✅ 배경 이미지 잘리게
  },

  roundPillWrap: {
    minHeight: getResponsiveHeight(58),
    justifyContent: 'center',
  },

  cardBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'stretch',
    opacity: 0.35, // ✅ 텍스트 안 먹게 은은하게
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
    backgroundColor: 'rgba(255, 200, 77, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: getResponsiveFontSize(16),
    lineHeight: getResponsiveFontSize(18),
  },

  initialText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
    color: '#111827',
    letterSpacing: -0.2,
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
    fontSize: getResponsiveFontSize(11.5),
    color: '#111827',
    letterSpacing: 0.4,
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

  plus: {
    color: '#FFC84D',
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    resizeMode: 'contain',
  },
});
