import React, {useEffect} from 'react';
import {Modal, View, Text, StyleSheet, Platform} from 'react-native';
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
  // ✅ 일정 시간 뒤 자동 닫기
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
  overlay: {
    flex: 1,
    justifyContent: 'center', // 👉 중앙에 표시
    alignItems: 'center',
    paddingBottom: getResponsiveHeight(80),
    backgroundColor: 'rgba(0,0,0,0.25)', // ✅ 오버레이 반투명
  },
  toastBox: {
    backgroundColor: 'white',
    borderRadius: getResponsiveIconSize(24),
    paddingHorizontal: getResponsiveWidth(32),
    paddingVertical: getResponsiveHeight(16),
    maxWidth: '80%',
  },
  toastText: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(17)
        : getResponsiveFontSize(20),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
    fontWeight: Platform.OS === 'ios' ? undefined : '700',
    marginBottom: getResponsiveHeight(12.5),
    marginTop: getResponsiveHeight(11),
  },
});
