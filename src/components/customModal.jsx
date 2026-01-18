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

import {hapticLight, hapticMedium, hapticHeavy} from '../utils/haptic';

/**
 * ✅ CustomModal 개선 포인트
 * - 모달 내부 폰트: Pretendard로 통일 (버튼도 포함)
 * - Android 텍스트 여백(includeFontPadding) 제거
 * - confirmText 기본값 제공
 * - children 본문 텍스트용 기본 스타일(contentTextStyle) 제공
 */
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

  // ✅ 모달 박스 "밖"에서 렌더될 레이어
  overlayChildren,

  // ✅ 추가: backdrop 눌렀을 때 닫힐지 (원치 않을 때 false)
  closeOnBackdropPress = true,

  // ✅ 추가: 본문 텍스트용 기본 스타일(자동 강제는 못 하니까, 쓰기 쉽게 제공)
  contentTextStyle,
}) {
  if (!visible) return null;

  const handleBackdropPress = () => {
    if (!closeOnBackdropPress) return;
    hapticLight();
    onClose?.();
  };

  const handleClosePress = () => {
    hapticLight();
    onClose?.();
  };

  const handleConfirmPress = () => {
    hapticMedium();
    onConfirm?.();
  };

  const handleTrashPress = () => {
    hapticHeavy();
    onTrashPress?.();
  };

  // ✅ confirmText가 안 들어오면 기본값
  const resolvedConfirmText = confirmText ?? '확인';

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
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={2}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"
          />

          {/* ✅ 모달 박스 밖(화면 전체) 레이어 */}
          {overlayChildren ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {overlayChildren}
            </View>
          ) : null}

          {/* 🔹 모달 박스는 탭해도 닫히지 않도록 */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.modalBox, modalBoxStyle]}>
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

              {titleImage && (
                <Image
                  source={titleImage}
                  style={[styles.titleImage, titleImageStyle]}
                  resizeMode="contain"
                />
              )}

              {!!title && <Text style={styles.modalTitle}>{title}</Text>}
              {!!subText && <Text style={styles.modalSubText}>{subText}</Text>}

              {/* ✅ children 영역: 모달이 폰트를 “강제”하진 못함.
                  대신 contentTextStyle을 내려서 children Text에 쉽게 적용하도록 유도. */}
              <View style={[styles.contentWrapper, contentStyle]}>
                {/* 필요하면 children에서 아래처럼 쓰면 됨:
                    <Text style={[styles.modalContentText, contentTextStyle]}>...</Text>
                */}
                {children}
              </View>

              <View style={[styles.buttonBottom, buttonBottomStyle]}>
                {!!closeText && (
                  <TouchableOpacity
                    onPress={handleClosePress}
                    style={[styles.closeButton, closeButtonStyle]}
                    activeOpacity={0.85}>
                    <Text style={[styles.closeText, closeTextStyle]}>
                      {closeText}
                    </Text>
                  </TouchableOpacity>
                )}

                {!!onConfirm && (
                  <TouchableOpacity
                    onPress={handleConfirmPress}
                    style={[styles.confirmButton, confirmButtonStyle]}
                    activeOpacity={0.85}>
                    <Text style={[styles.confirmText, confirmTextStyle]}>
                      {resolvedConfirmText}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ✅ 필요하면 본문 기본 텍스트를 여기 스타일로 쓰라고 제공 */}
              {/* styles.modalContentText를 외부에서 import해서 써도 됨 */}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const BASE_FONT = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
};

const ANDROID_TEXT_FIX = Platform.OS === 'android' ? {includeFontPadding: false} : null;

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

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 16,

    // Android elevation
    elevation: 10,
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
    fontFamily: BASE_FONT.medium,
    marginTop: getResponsiveHeight(8),
    marginBottom: getResponsiveHeight(6),
    ...(ANDROID_TEXT_FIX || {}),
  },

  modalSubText: {
    textAlign: 'center',
    color: '#6B7280',
    fontFamily: BASE_FONT.regular,
    fontSize: getResponsiveFontSize(12.5),
    lineHeight: getResponsiveHeight(17),
    marginBottom: getResponsiveHeight(10),
    ...(ANDROID_TEXT_FIX || {}),
  },

  // ✅ children에서 본문 Text에 쓰라고 제공하는 기본 스타일
  modalContentText: {
    color: '#374151',
    fontFamily: BASE_FONT.regular,
    fontSize: getResponsiveFontSize(13.5),
    lineHeight: getResponsiveHeight(19),
    ...(ANDROID_TEXT_FIX || {}),
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

  // ✅ 버튼 텍스트: 모달 내부에서는 Pretendard로 통일 (BUTTON_STYLES에 의존 X)
  closeText: {
    color: '#4B5563',
    fontFamily: BASE_FONT.medium,
    fontSize:
      BUTTON_STYLES?.fontSize != null
        ? BUTTON_STYLES.fontSize
        : getResponsiveFontSize(14),
    ...(ANDROID_TEXT_FIX || {}),
  },

  confirmText: {
    color: '#FFFFFF',
    fontFamily: BASE_FONT.medium,
    fontSize:
      BUTTON_STYLES?.fontSize != null
        ? BUTTON_STYLES.fontSize
        : getResponsiveFontSize(14),
    ...(ANDROID_TEXT_FIX || {}),
  },

  trashButton: {padding: 4},
  trashIcon: {
    width: getResponsiveWidth(16),
    height: getResponsiveHeight(16),
  },

  closeXButton: {padding: 6},
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
