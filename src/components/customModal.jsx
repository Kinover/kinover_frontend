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
  titleImage, // ✅ 새로 추가
  titleImageStyle, // ✅ 커스텀 스타일도 지원
}) {
  if (!visible) return null;
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
      <View style={styles.overlay}>
        <View style={[styles.modalBox, modalBoxStyle]}>
          {/* 상단 버튼 */}
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
                  style={{
                    width: getResponsiveIconSize(10),
                    height: getResponsiveIconSize(10),
                  }}
                  source={require('@/assets/images/close-yellow.png')}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* ✅ 타이틀 이미지 */}
          {titleImage && (
            <Image
              source={titleImage}
              style={[styles.titleImage, titleImageStyle]}
              resizeMode="contain"
            />
          )}
          {/* ✅ 기본 title / subText */}
          {title && <Text style={styles.modalTitle}>{title}</Text>}
          {subText && <Text style={styles.modalSubText}>{subText}</Text>}
          {/* children 영역 */}
          <View style={[styles.contentWrapper, contentStyle]}>{children}</View>
          {/* 버튼 */}
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
  overlay: {flex: 1, justifyContent: 'center', alignItems: 'center'},

  modalBox: {
    position: 'relative',
    width:
      Platform.OS === 'android'
        ? getResponsiveWidth(300)
        : getResponsiveWidth(280),
    height: 'auto',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: Platform.OS === 'android' ? 25 : 20,
    paddingTop: getResponsiveHeight(18), // ↓ 살짝 줄임
    zIndex: 50,
    elevation: 10,
  },

  topButtonRow: {
    position: 'absolute',
    top: getResponsiveHeight(6),
    right: getResponsiveWidth(15),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },

  modalTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(16) // ← 19 → 16
        : getResponsiveFontSize(18), // ← 22 → 18
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? undefined : '700',
    marginBottom: getResponsiveHeight(10), // ↓ 조정
    marginTop: getResponsiveHeight(10),
  },

  modalSubText: {
    textAlign: 'center',
    color: '#999999',
    fontFamily: 'Pretendard-Regular',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(12.5) // ← 14 → 12.5
        : getResponsiveFontSize(14), // ← 16 → 14
    lineHeight: getResponsiveHeight(18), // ↓ 조정
    marginBottom: getResponsiveHeight(8),
  },

  contentWrapper: {
    marginBottom: 8, // ↓ 여백 축소
  },

  buttonBottom: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 8,
  },

  closeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#F4F6FA',
    borderRadius: 8,
    flex:1,
    paddingVertical: getResponsiveHeight(12), // ↓ 14 → 12
  },

  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FFC84D',
    borderRadius: 8,
    flex:1,
    paddingVertical: getResponsiveHeight(12), // ↓
  },

  closeText: {
    color: '#A1A5AF',
    fontWeight: '500',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14), // ← 16 → 14
  },

  confirmText: {
    color: 'white',
    fontWeight: '500',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14), // ← 16 → 14
  },

  trashButton: {padding: 4},
  trashIcon: {
    width: getResponsiveWidth(14),
    height: getResponsiveHeight(14),
  },

  titleImage: {
    width: getResponsiveWidth(40), // ↓ 부드럽게 줄임
    height: getResponsiveHeight(40),
    alignSelf: 'center',
    marginBottom: getResponsiveHeight(6),
  },
});
