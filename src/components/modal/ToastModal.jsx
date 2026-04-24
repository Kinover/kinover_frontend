// components/ToastModal.js
import React, {useEffect} from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';
import {FONTS} from 'styles/typography';

export default function ToastModal({
  visible,
  onClose,
  message,
  duration = 1000,
  useNativeModal = true, // 추가: 기본은 기존처럼 Modal 사용
}) {
  const styles = useScaledStyleSheet(rf => ({

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: getResponsiveHeight(100),
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',

 // 맨 위로 올리기
    zIndex: 99999,
    elevation: 99999,
  },

  toastShadow: {
    shadowOpacity: 0,
    elevation: 0,
  },
  toastBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: getResponsiveIconSize(20),
    paddingHorizontal: getResponsiveWidth(22),
    paddingVertical: getResponsiveHeight(12),
    maxWidth: '90%',
    alignSelf: 'center',
  },

  toastText: {
    color: '#fff',
    fontSize: rf(14),
    textAlign: 'center',
    fontFamily: FONTS.MEDIUM,
  },

  }));
 // 일정 시간 뒤 자동 닫기
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const content = (
    <View style={styles.overlay}>
      <View style={styles.toastShadow}>
        <View style={styles.toastBox}>
          <AppText allowFontScaling={false} style={styles.toastText}>
            {message}
          </AppText>
        </View>
      </View>
    </View>
  );

  if (useNativeModal) {
    return (
      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={onClose}
        statusBarTranslucent={true}>
        {content}
      </Modal>
    );
  }

 // 다른 Modal 안에서 쓸 때: 그냥 오버레이 뷰만 리턴
  return content;
}

