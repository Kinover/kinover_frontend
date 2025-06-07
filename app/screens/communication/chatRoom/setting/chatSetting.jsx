import React, {useEffect, useState} from 'react';
import {BlurView} from '@react-native-community/blur';
import {useSelector, useDispatch} from 'react-redux';
import LeaveChatRoomModal from './modal/leaveChatRoomModal';
import RenameChatRoomModal from './modal/renameChatRoomModal';
import {
  fetchChatRoomUsersThunk,
  renameChatRoomThunk,
} from '../../../../redux/thunk/chatRoomThunk';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../../utils/responsive';
import {WINDOW_HEIGHT, WINDOW_WIDTH} from '@gorhom/bottom-sheet';

const {width} = Dimensions.get('window');

export default function ChatSettings({
  isOpen,
  onClose,
  onShowMedia,
  onLeaveChat,
  onToggleNotifications,
  chatRoomId,
  navigation,
}) {
  const translateX = useSharedValue(width);
  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const dispatch = useDispatch();
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const familyId = useSelector(state => state.family.familyId);
  const userId = useSelector(state => state.user.userId);
  const [showMembers, setShowMembers] = useState(false);

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
      .catch(err => {
        console.warn('❌ 이름 변경 실패:', err);
      });
  };

  const handleShowMembers = () => {
    onClose(); // ✅ 모달 닫고
    navigation.navigate('채팅방멤버추가화면', {chatRoomId});
  };

  const handleLeaveConfirm = () => {
    setIsLeaveModalVisible(false);
    onLeaveChat();
  };

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

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
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
      </View>
      {isOpen && (
        <BlurView
          style={[StyleSheet.absoluteFill, styles.blurOverlay]}
          blurType="light"
          blurAmount={2}
          reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"
        />
      )}

      {isOpen && <TouchableOpacity style={styles.backdrop} onPress={onClose} />}

      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅방 설정</Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => setIsRenameModalVisible(true)}>
            <Text style={styles.optionText}>이름 변경</Text>
          </TouchableOpacity>

          <View style={{display: 'flex', justifyContent: 'space-between'}}>
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
                    transform: [{rotate: showMembers ? '0deg' : '180deg'}], // ✅ 추가
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
          </View>

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
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    marginVertical: 10,
    flexDirection: 'column',
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
  modalTitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: getResponsiveHeight(10),
  },
  modalText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: getResponsiveFontSize(14),
    backgroundColor: '#fff',
    fontFamily: 'Pretendard-Regular',
  },
});
