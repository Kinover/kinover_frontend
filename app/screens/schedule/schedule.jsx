import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';

import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {fetchSchedulesForFamilyAndDateThunk} from '../../redux/thunk/scheduleThunk';

function Schedule({selectedDate, onOpenSheet, refreshTrigger}) {
  const dispatch = useDispatch();
  const {familyId} = useSelector(state => state.family);
  const {scheduleList} = useSelector(state => state.schedule);

  useEffect(() => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    dispatch(fetchSchedulesForFamilyAndDateThunk(familyId, formattedDate));
  }, [dispatch, familyId, selectedDate, refreshTrigger]); // ✅ refreshTrigger 추가

  const getFormattedDate = () => {
    const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = dayMap[selectedDate.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{getFormattedDate()}</Text>
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
                  resizeMode: 'contain',
                  width: '100%',
                  height: '100%',
                }}
                source={require('../../assets/images/schedule.png')}
              />
              <Text style={styles.cardTitle}>
                {schedule.userName || '가족'}
              </Text>
              <Text style={styles.cardMemo}>
                {schedule.title || '제목 없음'}
              </Text>
            </TouchableOpacity>
          ))}
          {scheduleList.length == 0 ? (
            <Text
              style={{
                marginTop: getResponsiveHeight(60),
                color: 'gray',
                alignSelf: 'center',
              }}>
              일정이 없습니다.
            </Text>
          ) : (
            <></>
          )}
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
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(20),
    alignSelf: 'flex-start',
    fontWeight: Platform.OS === 'ios' ? null : 'bold',
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
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 2,
    paddingTop: getResponsiveHeight(12),
    paddingHorizontal:
      Platform.OS === 'ios' ? getResponsiveWidth(15) : getResponsiveWidth(20),
  },
  cardMemo: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
    color: '#6E6E6E',
    paddingHorizontal:
      Platform.OS === 'ios' ? getResponsiveWidth(15) : getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(2.5),
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
