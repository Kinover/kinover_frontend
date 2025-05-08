import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from './responsive';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export default function CustomModal({
  visible,
  onClose,
  onConfirm,
  children,
  modalBoxStyle,
  contentStyle,
  confirmButtonStyle,
  closeButtonStyle,
  confirmTextStyle,
  closeTextStyle,
  confirmText,
  closeText,
  buttonBottomStyle,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      // presentationStyle="overFullScreen" // 👈 핵심
      presentationStyle="overFullScreen" // ✅ 이거 중요
      statusBarTranslucent={true} // ✅ Android에서 전체 덮기
    >
      <BlurView
        style={[
          StyleSheet.absoluteFill,
          {
            flex: 1,
            position: 'absolute',
            backgroundColor: Platform.OS==='android'?'rgba(0, 0, 0, 0.1)':'rgba(0, 0, 0, 0.2)', // ← ✅ 핵심!
          },
        ]}
        blurType="light" // or 'light', 'extraLight', etc.
        blurAmount={2} // 흐림 정도
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"

        // ✅ 여기!
      ></BlurView>
      <View style={[styles.overlay, {paddingBottom: insets.bottom || 20}]}>
        <View style={[styles.modalBox, modalBoxStyle]}>
          {/* 모달 내용 */}
          {/* 상단 닫기 버튼 */}
          <TouchableOpacity
            style={styles.closeXButton}
            onPress={onClose}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.closeXText}>×</Text>
          </TouchableOpacity>

          <View style={[styles.contentWrapper, contentStyle]}>{children}</View>

          {/* 버튼 영역 */}
          <View style={[styles.buttonBottom, buttonBottomStyle]}>
            {closeText && (
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, closeButtonStyle]}>
                <Text style={closeTextStyle}>{closeText}</Text>
              </TouchableOpacity>
            )}

            {onConfirm && (
              <TouchableOpacity
                onPress={onConfirm}
                style={[styles.confirmButton, confirmButtonStyle]}>
                <Text style={confirmTextStyle}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'android' ? 20 : 0, // ✅ 아래 잘리는 현상 방지
  },
  modalBox: {
    position: 'relative',
    width: getResponsiveWidth(320),
    height: 'auto',
    padding: 20,
    backgroundColor: 'white', // ✅ 유지
    borderRadius: 10, // ✅ 유지
    paddingTop: getResponsiveHeight(30),
    zIndex:9999, // iOS
    elevation: 20, // Android
  },
  contentWrapper: {
    marginBottom: 20,
  },
  buttonBottom: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  closeButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 8,
    width: '100%',
    textAlign: 'center',
  },
  confirmButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#FFC84D',
    borderRadius: 8,
    width: '100%',
    textAlign: 'center',
  },

  closeXButton: {
    position: 'absolute',
    top: getResponsiveHeight(5),
    right: getResponsiveWidth(15),
    zIndex: 5,
  },

  closeXText: {
    fontSize: getResponsiveFontSize(26),
    color: '#FFC84D',
  },
});
