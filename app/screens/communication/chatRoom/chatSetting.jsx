import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, PanResponder } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { getResponsiveHeight, getResponsiveFontSize } from '../../../utils/responsive';

const { width } = Dimensions.get('window');

export default function ChatSettings({ isOpen, onClose, onChangeName, onShowMembers, onShowMedia, onLeaveChat, onToggleNotifications }) {
  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = isOpen ? withTiming(0, { duration: 300 }) : withTiming(width, { duration: 300 });
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // 🔥 슬라이드 닫기 제스처 추가
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dx > 50) {
        // 오른쪽으로 50px 이상 드래그하면 닫기
        onClose();
      }
    },
  });

  return (
    <>
      {/* 🔥 어두운 배경 (모달 효과) */}
      {isOpen && <TouchableOpacity style={styles.backdrop} onPress={onClose} />}

      <Animated.View style={[styles.container, animatedStyle]} {...panResponder.panHandlers}>
        {/* ✅ 설정창 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅방 설정</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="gray" />
          </TouchableOpacity>
        </View>

        {/* ✅ 설정 메뉴 */}
        <View style={styles.content}>
          <TouchableOpacity style={styles.option} onPress={onChangeName}>
            <Icon name="pencil" size={20} color="black" style={styles.icon} />
            <Text style={styles.optionText}>채팅방 이름 변경</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={onShowMembers}>
            <Icon name="people" size={20} color="black" style={styles.icon} />
            <Text style={styles.optionText}>멤버 목록</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={onShowMedia}>
            <Icon name="image" size={20} color="black" style={styles.icon} />
            <Text style={styles.optionText}>사진 & 영상</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={onToggleNotifications}>
            <Icon name="notifications" size={20} color="black" style={styles.icon} />
            <Text style={styles.optionText}>알림 설정</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.option, styles.leaveOption]} onPress={onLeaveChat}>
            <Icon name="exit" size={20} color="red" style={styles.icon} />
            <Text style={[styles.optionText, styles.leaveText]}>채팅방 나가기</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)', // 🔥 배경 어둡게
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
    padding: 20,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: getResponsiveHeight(60),
  },
  headerTitle: { 
    fontSize: getResponsiveFontSize(18), 
    fontWeight: 'bold' 
  },
  content: { 
    gap: 15 
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  icon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: getResponsiveFontSize(16),
  },
  leaveOption: {
    marginTop: 20,
  },
  leaveText: {
    color: 'red',
    fontWeight: 'bold',
  },
});
