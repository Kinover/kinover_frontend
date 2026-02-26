// src/components/BottomSheetLayout.js
/* eslint-disable react-native/no-inline-styles */

import React, {useMemo, useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  InteractionManager,
} from 'react-native';

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
} from 'utils/responsive';

import {BOTTOMSHEET_STYLE, COLORS} from 'styles/style';

export default function BottomSheetLayout({
  modalRef,

  snapPoints,
  defaultSnapPoints = ['92%'],

  sheetKey,

  useInternalScroll = true,

  enableContentPanningGesture = false,
  animationConfigs,

  keyboardBehavior = Platform.OS === 'ios' ? 'interactive' : 'none',
  androidKeyboardInputMode =
    Platform.OS === 'android' ? 'adjustResize' : 'adjustNothing',

  enableKeyboardPolicy = true,
  keyboardOpenSnapIndex,
  keyboardCloseSnapIndex = 0,

  onDismiss,
  closeOnPressOutside = true,

  title,
  subtitle,

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
}) {
  const insets = useSafeAreaInsets();
  const WINDOW_H = Dimensions.get('window').height;

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

  const androidFallback =
    Platform.OS === 'android' && androidInset === 0 ? ANDROID_SYSTEM_NAV_FALLBACK : 0;

 // 콘텐츠 하단 패딩: Android fallback, iOS는 홈 인디케이터 최소값
  const baseBottom =
    Platform.OS === 'android'
      ? Math.max(androidInset + androidFallback, ANDROID_SYSTEM_NAV_FALLBACK)
      : Math.max(Number(insets.bottom || 0), IOS_HOME_INDICATOR_MIN);

 // 모달 자체가 “시스템 네비게이션 바” 위에서 끝나도록 (탭바는 가려도 OK, 시스템 바에는 안 가리게)
 // 시트가 화면 맨 아래까지 내려가게 해서 시트 배경이 하단까지 하얗게 채워지도록 (bottomInset 0)
  const bottomInsetForModal = 0;

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

  const resolvedSnapPoints = useMemo(() => {
    if (Array.isArray(snapPoints) && snapPoints.length > 0) return snapPoints;
    return defaultSnapPoints;
  }, [snapPoints, defaultSnapPoints]);

  const modalKey = useMemo(() => {
    if (sheetKey != null) return String(sheetKey);
    return `bs-${(resolvedSnapPoints || []).join('|')}`;
  }, [sheetKey, resolvedSnapPoints]);

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

 // 키보드 정책
  useEffect(() => {
    if (!enableKeyboardPolicy) return;

    const openIndex =
      typeof keyboardOpenSnapIndex === 'number'
        ? keyboardOpenSnapIndex
        : Math.max((resolvedSnapPoints?.length || 1) - 1, 0);

    const shouldSkip = () => {
      if (isClosingRef.current) return true;
      if (!isOpenRef.current) return true;
      if (currentIndexRef.current === -1) return true;
      return false;
    };

    const onShow = () => {
      keyboardOpenRef.current = true;

 // 여기서 setState 즉시 호출 금지 → 인터랙션 끝난 뒤 반영
      scheduleKeyboardVisible(true);

      beforeKeyboardIndexRef.current = currentIndexRef.current;

      if (shouldSkip()) return;

      if (Platform.OS === 'android') {
        requestAnimationFrame(() => {
          if (shouldSkip()) return;
          safeSnapToIndex(openIndex);
        });
      }
    };

    const onHide = () => {
      keyboardOpenRef.current = false;

 // 여기서도 setState 즉시 호출 금지
      scheduleKeyboardVisible(false);

      if (shouldSkip()) return;

      const restoreIndex =
        beforeKeyboardIndexRef.current ?? keyboardCloseSnapIndex;

 // 리사이즈/상호작용 끝난 뒤에 복귀
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          if (shouldSkip()) return;
          safeSnapToIndex(restoreIndex);
        });
      });
    };

    const subShow = Keyboard.addListener('keyboardDidShow', onShow);
    const subHide = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [
    enableKeyboardPolicy,
    keyboardOpenSnapIndex,
    keyboardCloseSnapIndex,
    resolvedSnapPoints,
    safeSnapToIndex,
    scheduleKeyboardVisible,
  ]);

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

  return (
    <BottomSheetModal
      key={modalKey}
      ref={modalRef}
      handleIndicatorStyle={{
        width: getResponsiveHeight(35),
        backgroundColor: COLORS.textTertiary,
      }}
      snapPoints={resolvedSnapPoints}
      enableDynamicSizing={false}
      enableContentPanningGesture={enableContentPanningGesture}
      animationConfigs={animationConfigs}
      keyboardBehavior={keyboardBehavior}
      androidKeyboardInputMode={androidKeyboardInputMode}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      onChange={onChangeIndex}
      enablePanDownToClose={true}
      bottomInset={bottomInsetForModal}>
      <BottomSheetView
        style={[
          styles.container,
          {flex: 1, maxHeight: WINDOW_H},
          containerStyle,
        ]}>
        {(title || subtitle) && (
          <View
            style={[styles.header, headerStyle]}
            onLayout={e => {
              const h = e?.nativeEvent?.layout?.height ?? 0;
              onHeaderLayout?.(h);
            }}>
            {!!title && (
              <Text allowFontScaling={false} style={styles.title}>
                {title}
              </Text>
            )}
            {!!subtitle && (
              <Text allowFontScaling={false} style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        <TouchableWithoutFeedback
          onPress={handleTouchInside}
          accessible={false}
          disabled={!touchWrapperEnabled}>
          <View style={{flex: 1}}>
            {useInternalScroll ? (
              <BottomSheetScrollView
                style={[styles.scrollWrap, {flex: 1}, innerContentStyle]}
                contentContainerStyle={[
                  styles.scrollContent,
                  {flexGrow: 1},
                  {paddingBottom: contentBottomPad},
                  contentStyle,
                ]}
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
                style={[
                  animatedContentStyle,
                  {flex: 1, paddingBottom: contentBottomPad},
                  innerContentStyle,
                ]}
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

const styles = StyleSheet.create({
  container: {
    paddingTop: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(16),
  },

  header: {
    paddingBottom: getResponsiveHeight(6),
  },
  title: {
    fontFamily: BOTTOMSHEET_STYLE()?.title?.fontFamily || 'Pretendard-SemiBold',
    fontSize: BOTTOMSHEET_STYLE()?.title?.fontSize || getResponsiveFontSize(16),
    color: BOTTOMSHEET_STYLE()?.title?.color || '#111827',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: getResponsiveHeight(3),
    fontFamily:
      BOTTOMSHEET_STYLE()?.subtitle?.fontFamily || 'Pretendard-Medium',
    fontSize:
      BOTTOMSHEET_STYLE()?.subtitle?.fontSize || getResponsiveFontSize(12.5),
    color: BOTTOMSHEET_STYLE()?.subtitle?.color || '#6B7280',
    lineHeight: getResponsiveFontSize(18),
  },

  scrollWrap: {},
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 0,
  },

  animatedContent: {
    minHeight: Platform.OS === 'android' ? 1 : undefined,
  },
});
