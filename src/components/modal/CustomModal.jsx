// src/components/CustomModal.jsx
import React, {useMemo, useEffect, useState, useCallback, useRef} from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Platform, Image, Animated, Easing, Dimensions, Pressable } from 'react-native';
import DropShadow from 'react-native-drop-shadow';
import {FONT_MODE} from 'store/uiSlice';
import {useReduxFontMode} from 'hooks/useReduxFontMode';

import AppText from 'components/AppText';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';
import {hapticLight, hapticMedium} from 'utils/haptic';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export default function CustomModal({
  visible,

 /** 왼쪽 버튼(취소/이전 등) */
  onClose,

 /** 오른쪽 버튼(확인/다음 등) */
  onConfirm,

 /** 진짜 닫기: X 버튼 / 바깥 탭 / Android back */
  onRequestClose,

  children,
  title,
  subText,

  closeText,
  confirmText = '확인',

  showCloseButton = true,
  closeOnBackdropPress = true,
  /** false면 Android 하드웨어 뒤로가기로 닫히지 않음 */
  hardwareBackCloses = true,

 /** 추가: 타이틀 아이콘 */
  titleImage,
  titleImageStyle,

 /** 추가: 버튼 컨테이너 스타일 오버라이드 */
  closeButtonStyle,
  confirmButtonStyle,

 /** subText 위치 */
  subTextPlacement = 'title',

 /** overlay 레벨 요소 */
  overlayChildren,
  /** 모달 박스 바깥(아래) 영역 */
  footerOutside,

 /** 기존 오버라이드 */
  modalBoxStyle,
  contentStyle,
  subTextStyle,
  closeTextStyle,
  confirmTextStyle,
  buttonBottomStyle,

 /** 모달 래퍼(중앙 정렬된 박스)에 적용 - 가이드 모달 등 하단 여백용 */
  modalWrapperStyle,

 /** false면 DropShadow 대신 View 사용 (가이드 모달 등 성능 이슈 시) */
  useShadow = true,

 /** true면 Modal 대신 View 오버레이 사용 (iOS/Android 닫은 뒤 탭 터치 막힘 방지) */
  useViewOverlayOnIOS = false,
}) {
  const fontMode = useReduxFontMode();

  const fontScale = useMemo(() => {
    if (fontMode === FONT_MODE.EXTRA_LARGE) return 1.12;
    if (fontMode === FONT_MODE.LARGE) return 1.06;
    return 1;
  }, [fontMode]);

  const styles = useMemo(() => makeStyles(fontScale), [fontScale]);

 // Animated.Value는 "한 번만" 만들기 (불필요한 new 방지)
  const animRef = useRef(null);
  if (!animRef.current) {
    animRef.current = new Animated.Value(0);
  }
  const anim = animRef.current;

  const [mounted, setMounted] = useState(false);

 // 현재 실행 중 애니메이션 핸들 관리 (중복 start 방지)
  const runningAnimRef = useRef(null);

  const stopRunningAnim = useCallback(() => {
    try {
      if (
        runningAnimRef.current &&
        typeof runningAnimRef.current.stop === 'function'
      ) {
        runningAnimRef.current.stop();
      }
    } catch {}
    runningAnimRef.current = null;
  }, []);

 // visible 변화에만 반응 (mounted deps 제거)
  useEffect(() => {
    let cancelled = false;

    stopRunningAnim();

    if (visible) {
 // 열기: 먼저 mount → 애니메이션
      setMounted(true);

 // 다음 tick에서 애니메이션(레이아웃/삽입 타이밍과 충돌 줄임)
      const id = setTimeout(() => {
        if (cancelled) return;

        const a = Animated.timing(anim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });

        runningAnimRef.current = a;
        a.start(() => {
          runningAnimRef.current = null;
        });
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(id);
        stopRunningAnim();
      };
    }

 // 닫기: mounted 되어있을 때만 닫기 애니메이션
    if (mounted) {
      const a = Animated.timing(anim, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });

      runningAnimRef.current = a;
      a.start(() => {
        runningAnimRef.current = null;
        if (cancelled) return;
        setMounted(false);
      });
    } else {
 // mounted가 아니면 애니메이션 필요 없음
      anim.setValue(0);
    }

    return () => {
      cancelled = true;
      stopRunningAnim();
    };
 // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, stopRunningAnim]); // mounted를 deps에 넣지 않음

  const overlayStyle = useMemo(() => ({opacity: anim}), [anim]);

  const modalStyle = useMemo(
    () => ({
      opacity: anim,
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
        },
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.98, 1],
          }),
        },
      ],
    }),
    [anim],
  );

 /** 진짜 닫기 */
  const requestClose = useCallback(() => {
    hapticLight();
    if (onRequestClose) return onRequestClose();
    return onClose?.();
  }, [onRequestClose, onClose]);

  const handleHardwareBack = useCallback(() => {
    if (!hardwareBackCloses) return;
    requestClose();
  }, [hardwareBackCloses, requestClose]);

  const handleBackdropPress = useCallback(() => {
    if (!closeOnBackdropPress) return;
    requestClose();
  }, [closeOnBackdropPress, requestClose]);

  const handleLeftPress = useCallback(() => {
    hapticLight();
    onClose?.();
  }, [onClose]);

  const handleRightPress = useCallback(() => {
    hapticMedium();
    onConfirm?.();
  }, [onConfirm]);

  const overlayPointerEvents = visible ? 'auto' : 'none';

  const useViewOverlay = !!useViewOverlayOnIOS;

  if (!mounted) return null;

  const renderSubText = placement => {
    if (!subText) return null;
    if (subTextPlacement !== placement) return null;

    const extraStyle =
      placement === 'content'
        ? {marginTop: getResponsiveHeight(10), marginBottom: 0}
        : null;

    return (
      <AppText
        style={[styles.subText, extraStyle, subTextStyle]}
        allowFontScaling={false}>
        {subText}
      </AppText>
    );
  };

  const innerContent = (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      pointerEvents={overlayPointerEvents}>
      <View style={styles.dim} />

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleBackdropPress}
        disabled={!closeOnBackdropPress}
        pointerEvents={overlayPointerEvents}
      />

      <Animated.View
        style={[modalStyle, styles.modalOuter, modalWrapperStyle]}
        pointerEvents="box-none">
        {useShadow ? (
          <DropShadow style={styles.shadow}>
            <View style={[styles.modalBox, modalBoxStyle]} pointerEvents="auto">
              {showCloseButton && (
                <TouchableOpacity
                  onPress={requestClose}
                  style={styles.closeIconBtn}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  activeOpacity={0.85}>
                  <Image
                    source={require('@/assets/modal/closeX.png')}
                    style={styles.closeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}

              {!!titleImage && (
                <Image
                  source={titleImage}
                  style={[styles.titleImage, titleImageStyle]}
                  resizeMode="contain"
                />
              )}

              {!!title && (
                <AppText style={styles.title} allowFontScaling={false}>
                  {title}
                </AppText>
              )}

              {renderSubText('title')}

              {!!children && (
                <View style={[styles.content, contentStyle]} pointerEvents="auto">
                  {children}
                </View>
              )}

              {renderSubText('content')}

              <View style={[styles.buttonRow, buttonBottomStyle]}>
                {!!closeText && (
                  <TouchableOpacity
                    onPress={handleLeftPress}
                    style={[styles.leftBtn, closeButtonStyle]}
                    activeOpacity={0.9}>
                    <AppText
                      style={[styles.leftText, closeTextStyle]}
                      allowFontScaling={false}>
                      {closeText}
                    </AppText>
                  </TouchableOpacity>
                )}

                {!!onConfirm && (
                  <TouchableOpacity
                    onPress={handleRightPress}
                    style={[styles.rightBtn, confirmButtonStyle]}
                    activeOpacity={0.9}>
                    <AppText
                      style={[styles.rightText, confirmTextStyle]}
                      allowFontScaling={false}>
                      {confirmText}
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </DropShadow>
        ) : (
          <View style={[styles.modalBox, modalBoxStyle]} pointerEvents="auto">
            {showCloseButton && (
              <TouchableOpacity
                onPress={requestClose}
                style={styles.closeIconBtn}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                activeOpacity={0.85}>
                <Image
                  source={require('@/assets/modal/closeX.png')}
                  style={styles.closeIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}

            {!!titleImage && (
              <Image
                source={titleImage}
                style={[styles.titleImage, titleImageStyle]}
                resizeMode="contain"
              />
            )}

            {!!title && (
              <AppText style={styles.title} allowFontScaling={false}>
                {title}
              </AppText>
            )}

            {renderSubText('title')}

            {!!children && (
              <View style={[styles.content, contentStyle]} pointerEvents="auto">
                {children}
              </View>
            )}

            {renderSubText('content')}

            <View style={[styles.buttonRow, buttonBottomStyle]}>
              {!!closeText && (
                <TouchableOpacity
                  onPress={handleLeftPress}
                  style={[styles.leftBtn, closeButtonStyle]}
                  activeOpacity={0.9}>
                  <AppText
                    style={[styles.leftText, closeTextStyle]}
                    allowFontScaling={false}>
                    {closeText}
                  </AppText>
                </TouchableOpacity>
              )}

              {!!onConfirm && (
                <TouchableOpacity
                  onPress={handleRightPress}
                  style={[styles.rightBtn, confirmButtonStyle]}
                  activeOpacity={0.9}>
                  <AppText
                    style={[styles.rightText, confirmTextStyle]}
                    allowFontScaling={false}>
                    {confirmText}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {!!footerOutside && (
          <View style={styles.footerOutsideWrap} pointerEvents="box-none">
            {footerOutside}
          </View>
        )}
      </Animated.View>

      {!!overlayChildren && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {overlayChildren}
        </View>
      )}
    </Animated.View>
  );

  if (useViewOverlay) {
    return (
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {zIndex: 99999, elevation: 99999},
        ]}
        pointerEvents="box-none">
        {innerContent}
      </View>
    );
  }

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={handleHardwareBack}>
      {innerContent}
    </Modal>
  );
}

function makeStyles(fontScale) {
  const width = Math.min(350, SCREEN_WIDTH - 56);
  const dimColor = 'rgba(0,0,0,0.56)';

  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    /** 오버레이 가로 중앙: DropShadow(자식)이 화면 전체 너비로 펼쳐질 때 박스가 왼쪽으로 치우치는 현상 방지 */
    modalOuter: {
      width: '100%',
      alignItems: 'center',
    },
    footerOutsideWrap: {
      marginTop: getResponsiveHeight(10),
      alignItems: 'center',
      justifyContent: 'center',
    },
    dim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: dimColor,
    },
    shadow: {
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: {width: 0, height: 10},
    },
    modalBox: {
      width,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: getResponsiveWidth(18),
      paddingTop: getResponsiveHeight(18),
      paddingBottom: getResponsiveHeight(16),
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.04)',
    },

    closeIconBtn: {
      position: 'absolute',
      top: getResponsiveHeight(10),
      right: getResponsiveWidth(10),
      width: getResponsiveWidth(32),
      height: getResponsiveWidth(32),
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    closeIcon: {
      width: getResponsiveIconSize(14),
      height: getResponsiveIconSize(14),
      tintColor: '#111827',
      opacity: 0.9,
    },

    titleImage: {
      width: getResponsiveIconSize(48),
      height: getResponsiveIconSize(48),
      alignSelf: 'center',
      marginTop: getResponsiveHeight(4),
    },

    title: {
      textAlign: 'center',
      fontSize: getResponsiveFontSize(18) * fontScale,
      lineHeight: getResponsiveFontSize(24) * fontScale,
      fontFamily: 'Pretendard-SemiBold',
      color: '#111827',
      marginTop: getResponsiveHeight(15),
      marginBottom: getResponsiveHeight(10),
      ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
    },
    subText: {
      textAlign: 'center',
      fontSize: getResponsiveFontSize(13.5) * fontScale,
      lineHeight: getResponsiveFontSize(20) * fontScale,
      fontFamily: 'Pretendard-Regular',
      color: '#6B7280',
      marginBottom: getResponsiveHeight(12),
      paddingHorizontal: getResponsiveWidth(6),
      ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
    },

    content: {},

    buttonRow: {
      flexDirection: 'row',
      gap: getResponsiveWidth(14),
      marginTop: getResponsiveHeight(10),
    },

    leftBtn: {
      flex: 1,
      height: getResponsiveHeight(46),
      borderRadius: getResponsiveWidth(12),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rightBtn: {
      flex: 1,
      height: getResponsiveHeight(46),
      borderRadius: getResponsiveWidth(12),
      backgroundColor: 'black',
      borderWidth: 1,
      borderColor: 'black',
      alignItems: 'center',
      justifyContent: 'center',
    },
    leftText: {
      fontFamily: 'Pretendard-Medium',
      fontSize: getResponsiveFontSize(14) * fontScale,
      color: '#111827',
      ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
    },
    rightText: {
      fontFamily: 'Pretendard-Medium',
      fontSize: getResponsiveFontSize(14) * fontScale,
      color: '#FFFFFF',
      ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
    },
  });
}
