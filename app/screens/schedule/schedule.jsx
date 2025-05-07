import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../utils/responsive';
import {fetchSchedulesForFamilyAndDateThunk} from '../../redux/thunk/scheduleThunk';

export default function Schedule({selectedDate}) {
  const dispatch = useDispatch();
  const {familyId} = useSelector(state => state.family);
  const {scheduleList} = useSelector(state => state.schedule);
  const {familyUserList} = useSelector(state => state.userFamily);
  const currentUserId = useSelector(state => state.user.userId);
  const filteredSchedules =
    selectedUserId === 'family'
      ? scheduleList.filter(item => item.userId === null)
      : scheduleList.filter(item => item.userId === selectedUserId);
  const dummySchedule = {
    scheduleId: 'dummy-schedule-1',
    title: '할머니 생신',
    memo: '@@고깃집 몇 시까지 오세요~',
    userId: null,
  };
  const fullScheduleList = [...filteredSchedules, dummySchedule];

  const [selectedUserId, setSelectedUserId] = useState('family');

  useEffect(() => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    dispatch(fetchSchedulesForFamilyAndDateThunk(familyId, formattedDate));
  }, [dispatch, familyId, selectedDate]);

  const getFormattedDate = () => {
    const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = dayMap[selectedDate.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  };

  const reorderedTabs = [
    selectedUserId === 'family'
      ? {userId: 'family', name: '가족'}
      : familyUserList.find(user => user.userId === selectedUserId),
    ...['family', ...familyUserList.map(u => u.userId)]
      .filter(id => id !== selectedUserId)
      .map(id =>
        id === 'family'
          ? {userId: 'family', name: '가족'}
          : familyUserList.find(u => u.userId === id),
      ),
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.dateText}>{getFormattedDate()}</Text>

      {/* 구성원 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}>
        {reorderedTabs.map(user => (
          <TouchableOpacity
            key={user.userId}
            style={[
              styles.tab,
              selectedUserId === user.userId && styles.tabSelected,
            ]}
            onPress={() => setSelectedUserId(user.userId)}>
            <Text style={styles.tabText}>{user.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View>
        {/* 일정 카드 */}
        <View style={styles.contentColumn}>
          {fullScheduleList.map(schedule => (
            <View key={schedule.scheduleId} style={styles.card}>
              <Text style={styles.cardTitle}>{schedule.title}</Text>
              <Text style={styles.cardMemo}>
                {schedule.memo || '@@고깃집 몇 시까지 오세요~'}
              </Text>
              <TouchableOpacity style={styles.memoIcon}>
                <Image
                  style={styles.icon}
                  source={require('../../assets/images/schedule-pencil.png')}
                />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addCard}>
            <Text style={styles.addCardText}>일정을 추가하세요</Text>
            <Text style={styles.plus}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: getResponsiveHeight(50),
    paddingHorizontal: getResponsiveWidth(10),
  },
  dateText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    marginVertical: getResponsiveHeight(20),
    alignSelf: 'flex-start',
  },
  tabRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    marginBottom: getResponsiveHeight(20),
  },
  tab: {
    width: getResponsiveWidth(55),
    height: getResponsiveWidth(55),
    borderRadius: 999,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSelected: {
    backgroundColor: '#FFF6E1',
    borderWidth: 1,
    borderColor: '#FFC84D',
  },
  tabText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
  },
  contentColumn: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFC84D',
    padding: getResponsiveHeight(15),
    paddingHorizontal: getResponsiveHeight(20),

    marginBottom: getResponsiveHeight(15),
    position: 'relative',
    minHeight: getResponsiveHeight(80),
  },
  cardTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    marginBottom: 4,
  },
  cardMemo: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Regular',
    color: '#6E6E6E',
  },
  memoIcon: {
    position: 'absolute',
    right: 15,
    bottom: 30,
  },
  icon: {
    width: 20,
    height: 20,
  },
  addCard: {
    borderRadius: 20,
    borderWidth: 1.8,
    borderColor: '#FFC84D',
    borderStyle: 'dashed',
    justifyContent:'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    height: getResponsiveHeight(80),
    flexDirection: 'row',
    paddingHorizontal:getResponsiveWidth(20),
    gap: 10,
  },
  addCardText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
  },
  plus: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    color: '#FFC84D',
  },
});
