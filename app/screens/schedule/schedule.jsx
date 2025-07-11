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
              onPress={() => onOpenSheet(schedule)}>
              <View style={styles.card}>
                <View
                  style={{
                    position: 'absolute',
                    backgroundColor: '#FFC84D',
                    top: '0%',
                    left: 0,
                    width: 9,
                    height: '180%',
                    borderTopLeftRadius: 50,
                    borderBottomLeftRadius: 50,
                  }}></View>
                <Text style={styles.cardTitle}>
                  {schedule.userName || '가족'}
                </Text>
                <Text style={styles.cardMemo}>
                  {schedule.title || '제목 없음'}
                </Text>
              </View>
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
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: 'gray',
    shadowRadius: 1,
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 1},
    borderColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(15),
    paddingHorizontal: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(15),
    position: 'relative',
    minHeight: getResponsiveHeight(68),
  },
  cardTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: 2,
  },
  cardMemo: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
    color: '#6E6E6E',
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
  addCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFC84D',
    borderStyle: 'dashed',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    minHeight: getResponsiveHeight(78),
    flexDirection: 'row',
    paddingHorizontal: getResponsiveWidth(20),
    gap: 10,
  },
  addCardText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Light',
  },
  plus: {
    color: '#FFC84D',
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    resizeMode: 'contain',
  },

  userTab: {
    alignItems: 'center',
    marginRight: 10,
    padding: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  userTabSelected: {
    borderColor: '#FFC84D',
    backgroundColor: '#FFF6E1',
  },
  userTabImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 5,
  },
  userTabText: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
  },
});
