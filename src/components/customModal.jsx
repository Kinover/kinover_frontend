// src/components/CustomModal.jsx
import React, {useMemo} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useSelector} from 'react-redux';
import {FONT_MODE} from 'store/uiSlice';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../utils/responsive';

import {BACKGROUND_COLORS, BUTTON_STYLES} from 'styles/style';
import {hapticLight, hapticMedium, hapticHeavy} from '../utils/haptic';
import DropShadow from 'react-native-drop-shadow';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/**
 * ✅ CustomModal (폰트모드 자동 반영 + 요즘 모션)
 * ✅ width 개선(너비 너무 작아지는 문제 해결)
 * ✅ 헤더-컨텐츠-버튼 간격 통일
 * - margin 기반 간격을 제거하고 "섹션 padding"으로 리듬을 고정
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

  overlayChildren,
  closeOnBackdropPress = true,

  contentTextStyle,

  titleTextStyle,
  subTextStyle,
}) {
  const fontMode = useSelector(state => state.ui.fontMode);

  const fontScale = useMemo(() => {
    if (fontMode === FONT_MODE.EXTRA_LARGE) return 1.12;
    if (fontMode === FONT_MODE.LARGE) return 1.06;
    return 1.0;
  }, [fontMode]);

  const styles = useMemo(() => makeStyles(fontScale), [fontScale]);

  const anim = useMemo(() => new Animated.Value(0), []);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (isMounted) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) setIsMounted(false);
      });
    }
  }, [visible, isMounted, anim]);

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

  const resolvedConfirmText = confirmText ?? '확인';

  const overlayAnimatedStyle = {
    opacity: anim.interpolate({inputRange: [0, 1], outputRange: [0, 1]}),
  };

  const modalAnimatedStyle = {
    opacity: anim.interpolate({inputRange: [0, 1], outputRange: [0, 1]}),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
      {
        scale: anim.interpolate({inputRange: [0, 1], outputRange: [0.96, 1]}),
      },
    ],
  };

  if (!isMounted) return null;

  const hasHeader = !!titleImage || !!title || !!subText;

  return (
    <Modal
      key={`customModal_${fontMode}`}
      animationType="none"
      transparent
      visible={isMounted}
      onRequestClose={handleClosePress}
      presentationStyle="overFullScreen"
      statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={2}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.35)"
          />

          {overlayChildren ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {overlayChildren}
            </View>
          ) : null}

          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View style={modalAnimatedStyle}>
              <DropShadow style={styles.dropShadow}>
                <View style={[styles.modalBox, modalBoxStyle]}>
                  <View style={styles.topActionRow}>
                    {showTrashButton && (
                      <TouchableOpacity
                        onPress={handleTrashPress}
                        style={styles.iconButton}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        activeOpacity={0.85}>
                        <Image
                          source={require('@/assets/images/trash.png')}
                          style={styles.icon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}

                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={handleClosePress}
                        style={styles.iconButton}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        activeOpacity={0.85}>
                        <Image
                          style={styles.icon}
                          source={require('@/assets/images/close-yellow.png')}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* ✅ 헤더 섹션 */}
                  {hasHeader ? (
                    <View style={styles.headerSection}>
                      {titleImage && (
                        <Image
                          source={titleImage}
                          style={[styles.titleImage, titleImageStyle]}
                          resizeMode="contain"
                        />
                      )}

                      {!!title && (
                        <Text
                          allowFontScaling={false}
                          style={[styles.modalTitle, titleTextStyle]}>
                          {title}
                        </Text>
                      )}

                      {!!subText && (
                        <Text
                          allowFontScaling={false}
                          style={[styles.modalSubText, subTextStyle]}>
                          {subText}
                        </Text>
                      )}
                    </View>
                  ) : null}

                  {/* ✅ 컨텐츠 섹션 (헤더↔컨텐츠, 컨텐츠↔버튼 간격 동일 리듬) */}
                  {children ? (
                    <View style={[styles.contentSection, contentStyle]}>
                      {children}
                      {contentTextStyle ? (
                        <Text
                          style={[styles.modalContentText, contentTextStyle]}
                        />
                      ) : null}
                    </View>
                  ) : null}

                  {/* ✅ 버튼 섹션 */}
                  <View style={[styles.buttonSection]}>
                    <View style={[styles.buttonBottom, buttonBottomStyle]}>
                      {!!closeText && (
                        <TouchableOpacity
                          onPress={handleClosePress}
                          style={[styles.closeButton, closeButtonStyle]}
                          activeOpacity={0.88}>
                          <Text
                            allowFontScaling={false}
                            style={[styles.closeText, closeTextStyle]}>
                            {closeText}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {!!onConfirm && (
                        <TouchableOpacity
                          onPress={handleConfirmPress}
                          style={[styles.confirmButton, confirmButtonStyle]}
                          activeOpacity={0.88}>
                          <Text
                            allowFontScaling={false}
                            style={[styles.confirmText, confirmTextStyle]}>
                            {resolvedConfirmText}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </DropShadow>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const BASE_FONT = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
};

const ANDROID_TEXT_FIX =
  Platform.OS === 'android' ? {includeFontPadding: false} : null;

function makeStyles(fontScale) {
  const RADIUS = 22;
  const BTN_HEIGHT = getResponsiveHeight(46);
  const ICON_BTN_SIZE = getResponsiveWidth(34);
  const BTN_RADIUS = getResponsiveWidth(14);

  // ✅ 너비 정책
  const MAX_WIDTH = 420;
  const MIN_SIDE_GAP = 32;

  const computedWidth = Math.min(
    MAX_WIDTH,
    Math.max(0, SCREEN_WIDTH - MIN_SIDE_GAP * 2),
  );

  // ✅ 헤더↔컨텐츠, 컨텐츠↔버튼 간격 통일 값 (여기만 조절하면 리듬이 바뀜)
  const SECTION_GAP = getResponsiveHeight(14);

  return StyleSheet.create({
    overlay: {
      flex: 1,
      paddingHorizontal: getResponsiveWidth(12),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: BACKGROUND_COLORS.overlayBg,
    },

    dropShadow: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 10},
      shadowOpacity: Platform.OS === 'android' ? 0.16 : 0.12,
      shadowRadius: Platform.OS === 'android' ? 18 : 24,
    },

    modalBox: {
      width: computedWidth,
      backgroundColor: '#FFFFFF',
      borderRadius: RADIUS,

      paddingHorizontal: getResponsiveWidth(18),
      paddingTop: getResponsiveHeight(18),
      paddingBottom: getResponsiveHeight(16),

      ...(Platform.OS === 'ios'
        ? {
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 10},
            shadowOpacity: 0.08,
            shadowRadius: 18,
          }
        : null),

      elevation: 0,
      overflow: 'visible',
      borderWidth: 1,
      borderColor: 'rgba(17,24,39,0.06)',
    },

    topActionRow: {
      position: 'absolute',
      top: getResponsiveHeight(12),
      right: getResponsiveWidth(12),
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveWidth(8),
      zIndex: 10,
    },

    iconButton: {
      width: ICON_BTN_SIZE,
      height: ICON_BTN_SIZE,
      borderRadius: 999,
      backgroundColor: 'rgba(17,24,39,0.06)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    icon: {
      width: getResponsiveIconSize(14),
      height: getResponsiveIconSize(14),
      opacity: 0.9,
    },

    /* =========================================================
     * ✅ 섹션 기반 레이아웃 (간격 통일의 핵심)
     * - headerSection: 아래로 SECTION_GAP
     * - contentSection: 아래로 SECTION_GAP
     * - buttonSection: paddingTop = 0 (섹션에서 이미 간격을 만들어줌)
     * ========================================================= */

    headerSection: {
      paddingTop: getResponsiveHeight(10),
      paddingBottom: SECTION_GAP,
    },

    contentSection: {
      paddingTop: 0,
      paddingBottom: SECTION_GAP,
    },

    buttonSection: {
      paddingTop: 0,
    },

    titleImage: {
      width: getResponsiveWidth(46),
      height: getResponsiveHeight(46),
      alignSelf: 'center',
      marginBottom: getResponsiveHeight(8),
    },

    modalTitle: {
      color: '#111827',
      fontSize: getResponsiveFontSize(18) * fontScale,
      lineHeight: Math.round(getResponsiveFontSize(24) * fontScale),
      textAlign: 'center',
      fontFamily: BASE_FONT.semibold,
      marginTop: 0,
      marginBottom: getResponsiveHeight(6),
      ...(ANDROID_TEXT_FIX || {}),
    },

    modalSubText: {
      textAlign: 'center',
      color: '#6B7280',
      fontFamily: BASE_FONT.regular,
      fontSize: getResponsiveFontSize(13) * fontScale,
      lineHeight: Math.round(getResponsiveFontSize(18) * fontScale),
      marginBottom: 0,
      ...(ANDROID_TEXT_FIX || {}),
    },

    modalContentText: {
      color: '#374151',
      fontFamily: BASE_FONT.regular,
      fontSize: getResponsiveFontSize(14) * fontScale,
      lineHeight: Math.round(getResponsiveFontSize(20) * fontScale),
      ...(ANDROID_TEXT_FIX || {}),
    },

    buttonBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: getResponsiveWidth(10),
      paddingTop: 0,
    },

    closeButton: {
      flex: 1,
      height: BTN_HEIGHT,
      borderRadius: BTN_RADIUS,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },

    confirmButton: {
      flex: 1,
      height: BTN_HEIGHT,
      borderRadius: BTN_RADIUS,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: BUTTON_STYLES().saveBg,
      borderWidth: 1,
      borderColor: BUTTON_STYLES().saveBg,
    },

    closeText: {
      color: '#111827',
      fontFamily: BASE_FONT.medium,
      fontSize:
        BUTTON_STYLES()?.fontSize != null
          ? BUTTON_STYLES().fontSize * fontScale
          : getResponsiveFontSize(14) * fontScale,
      ...(ANDROID_TEXT_FIX || {}),
    },

    confirmText: {
      color: '#FFFFFF',
      fontFamily: BASE_FONT.medium,
      fontSize:
        BUTTON_STYLES()?.fontSize != null
          ? BUTTON_STYLES().fontSize * fontScale
          : getResponsiveFontSize(14) * fontScale,
      ...(ANDROID_TEXT_FIX || {}),
    },
  });
}
