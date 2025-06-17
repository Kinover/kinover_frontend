import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
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

const {width} = Dimensions.get('window');

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
  if (!isOpen) return null; // ✅ Modal 완전 제거

  const [isChangeKinoModalVisible, setIsChangeKinoModalVisible] =
    useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const translateX = useSharedValue(width);

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
    translateX.value = isOpen
      ? withTiming(0, {duration: 300})
      : withTiming(width, {duration: 300});
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
    onClose(); // 먼저 모달 닫기
    navigation.navigate('키노선택화면');
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      {/* 모달 내부 모달들 */}
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

      {/* 배경 블러/터치 */}
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
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={styles.optionText}>멤버 목록</Text>
                <Image
                  source={require('../../../../assets/images/down-yellow.png')}
                  style={{
                    resizeMode: 'contain',
                    width: getResponsiveWidth(17),
                    height: getResponsiveHeight(17),
                    marginRight: getResponsiveWidth(5),
                    transform: [{rotate: showMembers ? '0deg' : '180deg'}],
                  }}
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

          <TouchableOpacity
            style={styles.option}
            onPress={onToggleNotifications}>
            <Text style={styles.optionText}>알림 설정</Text>
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
    elevation: 10,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.75,
    height: '100%',
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 30,
    paddingBottom: getResponsiveHeight(100),
    zIndex: 9999,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveHeight(90),
    marginBottom: getResponsiveHeight(40),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(22),
    fontFamily: 'Pretendard-Regular',
    color: '#FFC84D',
    fontWeight: 'bold',
  },
  content: {
    gap: 15,
  },
  option: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginVertical: 10,
  },
  optionText: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-Light',
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
  memberList: {
    width: '100%',
    minHeight: '16%',
    borderRadius: getResponsiveIconSize(8),
    backgroundColor: 'rgba(255, 228, 167, 0.30)',
    marginTop: 10,
    overflow: 'hidden',
    padding: getResponsiveHeight(10),
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveHeight(5),
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
  leaveOption: {
    position: 'absolute',
    bottom: getResponsiveHeight(30),
    left: 20,
    right: 20,
    alignItems: 'flex-start',
    paddingVertical: 12,
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
