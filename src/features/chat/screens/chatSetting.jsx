import React, {useEffect, useState, useRef} from 'react';
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
import {useSelector, useDispatch} from 'react-redux';

import {
  fetchChatRoomUsersThunk,
  renameChatRoomThunk,
  toggleChatRoomNotificationThunk,
} from '../store/chatRoomThunk';

import LeaveChatRoomModal from '../components/leaveChatRoomModal';
import RenameChatRoomModal from '../components/renameChatRoomModal';
import ChangeKinoModal from '../components/ChangeKinoModal';

import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';

import {
  bumpChatRoomToTop,
  updateChatRoomNameInList,
} from '../store/chatRoomSlice';

import ToastModal from '../../../components/ToastModal';
import {resetRoomMessageList} from '../store/messageSlice';

export default function ChatSettings({
  isOpen,
  onClose,
  onLeaveChat,
  chatRoomId,
  navigation,
  isKino,
}) {
  const dispatch = useDispatch();

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
  const navTimerRef = useRef(null);

  // ✅ 토스트
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const familyId = useSelector(state => state.family.familyId);
  const userId = useSelector(state => state.user.userId);
  const familyMembers = useSelector(
    state => state.userFamily.familyUserList || [],
  );

  // ✅ 현재 채팅방 정보
  const chatRoomList = useSelector(state => state.chatRoom.chatRoomList || []);
  const rid = chatRoomId == null ? null : String(chatRoomId);
  const currentRoom = chatRoomList.find(
    room => String(room.chatRoomId) === rid,
  );

  const isAllFamilyInChat =
    Array.isArray(familyMembers) &&
    familyMembers.length > 0 &&
    Array.isArray(chatRoomUsers) &&
    chatRoomUsers.length >= familyMembers.length;

  // ✅ 채팅방 유저 조회
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

  // ✅ 알림 상태 동기화
  useEffect(() => {
    if (!currentRoom) return;
    setIsAlarmOn(!!currentRoom.notificationOn);
  }, [currentRoom]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  // ✅ 토스트 자동 닫기
  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  // ✅ 네비 타이머 정리
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

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
        setToastMessage(newIsOn ? '알림을 켰어요' : '알림을 껐어요');
        setToastVisible(true);
      })
      .catch(err => {
        console.warn('❌ 알림 설정 변경 실패:', err);
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
        dispatch(updateChatRoomNameInList({chatRoomId, newRoomName}));
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

  /**
   * ✅ 키노 변경하기 눌렀을 때:
   * 1) 해당 채팅방 메시지 비우기 + isFetched false
   * 2) 리스트에서 해당 방을 “최신”으로 올리기
   * 3) 키노 선택 화면으로 이동
   *
   * ⚠️ 진짜 “키노 변경 성공”은 키노선택화면에서 일어나니까,
   *    성공 후에는 그쪽에서 fetchChatRoomListThunk를 한 번 더 해주는 게 좋아.
   */
  const handleGoToKinoSelect = () => {
    if (!chatRoomId) return;

    dispatch(resetRoomMessageList(chatRoomId));
    dispatch(bumpChatRoomToTop(chatRoomId));

    setShouldNavigate(true);
    onClose();
  };

  // ✅ 키노 선택 화면 이동 (슬라이드 닫힘 애니메이션 끝난 뒤)
  useEffect(() => {
    if (!isOpen && shouldNavigate) {
      navTimerRef.current = setTimeout(() => {
        navigation.navigate('키노선택화면', {chatRoomId});
        setShouldNavigate(false);
      }, 260);

      return () => {
        if (navTimerRef.current) clearTimeout(navTimerRef.current);
      };
    }
  }, [isOpen, shouldNavigate, navigation, chatRoomId]);

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
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

          {!isKino && (
            <TouchableOpacity
              style={styles.leaveOption}
              onPress={() => setIsLeaveModalVisible(true)}>
              <Text style={styles.leaveText}>채팅방 나가기</Text>
            </TouchableOpacity>
          )}
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
    fontSize: getResponsiveFontSize(13.5),
  },
});
