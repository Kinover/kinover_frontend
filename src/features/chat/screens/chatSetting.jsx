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
import ChangeKinoModal from '../components/changeKinoModal';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {updateChatRoomNameInList} from '../store/chatRoomSlice';

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

  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const familyId = useSelector(state => state.family.familyId);
  const userId = useSelector(state => state.user.userId);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen && chatRoomId) {
      dispatch(fetchChatRoomUsersThunk(chatRoomId));
    }
  }, [isOpen, chatRoomId, dispatch]);

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

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
      })
      .catch(err => {
        console.warn('❌ 알림 설정 변경 실패:', err);
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
          {/* 상단 설정들 */}
          {!isKino && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => setIsRenameModalVisible(true)}>
              <Text style={styles.optionTitle}>채팅방 이름</Text>
              <Text style={styles.optionText}>이름 변경</Text>
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
                  <TouchableOpacity
                    onPress={handleShowMembers}
                    style={styles.addMemberButton}>
                    <Image
                      source={require('../../../assets/images/addMember-bt.png')}
                      style={styles.addIcon}
                    />
                    <Text style={styles.addText}>새 멤버 초대</Text>
                  </TouchableOpacity>
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

          {/* 하단 나가기 버튼 */}
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
    width: getResponsiveWidth(310), // 🔹 살짝 더 넓게
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

  // 옵션 섹션 전체
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
    color: '#6B7280',
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
    width: getResponsiveWidth(18),
    height: getResponsiveHeight(18),
  },

  memberList: {
    width: '100%',
    minHeight: getResponsiveHeight(110),
    borderRadius: getResponsiveIconSize(10),
    // backgroundColor: 'rgba(255, 228, 167, 0.22)',
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
    marginTop: getResponsiveHeight(8),
  },
  addIcon: {
    width: getResponsiveIconSize(30),
    height: getResponsiveIconSize(30),
    resizeMode: 'contain',
    marginRight: getResponsiveWidth(10),
  },
  addText: {
    fontSize: getResponsiveFontSize(13),
    color: '#F59E0B',
    fontFamily: 'Pretendard-Medium',
  },

  // 하단 나가기
  leaveOption: {
    position: 'absolute',
    bottom: '5%',
    marginTop: getResponsiveHeight(26),
    paddingVertical: getResponsiveHeight(10),
    alignItems: 'flex-start',
  },
  leaveText: {
    fontFamily: 'Pretendard-Medium',
    color: '#EF4444',
    fontSize: getResponsiveFontSize(13.5),
  },
});
