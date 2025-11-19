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
    paddingTop: getResponsiveHeight(20),
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
  modalTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(19)
        : getResponsiveFontSize(22),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? undefined : '700',
    marginBottom: getResponsiveHeight(12.5),
    marginTop: getResponsiveHeight(11),
  },
  modalSubText: {
    textAlign: 'center',
    color: '#999999',
    fontFamily: 'Pretendard-Regular',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(14)
        : getResponsiveFontSize(16),
    lineHeight: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(10),
  },
  contentWrapper: {marginBottom: 10},
  buttonBottom: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 10,
  },
  closeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#F4F6FA',
    borderRadius: 8,
    width: '100%',
    paddingVertical: getResponsiveHeight(14),
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#FFC84D',
    borderRadius: 8,
    width: '100%',
    paddingVertical: getResponsiveHeight(14),
  },
  closeText: {
    color: '#A1A5AF',
    fontWeight: '500',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(16),
  },
  confirmText: {
    color: 'white',
    fontWeight: '500',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(16),
  },
  trashButton: {padding: 4},
  trashIcon: {width: getResponsiveWidth(16), height: getResponsiveHeight(16)},
});
