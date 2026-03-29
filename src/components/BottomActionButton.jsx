// src/components/BottomActionButton.jsx
import React, {useMemo} from 'react';
import {TouchableOpacity, View, StyleSheet, Platform, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useReduxFontMode} from 'hooks/useReduxFontMode';
import {BUTTON_STYLES} from 'styles/style';
import {
  getResponsiveFontSize,
  getResponsiveFontSizeIgnoreAppMode,
  getResponsiveHeight,
  getResponsiveHeightIgnoreAppMode,
  getResponsiveIconSize,
  getResponsiveIconSizeIgnoreAppMode,
} from 'utils/responsive';
import {hapticLight} from 'utils/haptic';
import AppText from 'components/AppText';

/**
 * BottomActionButton
 * - variant="fixed"(기본): 기존처럼 화면 하단 고정(absolute) + Android insets.bottom 반영
 * - variant="scroll": FlatList/ScrollView footer에 넣어도 되는 일반 레이아웃(absolute 없음) + insets.bottom padding
 * - useAppFontScaling={false}: 온보딩·회원가입 등 설정 글씨 크기(LARGE/XL) 미적용
 */
export default function BottomActionButton({
  label,
  onPress,
  variant = 'fixed', // 'fixed' | 'scroll'
  disabled = false,
  useAppFontScaling = true,
  /** scroll일 때: 부모가 paddingBottom(세이프 포함)을 주면 false로 두고 0 */
  scrollInsetsBottom = true,
  /** 미지정 시 테마 저장 버튼 색(BUTTON_STYLES().saveBg) */
  backgroundColor,
  labelColor = 'white',
}) {
  const fontMode = useReduxFontMode();

  const styles = useMemo(() => {
    const h = useAppFontScaling ? getResponsiveHeight : getResponsiveHeightIgnoreAppMode;
    const icon = useAppFontScaling
      ? getResponsiveIconSize
      : getResponsiveIconSizeIgnoreAppMode;
    const rf = useAppFontScaling
      ? getResponsiveFontSize
      : getResponsiveFontSizeIgnoreAppMode;

    return StyleSheet.create({
      buttonContainer: {
        width: '100%',
        alignSelf: 'center',
        gap: h(10),
      },

      fixedContainer: {
        position: 'absolute',
      },

      scrollContainer: {
        position: 'relative',
      },

      button: {
        backgroundColor: backgroundColor ?? BUTTON_STYLES().saveBg,
        height: h(50),
        width: '100%',
        borderRadius: icon(14),
        justifyContent: 'center',
      },
      buttonDisabled: {
        opacity: 0.5,
      },
      buttonText: {
        fontSize: rf(14),
        lineHeight: h(30),
        textAlign: 'center',
        fontFamily: BUTTON_STYLES().fontFamily,
        color: labelColor,
      },
      buttonTextDisabled: {
        color: 'rgba(255,255,255,0.9)',
      },
    });
  }, [
    useAppFontScaling,
    backgroundColor,
    labelColor,
    ...(useAppFontScaling ? [fontMode] : []),
  ]);

  const insets = useSafeAreaInsets();

  const handlePress = () => {
    if (disabled) return;
    hapticLight();
    onPress?.();
  };

  const bottomOffset = useMemo(() => {
    const h = useAppFontScaling ? getResponsiveHeight : getResponsiveHeightIgnoreAppMode;
    const base = Platform.OS === 'ios' ? h(40) : h(25);

    if (Platform.OS === 'android') return base + insets.bottom;
    return base;
  }, [
    insets.bottom,
    useAppFontScaling,
    ...(useAppFontScaling ? [fontMode] : []),
  ]);

  const isFixed = variant === 'fixed';

  const LabelText = useAppFontScaling ? AppText : Text;

  return (
    <View
      style={[
        styles.buttonContainer,
        isFixed ? styles.fixedContainer : styles.scrollContainer,
        isFixed
          ? {bottom: bottomOffset}
          : {paddingBottom: scrollInsetsBottom ? insets.bottom : 0},
      ]}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={disabled}>
        <LabelText
          allowFontScaling={false}
          style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          {label}
        </LabelText>
      </TouchableOpacity>
    </View>
  );
}
