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

function Schedule({selectedDate, onOpenSheet, refreshTrigger}) {
  const {scheduleList} = useScheduleListByDate(selectedDate, refreshTrigger);
  const formattedDate = useFormattedScheduleDate(selectedDate);

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{formattedDate}</Text>
      <View style={styles.timelineWrapper}>
        <View style={styles.scheduleCards}>
          {scheduleList.map(schedule => (
            <TouchableOpacity
              key={schedule.scheduleId}
              onPress={() => onOpenSheet(schedule)}
              style={{
                position: 'relative',
                width: '100%',
                height: getResponsiveHeight(70),
              }}>
              <Image
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 0,
                  resizeMode: 'cover',
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                }}
                source={require('../../../assets/images/schedule.png')}
              />
              <View>
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
            <Text
              style={{
                marginTop: getResponsiveHeight(60),
                color: '#C0C0C0',
                alignSelf: 'center',
                textAlign: 'center',
                textAlignVertical: 'center',
                fontSize: getResponsiveFontSize(13),
              }}>
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
    paddingHorizontal: getResponsiveWidth(10),
    paddingBottom: getResponsiveHeight(30),
  },
  dateText: {
    color: 'black',
    fontSize: getResponsiveFontSize(15), // 🔽 17 → 15
    fontFamily: 'Pretendard-SemiBold',
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(16),
    alignSelf: 'flex-start',
    fontWeight: Platform.OS === 'ios' ? undefined : 'bold',
  },
  timelineWrapper: {
    position: 'relative',
    flexDirection: 'row',
    height: '100%',
    alignItems: 'flex-start',
  },
  scheduleCards: {
    flex: 1,
    gap: getResponsiveHeight(10),
  },
  cardTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(13.5) // 🔽 살짝 줄임
        : getResponsiveFontSize(14.5),
    fontWeight: Platform.OS === 'android' ? '500' : undefined,
    marginBottom: Platform.OS === 'android' ? 0 : 2,
    paddingTop:
      Platform.OS === 'android'
        ? getResponsiveHeight(11)
        : getResponsiveHeight(12),
    paddingHorizontal:
      Platform.OS === 'ios' ? getResponsiveWidth(15) : getResponsiveWidth(20),
  },
  cardMemo: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(12.5) // 🔽 13 → 12.5 정도로
        : getResponsiveFontSize(13),
    fontWeight: Platform.OS === 'android' ? '500' : undefined,
    color: '#6E6E6E',
    paddingHorizontal:
      Platform.OS === 'ios' ? getResponsiveWidth(15) : getResponsiveWidth(20),
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
});
