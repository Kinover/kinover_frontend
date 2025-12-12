import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  fetchChatRoomUsersThunk,
  renameChatRoomThunk,
  toggleChatRoomNotificationThunk,
} from '../store/chatRoomThunk';
import {useSelector, useDispatch} from 'react-redux';
import LeaveChatRoomModal from '../components/leaveChatRoomModal';
import RenameChatRoomModal from '../components/renameChatRoomModal';
import ChangeKinoModal from '../components/ChangeKinoModal';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {updateChatRoomNameInList} from '../store/chatRoomSlice';
import ToastModal from '../../../components/ToastModal';

export default function ChatSettings({
  isOpen,
  onClose,
  onLeaveChat,
  chatRoomId,
  navigation,
  isKino,
}) {
  const [isChangeKinoModalVisible, setIsChangeKinoModalVisible] =
    useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [isAlarmOn, setIsAlarmOn] = useState(true);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [internalVisible, setInternalVisible] = useState(false);
  const translateX = useSharedValue(getResponsiveWidth(320));

  // ✅ 토스트 관련 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const familyId = useSelector(state => state.family.familyId);
  const userId = useSelector(state => state.user.userId);
  const familyMembers = useSelector(
    state => state.userFamily.familyUserList || [],
  );

  // ✅ 현재 채팅방 정보 & notificationOn 가져오기
  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList || []);
  const currentRoom = chatRoomList.find(room => room.chatRoomId === chatRoomId);

  const dispatch = useDispatch();

  const isAllFamilyInChat =
    Array.isArray(familyMembers) &&
    familyMembers.length > 0 &&
    Array.isArray(chatRoomUsers) &&
    chatRoomUsers.length >= familyMembers.length;

  useEffect(() => {
    if (isOpen && chatRoomId) {
      dispatch(fetchChatRoomUsersThunk(chatRoomId));
    }
  }, [isOpen, chatRoomId, dispatch]);

  // ✅ 모달 열고/닫힐 때 슬라이드 애니메이션
  useEffect(() => {
    if (isOpen) {
      setInternalVisible(true);
      setTimeout(() => {
        translateX.value = withTiming(0, {duration: 260});
      }, 10);
    } else {
      translateX.value = withTiming(getResponsiveWidth(320), {duration: 260});
      setTimeout(() => {
        setInternalVisible(false);
      }, 260);
    }
  }, [isOpen, translateX]);

  // ✅ currentRoom.notificationOn 값에 따라 알림 상태 동기화
  useEffect(() => {
    if (!currentRoom) return;
    // 서버/스토어에서 notificationOn === true/false 인 값에 맞춰 세팅
    setIsAlarmOn(!!currentRoom.notificationOn);
  }, [currentRoom]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  // ✅ 토스트 자동 닫기
  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => {
      setToastVisible(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  const handleToggleAlarm = () => {
    const newIsOn = !isAlarmOn;
    setIsAlarmOn(newIsOn);

    dispatch(
      toggleChatRoomNotificationThunk({
        chatRoomId,
        userId,
        isOn: newIsOn,
      }),
    )
      .unwrap()
      .then(() => {
        console.log('🔔 알림 설정 변경 성공');

        setToastMessage(newIsOn ? '알림을 켰어요' : '알림을 껐어요');
        setToastVisible(true);
      })
      .catch(err => {
        console.warn('❌ 알림 설정 변경 실패:', err);
        // 실패 시 원래 상태로 롤백해도 됨
        setIsAlarmOn(!newIsOn);
        setToastMessage('알림 설정 변경에 실패했어요.\n다시 시도해 주세요.');
        setToastVisible(true);
      });
  };

  const handleRenameChatRoom = () => {
    if (!newRoomName.trim()) return;

    dispatch(
      renameChatRoomThunk({
        familyId,
        userId,
        chatRoomId,
        roomName: newRoomName,
      }),
    )
      .unwrap()
      .then(() => {
        dispatch(
          updateChatRoomNameInList({
            chatRoomId,
            newRoomName,
          }),
        );

        setIsRenameModalVisible(false);
        setNewRoomName('');
      })
      .catch(err => console.warn('❌ 이름 변경 실패:', err));
  };

  const handleShowMembers = () => {
    onClose();
    navigation.navigate('채팅방멤버추가화면', {chatRoomId});
  };

  const handleLeaveConfirm = () => {
    onClose();
    setIsLeaveModalVisible(false);
    onLeaveChat(dispatch, navigation, chatRoomId);
  };

  const handleGoToKinoSelect = () => {
    setShouldNavigate(true);
    onClose();
  };

  // 키노 선택 화면 이동
  useEffect(() => {
    if (!isOpen && shouldNavigate) {
      const timeout = setTimeout(() => {
        navigation.navigate('키노선택화면', {chatRoomId});
        setShouldNavigate(false);
      }, 260);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, shouldNavigate, navigation, chatRoomId]);

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      {/* 내부 모달들 */}
      <View>
        <LeaveChatRoomModal
          visible={isLeaveModalVisible}
          onClose={() => setIsLeaveModalVisible(false)}
          onConfirm={handleLeaveConfirm}
        />
        <RenameChatRoomModal
          visible={isRenameModalVisible}
          onClose={() => {
            setIsRenameModalVisible(false);
            setNewRoomName('');
          }}
          onConfirm={handleRenameChatRoom}
          newRoomName={newRoomName}
          setNewRoomName={setNewRoomName}
        />
        <ChangeKinoModal
          visible={isChangeKinoModalVisible}
          onClose={() => setIsChangeKinoModalVisible(false)}
          onConfirm={handleGoToKinoSelect}
        />

        {/* ✅ 토스트 모달 */}
        <ToastModal
          visible={toastVisible}
          message={toastMessage}
          onClose={() => setToastVisible(false)}
        />
      </View>

      {/* 블러 + 백드롭 */}
      <BlurView
        style={[StyleSheet.absoluteFill, styles.blurOverlay]}
        blurType="light"
        blurAmount={2}
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.35)"
      />
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />

      {/* 설정 패널 */}
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.header}>
          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>채팅방 설정</Text>
            <Text style={styles.headerSubtitle}>
              이름, 멤버, 알림을 한 번에 관리해요.
            </Text>
          </View>
          <TouchableOpacity onPress={handleToggleAlarm}>
            <Image
              style={styles.alarmIcon}
              source={
                isAlarmOn
                  ? require('../../../assets/images/navigator_alarm-button.png')
                  : require('../../../assets/images/navigator_alarm-button-off4.png')
              }
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {!isKino && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => setIsRenameModalVisible(true)}>
              <Text style={styles.optionTitle}>채팅방 이름</Text>
              <Text style={styles.optionDescription}>
                채팅방 이름을 변경해요.
              </Text>
            </TouchableOpacity>
          )}

          {!isKino && (
            <View style={styles.option}>
              <View style={styles.optionRow}>
                <View>
                  <Text style={styles.optionTitle}>멤버 목록</Text>
                  <Text style={styles.optionDescription}>
                    함께 채팅하는 가족을 확인해요.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowMembers(!showMembers)}
                  style={styles.expandButton}>
                  <Image
                    source={require('../../../assets/images/down-yellow.png')}
                    style={[
                      styles.arrowIcon,
                      {transform: [{rotate: showMembers ? '180deg' : '0deg'}]},
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {showMembers && (
                <ScrollView style={styles.memberList}>
                  {chatRoomUsers?.map(user => (
                    <View key={user.userId} style={styles.memberItem}>
                      <Image
                        source={{uri: user.image}}
                        style={styles.memberImage}
                      />
                      <Text style={styles.memberName}>{user.name}</Text>
                    </View>
                  ))}

                  {!isAllFamilyInChat && (
                    <TouchableOpacity
                      onPress={handleShowMembers}
                      style={styles.addMemberButton}>
                      <Image
                        source={require('../../../assets/images/addMember-bt.png')}
                        style={styles.addIcon}
                      />
                      <Text style={styles.addText}>새 멤버 초대</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}
            </View>
          )}

          {isKino && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => setIsChangeKinoModalVisible(true)}>
              <Text style={styles.optionTitle}>키노</Text>
              <Text style={styles.optionText}>키노 교체하기</Text>
            </TouchableOpacity>
          )}
          {/* 
          {!isKino && (
            <TouchableOpacity
              style={styles.leaveOption}
              onPress={() => setIsLeaveModalVisible(true)}>
              <Text style={styles.leaveText}>채팅방 나가기</Text>
            </TouchableOpacity>
          )} */}

          <TouchableOpacity
            style={styles.leaveOption}
            onPress={() => setIsLeaveModalVisible(true)}>
            <Text style={styles.leaveText}>채팅방 나가기</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  blurOverlay: {
    flex: 1,
    position: 'absolute',
  },
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: getResponsiveWidth(310),
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: getResponsiveWidth(22),
    paddingBottom: getResponsiveHeight(30),
    zIndex: 9999,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop:
      Platform.OS === 'android'
        ? getResponsiveHeight(36)
        : getResponsiveHeight(80),
    marginBottom: getResponsiveHeight(28),
    alignItems: 'center',
  },
  headerTextBox: {
    flexShrink: 1,
    paddingRight: getResponsiveWidth(12),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(19),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  headerSubtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
  alarmIcon: {
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    resizeMode: 'contain',
  },
  content: {
    flex: 1,
    paddingTop: getResponsiveHeight(4),
  },
  option: {
    paddingVertical: getResponsiveHeight(14),
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
    marginBottom: getResponsiveHeight(3),
  },
  optionText: {
    color: '#111827',
    fontSize: getResponsiveFontSize(15.5),
    fontFamily: 'Pretendard-SemiBold',
  },
  optionDescription: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Regular',
    color: '#9CA3AF',
  },
  expandButton: {
    paddingHorizontal: getResponsiveWidth(4),
    paddingVertical: getResponsiveHeight(4),
  },
  arrowIcon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(15),
    height: getResponsiveHeight(15),
  },
  memberList: {
    width: '100%',
    minHeight: getResponsiveHeight(110),
    borderRadius: getResponsiveIconSize(10),
    backgroundColor: '#f9f9f9',
    marginTop: getResponsiveHeight(10),
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(10),
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(4),
    marginBottom: getResponsiveHeight(2),
  },
  memberImage: {
    width: getResponsiveIconSize(32),
    height: getResponsiveIconSize(32),
    borderRadius: getResponsiveIconSize(16),
    marginRight: getResponsiveWidth(10),
    backgroundColor: '#FFFFFF',
  },
  memberName: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Regular',
    color: '#111827',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(6),
  },
  addIcon: {
    width: getResponsiveIconSize(32),
    height: getResponsiveIconSize(32),
    resizeMode: 'contain',
    marginRight: getResponsiveWidth(10),
  },
  addText: {
    fontSize: getResponsiveFontSize(13),
    color: '#F59E0B',
    fontFamily: 'Pretendard-Medium',
  },
  leaveOption: {
    position: 'absolute',
    bottom: '5%',
    right: 0,
    marginTop: getResponsiveHeight(26),
    paddingVertical: getResponsiveHeight(10),
    alignItems: 'flex-start',
  },
  leaveText: {
    fontFamily: 'Pretendard-Medium',
    color: '#EF4444',
    // color: '#999999',
    fontSize: getResponsiveFontSize(13.5),
  },
});
