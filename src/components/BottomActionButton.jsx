// src/components/BottomActionButton.jsx
import React, {useMemo} from 'react';
import {TouchableOpacity, Text, View, StyleSheet, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BUTTON_STYLES} from 'styles/style';
import {getResponsiveHeight} from 'utils/responsive';
import {hapticLight} from 'utils/haptic';

/**
 * ✅ BottomActionButton
 * - variant="fixed"(기본): 기존처럼 화면 하단 고정(absolute) + Android insets.bottom 반영
 * - variant="scroll": FlatList/ScrollView footer에 넣어도 되는 일반 레이아웃(absolute 없음) + insets.bottom padding
 */
export default function BottomActionButton({
  label,
  onPress,
  variant = 'fixed', // 'fixed' | 'scroll'
  disabled = false,
}) {
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    if (disabled) return;
    hapticLight();
    onPress?.();
  };

  // ✅ fixed 모드에서만 bottom 오프셋 계산
  const bottomOffset = useMemo(() => {
    const base =
      Platform.OS === 'ios' ? getResponsiveHeight(40) : getResponsiveHeight(25);

    if (Platform.OS === 'android') return base + insets.bottom;
    return base;
  }, [insets.bottom]);

  const isFixed = variant === 'fixed';

  return (
    <View
      style={[
        styles.buttonContainer,
        isFixed ? styles.fixedContainer : styles.scrollContainer,
        isFixed ? {bottom: bottomOffset} : {paddingBottom: insets.bottom},
      ]}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={disabled}>
        <Text
          allowFontScaling={false}
          style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ✅ 공통
  buttonContainer: {
    width: '100%',
    alignSelf: 'center',
    gap: getResponsiveHeight(10),
  },

  // ✅ 기존 방식(하단 고정)
  fixedContainer: {
    position: 'absolute',
  },

  // ✅ 옵션 A용(스크롤 컨텐츠에 포함)
  scrollContainer: {
    position: 'relative',
  },

  button: {
    backgroundColor: BUTTON_STYLES().saveBg,
    height: getResponsiveHeight(50),
    width: '100%',
    borderRadius: BUTTON_STYLES().border_radius,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: BUTTON_STYLES().fontSize,
    lineHeight: getResponsiveHeight(30),
    textAlign: 'center',
    fontFamily: BUTTON_STYLES().fontFamily,
    color: 'white',
  },
  buttonTextDisabled: {
    color: 'rgba(255,255,255,0.9)',
  },
});
