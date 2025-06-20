import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {
  fetchSchedulesForFamilyAndDateThunk,
  addScheduleThunk,
  updateScheduleThunk,
  deleteScheduleThunk,
} from '../../redux/thunk/scheduleThunk';
import CustomModal from '../../components/customModal';

export default function Schedule({selectedDate}) {
  const dispatch = useDispatch();
  const {familyId} = useSelector(state => state.family);
  const {scheduleList} = useSelector(state => state.schedule);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');

  const formattedDate = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
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

  const onAddSchedule = () => {
    setEditingSchedule(null);
    setTitle('');
    setMemo('');
    setModalVisible(true);
  };

  const onEditSchedule = schedule => {
    setEditingSchedule(schedule);
    setTitle(schedule.title);
    setMemo(schedule.memo || '');
    setModalVisible(true);
  };

  const onSubmit = async () => {
    const payload = {
      title,
      memo,
      date: formattedDate,
      personal: false,
      userId: null,
      familyId,
    };

    if (editingSchedule) {
      payload.scheduleId = editingSchedule.scheduleId;
      await dispatch(updateScheduleThunk(payload));
    } else {
      await dispatch(addScheduleThunk(payload));
    }

    setModalVisible(false);
    setTitle('');
    setMemo('');
  };

  const handleDeleteSchedule = async () => {
    if (editingSchedule?.scheduleId) {
      await dispatch(deleteScheduleThunk(editingSchedule.scheduleId));
      setModalVisible(false);
      setTitle('');
      setMemo('');
      setEditingSchedule(null);
    }
  };

  return (
    <View contentContainerStyle={styles.container}>
      <Text style={styles.dateText}>{getFormattedDate()}</Text>

      {/* 일정 카드 영역 */}
      <View style={styles.timelineWrapper}>
        <View style={styles.scheduleCards}>
          {scheduleList.map(schedule => (
            <View key={schedule.scheduleId} style={styles.card}>
              <Text style={styles.cardTitle}>
                {schedule.userName || '가족'}
              </Text>
              <Text style={styles.cardMemo}>
                {schedule.title || '@@메모 없음'}
              </Text>
              <TouchableOpacity
                style={styles.memoIcon}
                onPress={() => onEditSchedule(schedule)}>
                <Image
                  style={styles.icon}
                  source={require('../../assets/images/schedule-pencil.png')}
                />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addCard} onPress={onAddSchedule}>
            <Text style={styles.addCardText}>일정을 추가하세요</Text>
            <Image
              style={styles.plus}
              source={require('../../assets/images/plusCircle2.png')}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 일정 추가/수정 모달 */}
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={onSubmit}
        confirmText="저장"
        closeText="취소"
        modalBoxStyle={{width: getResponsiveWidth(320), padding: 20}}
        contentStyle={{gap: 10}}
        buttonBottomStyle={{
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'space-between',
        }}
        confirmButtonStyle={{flex: 1}}
        closeButtonStyle={{flex: 1}}
        confirmTextStyle={{
          color: 'black',
          fontFamily: 'Pretendard-Regular',
          textAlign: 'center',
        }}
        closeTextStyle={{
          color: '#333',
          fontFamily: 'Pretendard-Regular',
          textAlign: 'center',
        }}
        showTrashButton={true}
        onTrashPress={handleDeleteSchedule}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="제목을 입력하세요"
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            padding: 10,
            marginTop: getResponsiveHeight(15),
            fontFamily: 'Pretendard-Regular',
          }}
        />
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="메모를 입력하세요"
          multiline
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            padding: 10,
            height: 80,
            fontFamily: 'Pretendard-Regular',
          }}
        />
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(80),
  },
  dateText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(20),
    alignSelf: 'flex-start',
    fontWeight: Platform.OS == 'ios' ? null : 'bold',
  },
  tabWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(15),
  },
  fixedUser: {
    marginRight: getResponsiveWidth(15),
  },
  scrollTabRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
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
    fontFamily: 'Pretendard-Medium',
    fontWeight: Platform.OS == 'ios' ? null : '700',
  },
  timelineWrapper: {
    position: 'relative',
    flexDirection: 'row',
    height: '100%',
    alignItems: 'flex-start',
  },
  verticalLine1: {
    position: 'absolute',
    top: -15,
    width: 1.2,
    height: '100%',
    backgroundColor: '#FFC84D',
    marginLeft: getResponsiveWidth(27),
    marginRight: getResponsiveWidth(20),
  },

  verticalLine: {
    width: 1.2,
    height: '100%',
    backgroundColor: '#FFC84D',
    marginLeft: getResponsiveWidth(27),
    marginRight: getResponsiveWidth(20),
  },

  scheduleCards: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(15),
    position: 'relative',
    minHeight: getResponsiveHeight(78),
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontFamily: 'Pretendard-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  cancel: {
    fontFamily: 'Pretendard-Regular',
    color: '#888',
  },
  confirm: {
    fontFamily: 'Pretendard-Bold',
    color: '#FFC84D',
  },
});
