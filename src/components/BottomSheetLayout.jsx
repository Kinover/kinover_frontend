// src/components/BottomSheetLayout.js

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Keyboard,
} from 'react-native';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KinoBottomSheet} from './KinoBottomSheet';
import {BottomSheetButtons} from 'components/BottomSheetButtons';
import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';
import {BOTTOMSHEET_STYLE} from 'styles/style';

export default function BottomSheetLayout({
  modalRef,
  snapPoints,
  enableContentPanningGesture = false,
  animationConfigs,
  keyboardBehavior = 'none',
  androidKeyboardInputMode = 'adjustNothing',
  // ✅ dynamic snap points용 (useBottomSheetDynamicSnapPoints에서 받아옴)
  handleHeight,
  contentHeight,
  onContentLayout, // ✅ 여기 중요

  title,
  subtitle,
  children,

  footerProps,
  containerStyle,
  headerStyle,
  innerContentStyle,
  footerStyle,
  contentStyle,

  // ✅ children만 올릴 translateY
  contentTranslateY,
}) {
  const insets = useSafeAreaInsets();

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardOpen(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardOpen(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const injectedFooterProps = footerProps
    ? {
        ...footerProps,
        bottomSheetRef: modalRef,
        autoCloseOnSave:
          footerProps.autoCloseOnSave !== undefined
            ? footerProps.autoCloseOnSave
            : true,
      }
    : undefined;

  // ✅ A버전: 1) 키보드 열려있으면 키보드만 내림
  //         2) 키보드 닫혀있으면 바텀시트 닫기
  const onPressOutside = useCallback(() => {
    if (keyboardOpen) {
      Keyboard.dismiss();
      return;
    }

    // BottomSheetModal이면 dismiss가 더 정확할 때가 많고,
    // BottomSheet(ref close)면 close가 먹는 구조도 있어서 둘 다 안전하게 호출
    modalRef?.current?.dismiss?.();
    modalRef?.current?.close?.();
  }, [keyboardOpen, modalRef]);

  return (
    <KinoBottomSheet
      modalRef={modalRef}
      snapPoints={snapPoints}
      enableContentPanningGesture={enableContentPanningGesture}
      animationConfigs={animationConfigs}
      keyboardBehavior={keyboardBehavior}
      androidKeyboardInputMode={androidKeyboardInputMode}
      handleHeight={handleHeight}
      contentHeight={contentHeight}>
      <BottomSheetView style={contentStyle}>
        {/* ✅ “빈 공간” 터치 감지용 */}
        <Pressable style={{flex: 1}} onPress={onPressOutside}>
          {/* ✅ 여기 onLayout로 “콘텐츠 높이(버튼 포함)” 측정 */}
          <View
            onLayout={onContentLayout}
            style={[
              styles.container,
              {paddingBottom: insets.bottom + getResponsiveHeight(14)},
              containerStyle,
            ]}>
            {(title || subtitle) && (
              <View style={[styles.header, headerStyle]}>
                {title && <Text style={BOTTOMSHEET_STYLE.title}>{title}</Text>}
                {subtitle && (
                  <Text style={BOTTOMSHEET_STYLE.subtitle}>{subtitle}</Text>
                )}
              </View>
            )}

            {/* ✅ children만 움직이게 */}
            <Animated.View
              style={[
                styles.innerContent,
                innerContentStyle,
                contentTranslateY != null
                  ? {transform: [{translateY: contentTranslateY}]}
                  : null,
              ]}>
              {children}
            </Animated.View>

            {/* ✅ 버튼은 고정 X, 그냥 마지막 요소 */}
            {!!injectedFooterProps && (
              <View style={[styles.inlineFooter, footerStyle]}>
                <BottomSheetButtons {...injectedFooterProps} />
              </View>
            )}
          </View>
        </Pressable>
      </BottomSheetView>
    </KinoBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingTop: getResponsiveHeight(14),
  },
  header: {
    marginBottom: getResponsiveHeight(15),
  },

  innerContent: {},
  inlineFooter: {
    marginTop: getResponsiveHeight(10),
    backgroundColor: 'white',
  },
});
