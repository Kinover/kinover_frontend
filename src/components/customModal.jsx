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
  getResponsiveIconSize,
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
  showTrashButton = false,
  onTrashPress,
  showCloseButton = false,
  title,
  subText,
  titleImage,
  titleImageStyle,
}) {
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent>
      <BlurView
        style={[
          StyleSheet.absoluteFill,
          {
            flex: 1,
            position: 'absolute',
            backgroundColor:
              Platform.OS === 'android'
                ? 'rgba(0, 0, 0, 0.12)'
                : 'rgba(0, 0, 0, 0.22)',
          },
        ]}
        blurType="light"
        blurAmount={2}
        reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.4)"
      />

      <View style={styles.overlay}>
        <View style={[styles.modalBox, modalBoxStyle]}>
          {/* 상단 버튼들 */}
          <View
            style={[
              styles.topButtonRow,
              (showTrashButton || showCloseButton) && {
                justifyContent: showTrashButton ? 'space-between' : 'flex-end',
                width: '100%',
              },
            ]}>
            {showTrashButton && (
              <TouchableOpacity
                onPress={onTrashPress}
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
                onPress={onClose}
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
          <View style={[styles.contentWrapper, contentStyle]}>{children}</View>

          {/* 버튼 영역 */}
          <View style={[styles.buttonBottom, buttonBottomStyle]}>
            {closeText && (
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, closeButtonStyle]}>
                <Text style={[styles.closeText, closeTextStyle]}>
                  {closeText}
                </Text>
              </TouchableOpacity>
            )}
            {onConfirm && (
              <TouchableOpacity
                onPress={onConfirm}
                style={[styles.confirmButton, confirmButtonStyle]}>
                <Text style={[styles.confirmText, confirmTextStyle]}>
                  {confirmText}
                </Text>
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
    paddingHorizontal: getResponsiveWidth(26),
    justifyContent: 'center',
    alignItems: 'center',
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

  // 제목
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
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(12.5)
        : getResponsiveFontSize(13),
    lineHeight: getResponsiveHeight(19),
    marginBottom: getResponsiveHeight(10),
  },

  contentWrapper: {
    marginBottom: getResponsiveHeight(14),
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
    backgroundColor: '#F3F4F6',
    borderRadius: 9,
    paddingVertical: getResponsiveHeight(11),
  },

  confirmButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 9,
    paddingVertical: getResponsiveHeight(11),
  },

  closeText: {
    color: '#4B5563',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13.5),
  },

  confirmText: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13.5),
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
