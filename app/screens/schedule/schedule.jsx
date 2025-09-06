// Schedule.jsx
import React, {useEffect, useMemo} from 'react';
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

  // ✅ 로컬 타임존 기준 YYYY-MM-DD (UTC 섞임 방지)
  const formatLocalYMD = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 의존성 깔끔화를 위해 selectedDate를 로컬 YMD로 메모
  const selectedYMD = useMemo(
    () => formatLocalYMD(selectedDate),
    [selectedDate],
  );

  useEffect(() => {
    if (!familyId || !selectedYMD) return;
    // thunk 시그니처: (familyId, date)
    dispatch(fetchSchedulesForFamilyAndDateThunk(familyId, selectedYMD));
  }, [dispatch, familyId, selectedYMD, refreshTrigger]);

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
                  resizeMode: 'cover',
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                }}
                source={require('../../assets/images/schedule.png')}
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
                // color: 'gray',
                color: '#C0C0C0',
                alignSelf: 'center',
                textAlign:'center',
                textAlignVertical:'center',
              }}>
              {"일정이 비어 있어요.\n새로운 일정을 추가해볼까요?"}
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
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-SemiBold',
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(20),
    alignSelf: 'flex-start',
    // iOS/Android 모두 자연스럽게 보이도록 폰트패밀리 위주로 사용
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
        ? getResponsiveFontSize(14)
        : getResponsiveFontSize(15.5),
    fontWeight: Platform.OS === 'android' ? '500' : undefined,
    marginBottom: Platform.OS === 'android' ? 0 : 3,
    paddingTop:
      Platform.OS === 'android'
        ? getResponsiveHeight(11)
        : getResponsiveHeight(13),
    paddingHorizontal:
      Platform.OS === 'ios' ? getResponsiveWidth(15) : getResponsiveWidth(20),
  },
  cardMemo: {
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(13)
        : getResponsiveFontSize(13.5),
    fontWeight: Platform.OS === 'android' ? '500' : undefined,
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
