import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../utils/responsive';

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
  showTrashButton = false, // ✅ 추가: 일정 모달일 때만 true
  onTrashPress, // ✅ 추가: 휴지통 버튼 클릭 이벤트
}) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}>
      <BlurView
        style={[
          StyleSheet.absoluteFill,
          {
            flex: 1,
            position: 'absolute',
            backgroundColor:
              Platform.OS === 'android'
                ? 'rgba(0, 0, 0, 0.1)'
                : 'rgba(0, 0, 0, 0.2)',
          },
        ]}
        blurType="light"
        blurAmount={2}
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"
      />

      <View style={[styles.overlay]}>
        <View style={[styles.modalBox, modalBoxStyle]}>
          {/* 닫기(X) + 휴지통 버튼 */}
          <View
            style={[
              styles.topButtonRow,
              showTrashButton && {
                justifyContent: 'space-between',
                width: '100%',
              },
            ]}>
            {showTrashButton && (
              <TouchableOpacity
                onPress={onTrashPress}
                style={styles.trashButton}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Image
                  source={require('../assets/images/trash.png')}
                  style={styles.trashIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.closeXButton}
              onPress={onClose}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.closeXText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.contentWrapper, contentStyle]}>{children}</View>

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
  },
  modalBox: {
    position: 'relative',
    width: getResponsiveWidth(320),
    height: 'auto',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingTop: getResponsiveHeight(30),
    zIndex: 50,
    elevation: 10,
  },
  topButtonRow: {
    position: 'absolute',
    top: getResponsiveHeight(5),
    right: getResponsiveWidth(15),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },
  closeXButton: {
    marginRight: 10,
  },
  closeXText: {
    fontSize: getResponsiveFontSize(26),
    color: '#FFC84D',
  },
  trashButton: {
    padding: 4,
  },
  trashIcon: {
    width: getResponsiveWidth(16),
    height: getResponsiveHeight(16),
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
});
