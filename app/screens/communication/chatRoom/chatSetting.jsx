import React, {useEffect} from 'react';
import { BlurView } from '@react-native-community/blur';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
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
import {Modal} from 'react-native';

const {width} = Dimensions.get('window');

export default function ChatSettings({
  isOpen,
  onClose,
  onChangeName,
  onShowMembers,
  onShowMedia,
  onLeaveChat,
  onToggleNotifications,
}) {
  const translateX = useSharedValue(width);

  useEffect(() => {
    translateX.value = isOpen
      ? withTiming(0, {duration: 300})
      : withTiming(width, {duration: 300});
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
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
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent // ← 이거 꼭 넣어줘야 Android에서 화면 전체에 덮임
      >
      {/* 🔥 어두운 배경 (모달 효과) */}

      {isOpen && <BlurView
        style={[
          StyleSheet.absoluteFill,
          {
            flex: 1,
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // ← ✅ 핵심!
          },
        ]}
        blurType="light" // or 'light', 'extraLight', etc.
        blurAmount={2} // 흐림 정도
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"
        // ✅ 여기!
      ></BlurView>}
            {isOpen && <TouchableOpacity style={styles.backdrop} onPress={onClose} />}


      <Animated.View
        style={[styles.container, animatedStyle]}
        {...panResponder.panHandlers}>
        {/* ✅ 설정창 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅방 설정</Text>
          {/* <TouchableOpacity onPress={onClose}></TouchableOpacity> */}
        </View>

        {/* ✅ 설정 메뉴 */}
        <View style={styles.content}>
          <TouchableOpacity style={styles.option} onPress={onChangeName}>
            <Text style={styles.optionText}>채팅방 이름 변경</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={onShowMembers}>
            <Text style={styles.optionText}>멤버 목록</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={onShowMedia}>
            <Text style={styles.optionText}>사진 & 영상</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={onToggleNotifications}>
            <Text style={styles.optionText}>알림 설정</Text>
          </TouchableOpacity>


          {/* 멤버*/}
          <View style={styles.memberList}></View>

          <TouchableOpacity
            style={[styles.leaveOption]}
            onPress={onLeaveChat}>
            <Text style={[styles.optionText, styles.leaveText]}>
              채팅방 나가기
            </Text>
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
    backgroundColor: 'rgba(0,0,0,0.3)', // 🔥 배경 어둡게
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
    zIndex: 9999,
    elevation: 20, // 안드로이드용
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  icon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Light',
  },
  leaveOption: {
    marginTop:getResponsiveHeight(200),
  },
  leaveText: {
    fontFamily: 'Pretendard-Regular',
    color: 'red',
    // fontWeight: 'bold',
  },

  memberList:{
    width:'100%',
    minHeight:'20%',
    maxHeight:'30%',
    borderRadius:getResponsiveIconSize(5),
    backgroundColor:'#FFD26D'
  }
});
