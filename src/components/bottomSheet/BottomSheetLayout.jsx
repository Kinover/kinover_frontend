// src/components/BottomSheetLayout.js
/* eslint-disable react-native/no-inline-styles */

import React, {useMemo, useCallback, useEffect, useRef, useState} from 'react';
import {Easing} from 'react-native-reanimated';

const DEFAULT_ANIMATION_CONFIGS = {
  duration: 180,
  easing: Easing.out(Easing.cubic),
};
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';
import {getAndroidNavBottomInsetEstimate} from 'utils/layoutMetrics';

import {BOTTOMSHEET_STYLE} from 'styles/style';
import {FONTS} from 'styles/typography';
import {BOTTOM_SHEET_BUTTON_LABELS} from 'constants/bottomSheetTitles';
import SheetHeaderCloseIcon from 'components/bottomSheet/SheetHeaderCloseIcon';

export default function BottomSheetLayout({
  modalRef,

  snapPoints,
  defaultSnapPoints = ['92%'],

  sheetKey,

  useInternalScroll = true,

  enableContentPanningGesture = false,
  animationConfigs = DEFAULT_ANIMATION_CONFIGS,

  keyboardBehavior = 'none',
  keyboardBlurBehavior = 'none',
  androidKeyboardInputMode =
    Platform.OS === 'android' ? 'adjustNothing' : 'adjustNothing',

  enableKeyboardPolicy = true,
  keyboardOpenSnapIndex,
  keyboardCloseSnapIndex = 0,

  onDismiss,
  closeOnPressOutside = true,

  title,
  subtitle,

  headerCentered = false,
  headerAccessory,

  /** 헤더 우측 × — 기본 onPress: 키보드 내리고 modalRef.dismiss */
  showHeaderCloseButton = true,
  onHeaderClosePress,

  children,

  containerStyle,
  headerStyle,
  innerContentStyle,
  contentStyle,

  contentTranslateY,

 // “키보드 떠 있을 때만” 탭으로 내리기
  dismissKeyboardOnPress = true,

  onTouchInside,
  snapToIndexOnTouchInside = false,
  snapIndexOnTouchInside = 0,

  androidBottomPadding,
  disableContentBottomPadding = false,
  onHeaderLayout,

  /** true면 콘텐츠 높이에 맞춰 시트 높이 자동 (snapPoints 무시) */
  enableDynamicSizing = false,
  /** 동적 높이 상한(px). 미지정 시 화면 높이의 약 92% */
  maxDynamicContentSize: maxDynamicContentSizeProp,

}) {
  const styles = useScaledStyleSheet(rf => ({

  container: {
    paddingTop: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(16),
  },

  header: {
    paddingBottom: getResponsiveHeight(6),
  },
  headerCentered: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerBalanceSlot: {
    width: getResponsiveWidth(30),
  },
  titleInRow: {
    flex: 1,
    minWidth: 0,
  },
  headerClosePill: {
    width: getResponsiveWidth(30),
    height: getResponsiveWidth(30),
    borderRadius: getResponsiveWidth(15),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveHeight(-4),
  },
  headerOnlyCloseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: getResponsiveHeight(2),
  },
  title: {
    fontFamily: BOTTOMSHEET_STYLE()?.title?.fontFamily || FONTS.SEMI_BOLD,
    fontSize: BOTTOMSHEET_STYLE()?.title?.fontSize || rf(16),
    color: BOTTOMSHEET_STYLE()?.title?.color || '#111827',
    letterSpacing: -0.2,
  },
  titleCentered: {
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  subtitle: {
    marginTop: getResponsiveHeight(3),
    fontFamily:
      BOTTOMSHEET_STYLE()?.subtitle?.fontFamily || FONTS.MEDIUM,
    fontSize:
      BOTTOMSHEET_STYLE()?.subtitle?.fontSize || rf(12.5),
    color: BOTTOMSHEET_STYLE()?.subtitle?.color || '#6B7280',
    lineHeight: rf(18),
  },
  subtitleCentered: {
    textAlign: 'center',
    alignSelf: 'stretch',
  },

  scrollWrap: {},
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 0,
  },

  animatedContent: {
    minHeight: Platform.OS === 'android' ? 1 : undefined,
  },

  }));
  const insets = useSafeAreaInsets();
  const WINDOW_H = Dimensions.get('window').height;

 // 키보드 높이 추적 → bottomInset 동적 변경으로 시트 전체를 키보드 위로 올림
  const [kbHeight, setKbHeight] = useState(0);

 // Android 시스템 네비게이션 바 높이 fallback (에뮬/실기기 모두 insets가 0이거나 작을 수 있음)
  const ANDROID_SYSTEM_NAV_FALLBACK = getResponsiveHeight(56);
  const IOS_HOME_INDICATOR_MIN = getResponsiveHeight(34);

 /**
 * [지윤이 꿀팁] 안드로이드 하단바 영역 침범 방지
 * - android/app/src/main/res/values/styles.xml 에서
 * android:windowTranslucentNavigation="false" 유지할 것.
 * (켜져 있으면 앱이 하단바까지 투명하게 파고들어 반드시 수동 패딩 필요)
 * - JS 쪽에서는 insets.bottom + fallback(56dp) + ANDROID_FOOTER_BUFFER(16dp) 로
 * contentBottomPad 를 넉넉히 줘서 저장 버튼이 하단바에 가려지지 않게 함.
 */

 /**
 * Android 하단 여백 정책 (중요)
 * - insets.bottom이 0인 경우(에뮬/실기기에서 시스템 네비게이션바 영역 미보고) fallback으로 네비바 높이만큼 여백 확보
 */
  const androidInset = Platform.OS === 'android' ? Number(insets.bottom || 0) : 0;
  const androidInsetByScreen = getAndroidNavBottomInsetEstimate();
  const androidSafeBottom = Math.max(
    androidInset,
    androidInsetByScreen,
    ANDROID_SYSTEM_NAV_FALLBACK,
  );

 // 콘텐츠 하단 패딩: Android fallback, iOS는 홈 인디케이터 최소값
  const baseBottom =
    Platform.OS === 'android'
      ? androidSafeBottom
      : Math.max(Number(insets.bottom || 0), IOS_HOME_INDICATOR_MIN);

 // keyboardBehavior='none'일 때 kbHeight를 bottomInset으로 사용해 시트 전체를 키보드 위로 올림.
 // keyboardBehavior가 다른 값이면 gorhom 자체 처리에 맡김(bottomInset=0 유지).
  const bottomInsetForModal = keyboardBehavior === 'none' ? kbHeight : 0;

  const ANDROID_FOOTER_BUFFER = getResponsiveHeight(16);

 /**
 * contentBottomPad 정책
 * - disableContentBottomPadding이면 0
 * - Android: baseBottom + androidBottomPadding + FOOTER_BUFFER (하단 버튼 영역 가림 방지)
 * - iOS: baseBottom
 */
  const contentBottomPad = useMemo(() => {
    if (disableContentBottomPadding) return 0;

    if (Platform.OS === 'android') {
      const extra =
        typeof androidBottomPadding === 'number' ? Number(androidBottomPadding) : 0;
      return Math.max(0, baseBottom + extra + ANDROID_FOOTER_BUFFER);
    }

    return Math.max(0, baseBottom);
  }, [disableContentBottomPadding, baseBottom, androidBottomPadding]);

  const defaultMaxDynamicContentSize = useMemo(
    () => Math.round(WINDOW_H * 0.92),
    [],
  );
  const maxDynamicContentSize =
    maxDynamicContentSizeProp ?? defaultMaxDynamicContentSize;

  const resolvedSnapPoints = useMemo(() => {
    if (enableDynamicSizing) return [];
    if (Array.isArray(snapPoints) && snapPoints.length > 0) return snapPoints;
    return defaultSnapPoints;
  }, [enableDynamicSizing, snapPoints, defaultSnapPoints]);

  const modalKey = useMemo(() => {
    if (sheetKey != null) return String(sheetKey);
    if (enableDynamicSizing) return 'bs-dynamic';
    return `bs-${(resolvedSnapPoints || []).join('|')}`;
  }, [sheetKey, resolvedSnapPoints, enableDynamicSizing]);

 // 키보드 “보이는 상태” state
  const [keyboardVisible, setKeyboardVisible] = useState(false);

 // 상태 ref들
  const currentIndexRef = useRef(0);
  const beforeKeyboardIndexRef = useRef(0);
  const keyboardOpenRef = useRef(false);

  const isOpenRef = useRef(false);
  const isClosingRef = useRef(false);

  const snapLockRef = useRef(false);
  const snapLockTimerRef = useRef(null);

  const lockSnapBriefly = useCallback(() => {
    snapLockRef.current = true;
    if (snapLockTimerRef.current) clearTimeout(snapLockTimerRef.current);
    snapLockTimerRef.current = setTimeout(() => {
      snapLockRef.current = false;
    }, 220);
  }, []);

  const safeSnapToIndex = useCallback(
    index => {
      if (snapLockRef.current) return;

 // 닫히는 중/닫힘이면 스냅 금지
      if (isClosingRef.current) return;
      if (!isOpenRef.current) return;
      if (currentIndexRef.current === -1) return;

 // 이미 그 인덱스면 또 스냅하지 않기
      if (index === currentIndexRef.current) return;

      const fn = modalRef?.current?.snapToIndex;
      if (typeof fn !== 'function') return;

      lockSnapBriefly();
      fn(index);
    },
    [modalRef, lockSnapBriefly],
  );

  useEffect(() => {
    return () => {
      if (snapLockTimerRef.current) clearTimeout(snapLockTimerRef.current);
    };
  }, []);

  const onChangeIndex = useCallback(index => {
    currentIndexRef.current = index;

    if (index === -1) {
      isOpenRef.current = false;
      isClosingRef.current = false;
      keyboardOpenRef.current = false;

 // 닫힐 때는 즉시 false로 두어도 OK
      setKeyboardVisible(false);
      return;
    }

    isOpenRef.current = true;

 // 키보드가 열려있지 않을 때만 “원래 인덱스” 업데이트
    if (!keyboardOpenRef.current) {
      beforeKeyboardIndexRef.current = index;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    isClosingRef.current = true;
    isOpenRef.current = false;
    keyboardOpenRef.current = false;

    setKeyboardVisible(false);

    onDismiss?.();

    setTimeout(() => {
      isClosingRef.current = false;
    }, 380);
  }, [onDismiss]);

  const handleHeaderClose = useCallback(() => {
    try {
      Keyboard.dismiss();
    } catch {
      null;
    }
    if (typeof onHeaderClosePress === 'function') {
      onHeaderClosePress();
      return;
    }
    modalRef?.current?.dismiss?.();
  }, [modalRef, onHeaderClosePress]);

  const headerCloseIconSize = getResponsiveIconSize(16);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={closeOnPressOutside ? 'close' : 'none'}
      />
    ),
    [closeOnPressOutside],
  );

  const animatedContentStyle = useMemo(() => {
    return [
      styles.animatedContent,
      contentTranslateY ? {transform: [{translateY: contentTranslateY}]} : null,
    ];
  }, [contentTranslateY]);

  const keyboardVisibleTaskRef = useRef(null);
  const scheduleKeyboardVisible = useCallback(next => {
    if (keyboardVisibleTaskRef.current) {
      try {
        keyboardVisibleTaskRef.current.cancel?.();
      } catch (e) {}
      keyboardVisibleTaskRef.current = null;
    }

    keyboardVisibleTaskRef.current = InteractionManager.runAfterInteractions(
      () => {
        keyboardVisibleTaskRef.current = null;
        setKeyboardVisible(next);
      },
    );
  }, []);

  useEffect(() => {
    return () => {
      if (keyboardVisibleTaskRef.current) {
        try {
          keyboardVisibleTaskRef.current.cancel?.();
        } catch (e) {}
        keyboardVisibleTaskRef.current = null;
      }
    };
  }, []);

 // 키보드 정책: kbHeight 업데이트 + keyboardVisible 상태 관리
 // bottomInset=kbHeight가 시트 위치를 처리하므로 snapToIndex 불필요.
  useEffect(() => {
    // iOS는 WillShow/WillHide로 키보드 애니메이션과 시트 이동을 동기화
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = e => {
      keyboardOpenRef.current = true;
      scheduleKeyboardVisible(true);
      beforeKeyboardIndexRef.current = currentIndexRef.current;

      if (!enableKeyboardPolicy) return;
      const h = Number(e?.endCoordinates?.height ?? 0);
      if (h > 0) setKbHeight(h);
    };

    const onHide = () => {
      keyboardOpenRef.current = false;
      scheduleKeyboardVisible(false);

      if (!enableKeyboardPolicy) return;
      setKbHeight(0);
    };

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [enableKeyboardPolicy, scheduleKeyboardVisible]);

  const handleTouchInside = useCallback(() => {
    if (dismissKeyboardOnPress && keyboardOpenRef.current) {
      Keyboard.dismiss();
    }

    if (snapToIndexOnTouchInside) {
      safeSnapToIndex(snapIndexOnTouchInside);
    }

    onTouchInside?.();
  }, [
    dismissKeyboardOnPress,
    snapToIndexOnTouchInside,
    snapIndexOnTouchInside,
    onTouchInside,
    safeSnapToIndex,
  ]);

  const touchWrapperEnabled =
    (dismissKeyboardOnPress && keyboardVisible) ||
    snapToIndexOnTouchInside ||
    !!onTouchInside;

  const containerBoxStyle = useMemo(
    () => [
      styles.container,
      enableDynamicSizing
        ? {flexGrow: 0, alignSelf: 'stretch', maxHeight: WINDOW_H}
        : {flex: 1, maxHeight: WINDOW_H},
      containerStyle,
    ],
    [enableDynamicSizing, WINDOW_H, containerStyle],
  );

  const innerTouchWrapperStyle = enableDynamicSizing
    ? {alignSelf: 'stretch'}
    : {flex: 1};

  const scrollStyle = useMemo(
    () => [
      styles.scrollWrap,
      enableDynamicSizing ? null : {flex: 1},
      innerContentStyle,
    ],
    [enableDynamicSizing, innerContentStyle, styles.scrollWrap],
  );

  const scrollContentContainerStyle = useMemo(
    () => [
      styles.scrollContent,
      enableDynamicSizing ? null : {flexGrow: 1},
      {paddingBottom: contentBottomPad},
      contentStyle,
    ],
    [enableDynamicSizing, contentBottomPad, contentStyle, styles.scrollContent],
  );

  /**
   * Android: 커스텀 탭바(animatedTabBar.jsx)가 zIndex/elevation 9999라서
   * 기본 gorhom 모달 컨테이너보다 위에 그려져 시트가 가려질 수 있음.
   * 가이드 오버레이(99998)보다는 낮게 유지.
   */
  const modalContainerStackingStyle = useMemo(
    () =>
      Platform.OS === 'android'
        ? {zIndex: 10000, elevation: 10000}
        : undefined,
    [],
  );

  const nonScrollContentStyle = useMemo(
    () => [
      animatedContentStyle,
      enableDynamicSizing
        ? {paddingBottom: contentBottomPad, alignSelf: 'stretch'}
        : {flex: 1, paddingBottom: contentBottomPad},
      innerContentStyle,
    ],
    [
      enableDynamicSizing,
      animatedContentStyle,
      contentBottomPad,
      innerContentStyle,
    ],
  );

  return (
    <BottomSheetModal
      key={modalKey}
      ref={modalRef}
      handleIndicatorStyle={{
        width: getResponsiveWidth(48),
        height: getResponsiveHeight(4),
        backgroundColor: 'rgba(156,163,175,0.45)',
      }}
      snapPoints={resolvedSnapPoints}
      enableDynamicSizing={enableDynamicSizing}
      maxDynamicContentSize={
        enableDynamicSizing ? maxDynamicContentSize : undefined
      }
      enableContentPanningGesture={enableContentPanningGesture}
      animationConfigs={animationConfigs}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior={keyboardBlurBehavior}
      androidKeyboardInputMode={androidKeyboardInputMode}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      onChange={onChangeIndex}
      enablePanDownToClose={true}
      bottomInset={bottomInsetForModal}
      containerStyle={modalContainerStackingStyle}>
      <BottomSheetView style={containerBoxStyle}>
        {(title || subtitle || headerAccessory) && (
          <View
            style={[
              styles.header,
              headerStyle,
              headerCentered && styles.headerCentered,
            ]}
            onLayout={e => {
              const h = e?.nativeEvent?.layout?.height ?? 0;
              onHeaderLayout?.(h);
            }}>
            {!!title &&
              (showHeaderCloseButton ? (
                <View style={styles.headerTitleRow}>
                  {headerCentered && <View style={styles.headerBalanceSlot} />}
                  <AppText
                    allowFontScaling={false}
                    numberOfLines={2}
                    style={[
                      styles.title,
                      styles.titleInRow,
                      headerCentered && styles.titleCentered,
                    ]}>
                    {title}
                  </AppText>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={BOTTOM_SHEET_BUTTON_LABELS.CLOSE_SHEET}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    activeOpacity={0.75}
                    style={styles.headerClosePill}
                    onPress={handleHeaderClose}>
                    <SheetHeaderCloseIcon size={headerCloseIconSize} />
                  </TouchableOpacity>
                </View>
              ) : (
                <AppText
                  allowFontScaling={false}
                  style={[
                    styles.title,
                    headerCentered && styles.titleCentered,
                  ]}>
                  {title}
                </AppText>
              ))}
            {!title && showHeaderCloseButton && (
              <View style={styles.headerOnlyCloseRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={BOTTOM_SHEET_BUTTON_LABELS.CLOSE_SHEET}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  activeOpacity={0.75}
                  style={styles.headerClosePill}
                  onPress={handleHeaderClose}>
                  <SheetHeaderCloseIcon size={headerCloseIconSize} />
                </TouchableOpacity>
              </View>
            )}
            {headerAccessory}
            {!!subtitle && (
              <AppText
                allowFontScaling={false}
                style={[
                  styles.subtitle,
                  headerCentered && styles.subtitleCentered,
                ]}>
                {subtitle}
              </AppText>
            )}
          </View>
        )}

        <TouchableWithoutFeedback
          onPress={handleTouchInside}
          accessible={false}
          disabled={!touchWrapperEnabled}>
          <View style={innerTouchWrapperStyle}>
            {useInternalScroll ? (
              <BottomSheetScrollView
                style={scrollStyle}
                contentContainerStyle={scrollContentContainerStyle}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none">
                <Animated.View
                  style={animatedContentStyle}
                  pointerEvents="box-none">
                  {children}
                </Animated.View>
              </BottomSheetScrollView>
            ) : (
              <Animated.View
                style={nonScrollContentStyle}
                pointerEvents="box-none">
                {children}
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

