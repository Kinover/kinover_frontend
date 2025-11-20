import React, {useEffect} from 'react';
import {Modal, View, Text, StyleSheet} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../utils/responsive';

export default function ToastModal({
  visible,
  onClose,
  message,
  duration = 1000,
}) {
  // 일정 시간 뒤 자동 닫기
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View style={styles.overlay}>
        <View style={styles.toastBox}>
          <Text style={styles.toastText}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 화면을 어둡게 하지 않고, 아래쪽에 토스트 배치
  overlay: {
    flex: 1,
    justifyContent: 'flex-end', // 🔥 아래에 배치
    alignItems: 'center',
    paddingBottom: getResponsiveHeight(80), // 화면 아래에서 띄우기
    backgroundColor: 'transparent', // 토스트는 보통 배경 없음
  },

  // 요즘 앱들 평균적인 토스트 형태
  toastBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // 🔥 대부분 앱 스타일
    borderRadius: getResponsiveIconSize(20),
    paddingHorizontal: getResponsiveWidth(22),
    paddingVertical: getResponsiveHeight(12),
    maxWidth: '90%',
    alignSelf: 'center',

    // 살짝 그림자 (부드러운 느낌)
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 3},
    elevation: 6,
  },

  toastText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(14),
    textAlign: 'center',
    fontFamily: 'Pretendard-Medium',
  },
});
