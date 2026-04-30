// src/components/BottomActionButton.jsx
import React, {useMemo} from 'react';
import {TouchableOpacity, View, StyleSheet, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BUTTON_STYLES, COLORS} from 'styles/style';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
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
  labelColor = COLORS.textPrimary,
  buttonStyle,
  labelStyle,
}) {
  const styles = useMemo(() => {
    return StyleSheet.create({
      buttonContainer: {
        width: '100%',
        alignSelf: 'center',
        gap: getResponsiveHeight(10),
      },

      fixedContainer: {
        position: 'absolute',
      },

      scrollContainer: {
        position: 'relative',
      },

      button: {
        backgroundColor: backgroundColor ?? BUTTON_STYLES().saveBg,
        height: getResponsiveHeight(50),
        width: '100%',
        borderRadius: getResponsiveIconSize(14),
        justifyContent: 'center',
      },
      buttonDisabled: {
        opacity: 0.7,
        backgroundColor: COLORS.disabled,
      },
      buttonText: {
        fontSize: getResponsiveFontSize(14),
        lineHeight: getResponsiveHeight(30),
        textAlign: 'center',
        fontFamily: BUTTON_STYLES().fontFamily,
        color: labelColor,
      },
      buttonTextDisabled: {
        color: '#374151',
      },
    });
  }, [backgroundColor, labelColor]);

  const insets = useSafeAreaInsets();

  const handlePress = () => {
    if (disabled) return;
    hapticLight();
    onPress?.();
  };

  const bottomOffset = useMemo(() => {
    const base = Platform.OS === 'ios' ? getResponsiveHeight(40) : getResponsiveHeight(25);
    if (Platform.OS === 'android') return base + insets.bottom;
    return base;
  }, [insets.bottom]);

  const isFixed = variant === 'fixed';

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
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{disabled}}
        style={[styles.button, buttonStyle, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={disabled}>
        <AppText
          style={[
            styles.buttonText,
            labelStyle,
            disabled && styles.buttonTextDisabled,
          ]}>
          {label}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}
