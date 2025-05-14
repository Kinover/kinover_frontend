import React, {useEffect} from 'react';
import {BlurView} from '@react-native-community/blur';
import {useSelector, useDispatch} from 'react-redux';
import {fetchChatRoomUsersThunk} from '../../../redux/thunk/chatRoomThunk';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  Image,
  Modal,
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
} from '../../../utils/responsive';

const {width} = Dimensions.get('window');

export default function ChatSettings({
  isOpen,
  onClose,
  onChangeName,
  onShowMembers,
  onShowMedia,
  onLeaveChat,
  onToggleNotifications,
  chatRoomId,
  navigation
}) {
  const translateX = useSharedValue(width);
  const chatRoomUsers = useSelector(state => state.chatRoom.chatRoomUsers);
  const dispatch = useDispatch();

  const handleShowMembers = () => {
    navigation.navigate('채팅방멤버추가화면', {chatRoomId});
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

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dx > 50) {
        onClose();
      }
    },
  });

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      {isOpen && (
        <BlurView
          style={[
            StyleSheet.absoluteFill,
            {
              flex: 1,
              position: 'absolute',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
            },
          ]}
          blurType="light"
          blurAmount={2}
          reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"
        />
      )}
      {isOpen && <TouchableOpacity style={styles.backdrop} onPress={onClose} />}

      <Animated.View
        style={[styles.container, animatedStyle]}
        {...panResponder.panHandlers}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅방 설정</Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.option} onPress={onChangeName}>
            <Text style={styles.optionText}>채팅방 이름 변경</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={onShowMedia}>
            <Text style={styles.optionText}>사진 & 영상</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={onToggleNotifications}>
            <Text style={styles.optionText}>알림 설정</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={onShowMembers}>
            <Text style={styles.optionText}>멤버 목록</Text>
          </TouchableOpacity>

          <View style={styles.memberList}>
            <TouchableOpacity
              onPress={handleShowMembers}
              style={styles.addMemberButton}>
              <Text style={styles.addIcon}>＋</Text>
              <Text style={styles.addText}>멤버 추가</Text>
            </TouchableOpacity>
            {chatRoomUsers?.map(user => (
              <View key={user.userId} style={styles.memberItem}>
                <Image source={{uri: user.image}} style={styles.memberImage} />
                <Text style={styles.memberName}>{user.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 👇 하단 고정 나가기 버튼 */}
        <TouchableOpacity style={styles.leaveOption} onPress={onLeaveChat}>
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
    zIndex: 999,
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
    paddingHorizontal: 20,
    paddingBottom: getResponsiveHeight(100), // Leave button과 겹치지 않게
    zIndex: 9999,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveHeight(80),
    marginBottom: getResponsiveHeight(40),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Regular',
    color: '#FFC84D',
    fontWeight: 'bold',
  },
  content: {
    gap: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  optionText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Light',
  },

  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveHeight(10),
    borderBottomWidth: 1,
    borderColor: '#f5d58d',
  },

  addIcon: {
    fontSize: getResponsiveFontSize(40),
    // width: getResponsiveIconSize(40),
    // height: getResponsiveIconSize(40),
    color: '#F29F05',
    marginRight: getResponsiveWidth(10),
    fontFamily: 'Pretendard-Bold',
  },

  addText: {
    fontSize: getResponsiveFontSize(14),
    color: 'black',
    fontFamily: 'Pretendard-Medium',
  },

  memberList: {
    width: '100%',
    minHeight: '16%',
    // maxHeight: '70%',
    borderRadius: getResponsiveIconSize(5),
    backgroundColor: '#FFD26D',
    marginTop: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveHeight(10),
    borderBottomWidth: 1,
    borderColor: '#f5d58d',
  },
  memberImage: {
    width: getResponsiveIconSize(40),
    height: getResponsiveIconSize(40),
    borderRadius: getResponsiveIconSize(20),
    marginRight: getResponsiveWidth(10),
    backgroundColor: '#fff',
  },
  memberName: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-SemiBold',
    color: '#333',
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
