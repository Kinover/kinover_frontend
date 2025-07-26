import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useSelector, useDispatch} from 'react-redux';
import LeaveChatRoomModal from './modal/leaveChatRoomModal';
import RenameChatRoomModal from './modal/renameChatRoomModal';
import ChangeKinoModal from './modal/changeKinoModal';
import {
  fetchChatRoomUsersThunk,
  renameChatRoomThunk,
} from '../../../../redux/thunk/chatRoomThunk';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../../utils/responsive';
import {updateChatRoomNameInList} from '../../../../redux/slices/chatRoomSlice';

export default function ChatSettings({
  isOpen,
  onClose,
  onShowMedia,
  onLeaveChat,
  onToggleNotifications,
  chatRoomId,
  navigation,
  isKino,
  onNavigateToKino,
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
  const translateX = useSharedValue(getResponsiveWidth(375));

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
      setInternalVisible(true); // 모달 먼저 열고
      setTimeout(() => {
        translateX.value = withTiming(0, {duration: 300});
      }, 10);
    } else {
      translateX.value = withTiming(getResponsiveWidth(375), {duration: 300});
      setTimeout(() => {
        setInternalVisible(false); // 애니메이션 끝나고 모달 닫기
      }, 300);
    }
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

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
        // ✅ 이름 변경 후 Redux 상태도 업데이트!
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

  // ❶ 닫기 요청 → 상태 설정
  const handleGoToKinoSelect = () => {
    setShouldNavigate(true);
    onClose(); // isOpen을 false로 바꿈
  };

  // ❷ isOpen이 false로 바뀌고 모달 애니메이션 끝난 후 실행
  useEffect(() => {
    if (!isOpen && shouldNavigate) {
      const timeout = setTimeout(() => {
        navigation.navigate('키노선택화면', {chatRoomId});
        setShouldNavigate(false); // 초기화
      }, 300); // 애니메이션 duration과 동일하게
      return () => clearTimeout(timeout);
    }
  }, [isOpen, shouldNavigate]);

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      {/* 내부 모달 */}
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
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"
      />
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />

      {/* 설정 패널 */}
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅방 설정</Text>
          <TouchableOpacity onPress={() => setIsAlarmOn(prev => !prev)}>
            <Image
              style={styles.alarmIcon}
              source={
                isAlarmOn
                  ? require('../../../../assets/images/navigator_alarm-button.png')
                  : require('../../../../assets/images/navigator_alarm-button-off4.png')
              }
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {!isKino && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => setIsRenameModalVisible(true)}>
              <Text style={styles.optionText}>이름 변경</Text>
            </TouchableOpacity>
          )}

          {!isKino && (
            <TouchableOpacity
              onPress={() => setShowMembers(!showMembers)}
              style={styles.option}>
              <View style={styles.optionRow}>
                <Text style={styles.optionText}>멤버 목록</Text>
                <Image
                  source={require('../../../../assets/images/down-yellow.png')}
                  style={[
                    styles.arrowIcon,
                    {transform: [{rotate: showMembers ? '180deg' : '0deg'}]},
                  ]}
                />
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
                      source={require('../../../../assets/images/addMember-bt.png')}
                      style={styles.addIcon}
                    />
                    <Text style={styles.addText}>새 멤버 초대</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </TouchableOpacity>
          )}

          {isKino && (
            <TouchableOpacity
              style={styles.option}
              onPress={() => setIsChangeKinoModalVisible(true)}>
              <Text style={styles.optionText}>키노 교체하기</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.option} onPress={onShowMedia}>
            <Text style={styles.optionText}>사진 & 영상</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.leaveOption}
          onPress={() => setIsLeaveModalVisible(true)}>
          <Text style={[styles.optionText, styles.leaveText]}>
            채팅방 나가기
          </Text>
        </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  blurOverlay: {
    flex: 1,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: getResponsiveWidth(280),
    height: '100%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: getResponsiveWidth(20),
    paddingBottom: getResponsiveHeight(100),
    zIndex: 9999,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveHeight(90),
    marginBottom: getResponsiveHeight(60),
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(22),
    fontFamily: 'Pretendard-Regular',
    color: '#FFC84D',
    fontWeight: 'bold',
  },
  alarmIcon: {
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    resizeMode: 'contain',
  },
  content: {
    gap: getResponsiveHeight(35),
  },
  option: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: getResponsiveHeight(7),
  },
  optionText: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-Light',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrowIcon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(17),
    height: getResponsiveHeight(17),
    marginRight: getResponsiveWidth(5),
  },
  memberList: {
    width: '100%',
    minHeight: getResponsiveHeight(120),
    borderRadius: getResponsiveIconSize(8),
    backgroundColor: 'rgba(255, 228, 167, 0.30)',
    marginTop: getResponsiveHeight(10),
    padding: getResponsiveHeight(10),
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(5),
    padding: getResponsiveHeight(5),
    marginBottom: getResponsiveHeight(5),
  },
  memberImage: {
    width: getResponsiveIconSize(34),
    height: getResponsiveIconSize(34),
    borderRadius: getResponsiveIconSize(17),
    marginRight: getResponsiveWidth(12),
    backgroundColor: '#fff',
  },
  memberName: {
    fontSize: getResponsiveFontSize(14.5),
    fontFamily: 'Pretendard-Light',
    color: 'black',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveHeight(5),
  },
  addIcon: {
    width: getResponsiveIconSize(34),
    height: getResponsiveIconSize(34),
    resizeMode: 'contain',
    marginRight: getResponsiveWidth(12),
  },
  addText: {
    fontSize: getResponsiveFontSize(14),
    color: '#FFB000',
    fontFamily: 'Pretendard-Medium',
  },
  leaveOption: {
    position: 'absolute',
    bottom: getResponsiveHeight(30),
    left: getResponsiveWidth(20),
    right: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(12),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  leaveText: {
    fontFamily: 'Pretendard-Regular',
    color: 'red',
    fontSize: getResponsiveFontSize(14),
  },
});
