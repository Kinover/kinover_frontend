import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../utils/responsive';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchSchedulesForFamilyAndDate,
  fetchSchedulesForUserAndDate,
} from '../../redux/actions/scheduleActions';

export default function Schedule({selectedDate}) {
  const {familyId, name} = useSelector(state => state.family);
  const {scheduleList, loading, error} = useSelector(state => state.schedule);
  const {familyUserList} = useSelector(state => state.userFamily);
  const currentUserId = useSelector(state => state.user.userId);
  const dispatch = useDispatch();

  // 모달 상태 관리
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState('');
  const [editable, setEditable] = useState(false);

  // 메모 버튼 클릭 시 실행될 함수
  const handleMemoClick = (memo, userId) => {
    setSelectedMemo(memo);
    setEditable(userId === currentUserId); // 내가 작성한 메모인지 확인
    setModalVisible(true);
  };

  useEffect(() => {
    // familyUserList에 있는 각 사용자에 대해 일정을 fetch
    familyUserList.forEach(user => {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // '2025-03-12' 형식으로 변환
      console.log(
        `📢 Fetching schedules for user: ${user.userName}, date: ${formattedDate}`,
      );
      //   dispatch(fetchSchedulesForUserAndDate(familyId, user.userId, formattedDate));
      dispatch(fetchSchedulesForFamilyAndDate(familyId, formattedDate));
    });
  }, [dispatch, familyId, selectedDate, familyUserList]);

  // 일정 불러오는 중일 때 처리
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC84D" />
          <Text style={styles.loadingText}>일정을 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 각 가족 구성원에 대한 일정 표시 */}
      {familyUserList.map(user => {
        const userSchedules = scheduleList.filter(
          schedule =>
            schedule.userId === user.userId ||schedule.isPersonal===false,
        );

        return (
          <View key={user.userId} style={styles.scheduleContainer}>
            {/* 일정이 있을 경우에만 해당 사용자 이름과 일정 개수 표시 */}
            {userSchedules.length > 0 && (
              <Text style={styles.scheduleTitle}>
                <Text style={styles.scheduleTitleHighlight}>
                  {user ? user.name : name}{' '}
                </Text>
                {`님의 일정은 `}
                <Text style={styles.scheduleTitleHighlight}>
                  {`${userSchedules.length}`}
                </Text>
                개 있어요.
              </Text>
            )}

            {userSchedules.length > 0
              ? userSchedules.map(schedule => (
                  <View
                    key={schedule.scheduleId}
                    style={styles.scheduleElement}>
                    <Text
                      style={[
                        styles.scheduleText,
                        {width: getResponsiveWidth(260)},
                      ]}>
                      {schedule.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleMemoClick(schedule.memo, schedule.userId)
                      }
                      style={styles.scheduleButton}>
                      <Image
                        style={styles.buttonIconMemo}
                        source={{
                          uri: 'https://i.postimg.cc/TYsZknFG/Group-485.png',
                        }}
                      />
                      <Text style={styles.buttonText}>메모</Text>
                    </TouchableOpacity>
                  </View>
                ))
              : null}

            {/* 일정 추가 버튼 */}
            {userSchedules.length > 0 && user.userId === currentUserId && (
              <View style={styles.scheduleElement}>
                <TouchableOpacity style={{width: getResponsiveWidth(260)}}>
                  <Text style={styles.scheduleAddText}>
                    + 일정을 추가하세요
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => alert('Button Pressed')}
                  style={[styles.scheduleButton, {backgroundColor: '#D9D9D9'}]}>
                  <Image
                    style={styles.buttonIconMemo}
                    source={{
                      uri: 'https://i.postimg.cc/TYsZknFG/Group-485.png',
                    }}
                  />
                  <Text style={styles.buttonText}>메모</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      {/* 전체 가족이 일정을 갖고 있지 않은 경우에만 표시 */}
      {familyUserList.every(
        user =>
          scheduleList.filter(schedule => schedule.userId === user.userId)
            .length === 0,
      ) && <Text style={styles.noScheduleText}>일정이 없습니다.</Text>}

      {/* 메모 모달 */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>메모</Text>
            <TextInput
              style={styles.memoInput}
              multiline
              editable={editable} // 내가 작성한 메모일 경우만 수정 가능
              value={selectedMemo}
              onChangeText={setSelectedMemo}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(40),
  },

  scheduleTitle: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
    marginTop: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(25),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },

  scheduleTitleHighlight: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(20),
  },

  scheduleElement: {
    flexDirection: 'row',
    width: getResponsiveWidth(340),
    justifyContent: 'center',
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 10,
    gap: 13,
  },

  scheduleText: {
    fontSize: getResponsiveFontSize(15),
    backgroundColor: '#FFC84D',
    borderRadius: 10,
    paddingLeft: 20,
    lineHeight: getResponsiveHeight(46.89),
  },

  scheduleAddText: {
    fontSize: getResponsiveFontSize(15),
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    paddingLeft: 20,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    lineHeight: getResponsiveHeight(46.89),
  },

  scheduleButton: {
    position: 'relative',
    backgroundColor: '#FFC84D',
    width: getResponsiveWidth(52),
    height: getResponsiveHeight(47),
    alignItems: 'center',
    borderRadius: 10,
  },

  buttonIconMemo: {
    position: 'absolute',
    bottom: getResponsiveHeight(20),
    width: getResponsiveWidth(18.84),
    height: getResponsiveHeight(20.48),
  },

  buttonText: {
    position: 'absolute',
    bottom: getResponsiveHeight(10),
    fontSize: 10,
  },

  noScheduleText: {
    fontSize: getResponsiveFontSize(15),
    color: 'gray',
    marginTop: getResponsiveHeight(20),
  },

  scheduleContainer: {
    marginBottom: getResponsiveHeight(20),
  },

  loadingContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: getResponsiveHeight(20),
  },

  loadingText: {
    fontSize: getResponsiveFontSize(16),
    marginTop: getResponsiveHeight(20),
    color: '#FFC84D',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: 300,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  memoInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  modalCloseButton: {
    marginTop: 10,
    backgroundColor: '#FFC84D',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {textAlign: 'center', fontWeight: 'bold'},
});
