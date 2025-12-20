import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../utils/responsive';
import {BACKGROUND_COLORS, BUTTON_STYLES} from 'styles/style';

// ✅ 햅틱 유틸 import (경로는 네 프로젝트에 맞게)
import {hapticLight, hapticMedium, hapticHeavy} from '../utils/haptic';

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
  showTrashButton = false,
  onTrashPress,
  showCloseButton = false,
  title,
  subText,
  titleImage,
  titleImageStyle,
}) {
  if (!visible) return null;

  // ✅ 안전한 래퍼들 (햅틱 먼저, 그다음 원래 동작)
  const handleBackdropPress = () => {
    hapticLight();
    onClose?.();
  };

  const handleClosePress = () => {
    hapticLight();
    onClose?.();
  };

  const handleConfirmPress = () => {
    // 저장/확인은 좀 더 확실한 촉감 추천
    hapticMedium();
    onConfirm?.();
  };

  const handleTrashPress = () => {
    // 삭제 버튼은 강하게(원하면 Medium으로 바꿔도 됨)
    hapticHeavy();
    onTrashPress?.();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClosePress}
      presentationStyle="overFullScreen"
      statusBarTranslucent>
      {/* 🔹 배경 아무데나 탭하면 닫힘 */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          {/* 블러 배경 */}
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={2}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"
          />

          {/* 🔹 모달 박스는 탭해도 닫히지 않도록 */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.modalBox, modalBoxStyle]}>
              {/* 상단 버튼들 */}
              <View
                style={[
                  styles.topButtonRow,
                  (showTrashButton || showCloseButton) && {
                    justifyContent: showTrashButton
                      ? 'space-between'
                      : 'flex-end',
                    width: '100%',
                  },
                ]}>
                {showTrashButton && (
                  <TouchableOpacity
                    onPress={handleTrashPress}
                    style={styles.trashButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Image
                      source={require('@/assets/images/trash.png')}
                      style={styles.trashIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}

                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeXButton}
                    onPress={handleClosePress}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Image
                      style={styles.closeXIcon}
                      source={require('@/assets/images/close-yellow.png')}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* 타이틀 이미지 */}
              {titleImage && (
                <Image
                  source={titleImage}
                  style={[styles.titleImage, titleImageStyle]}
                  resizeMode="contain"
                />
              )}

              {/* 제목 / 서브텍스트 */}
              {title && <Text style={styles.modalTitle}>{title}</Text>}
              {subText && <Text style={styles.modalSubText}>{subText}</Text>}

              {/* 컨텐츠 영역 */}
              <View style={[styles.contentWrapper, contentStyle]}>
                {children}
              </View>

              {/* 버튼 영역 */}
              <View style={[styles.buttonBottom, buttonBottomStyle]}>
                {closeText && (
                  <TouchableOpacity
                    onPress={handleClosePress}
                    style={[styles.closeButton, closeButtonStyle]}>
                    <Text style={[styles.closeText, closeTextStyle]}>
                      {closeText}
                    </Text>
                  </TouchableOpacity>
                )}

                {onConfirm && (
                  <TouchableOpacity
                    onPress={handleConfirmPress}
                    style={[styles.confirmButton, confirmButtonStyle]}>
                    <Text style={[styles.confirmText, confirmTextStyle]}>
                      {confirmText}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(26),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BACKGROUND_COLORS.overlayBg,
  },

  modalBox: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(22),
    paddingBottom: getResponsiveHeight(18),
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    zIndex: 50,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },

  topButtonRow: {
    position: 'absolute',
    top: getResponsiveHeight(10),
    right: getResponsiveWidth(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },

  modalTitle: {
    color: '#111827',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(16.5)
        : getResponsiveFontSize(17.5),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    marginTop: getResponsiveHeight(8),
    marginBottom: getResponsiveHeight(6),
  },

  modalSubText: {
    textAlign: 'center',
    color: '#6B7280',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12.5),
    lineHeight: getResponsiveHeight(17),
    marginBottom: getResponsiveHeight(10),
  },

  contentWrapper: {
    marginBottom: getResponsiveHeight(5),
  },

  buttonBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveWidth(8),
  },

  closeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BUTTON_STYLES.cancelBg,
    borderRadius: 9,
    paddingVertical: getResponsiveHeight(11),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  confirmButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BUTTON_STYLES.saveBg,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: BUTTON_STYLES.saveBg,
    paddingVertical: getResponsiveHeight(11),
  },

  closeText: {
    color: '#4B5563',
    fontFamily: BUTTON_STYLES.fontFamily,
    fontSize: BUTTON_STYLES.fontSize,
  },

  confirmText: {
    color: '#FFFFFF',
    fontFamily: BUTTON_STYLES.fontFamily,
    fontSize: BUTTON_STYLES.fontSize,
  },

  trashButton: {
    padding: 4,
  },
  trashIcon: {
    width: getResponsiveWidth(16),
    height: getResponsiveHeight(16),
  },

  closeXButton: {
    padding: 6,
  },
  closeXIcon: {
    width: getResponsiveIconSize(12),
    height: getResponsiveIconSize(12),
    resizeMode: 'contain',
  },

  titleImage: {
    width: getResponsiveWidth(42),
    height: getResponsiveHeight(42),
    alignSelf: 'center',
    marginTop: getResponsiveHeight(6),
    marginBottom: getResponsiveHeight(6),
  },
});
