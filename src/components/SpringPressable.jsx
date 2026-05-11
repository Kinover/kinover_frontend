import React from 'react';
import {Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * TouchableOpacity 대체 컴포넌트.
 * pressIn 시 scale 0.96으로 축소, pressOut 시 spring으로 복귀.
 * activeOpacity prop은 무시하고 내부적으로 opacity 애니메이션 처리.
 */
export default function SpringPressable({
  children,
  style,
  onPress,
  onLongPress,
  onPressIn: externalPressIn,
  onPressOut: externalPressOut,
  disabled,
  scaleTo = 0.96,
  activeOpacity: _activeOpacity, // TouchableOpacity 하위 호환 (Pressable로 전달하지 않음)
  ...rest
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  const handlePressIn = e => {
    if (disabled) return;
    scale.value = withTiming(scaleTo, {duration: 80});
    opacity.value = withTiming(0.84, {duration: 80});
    externalPressIn?.(e);
  };

  const handlePressOut = e => {
    scale.value = withSpring(1, {damping: 12, stiffness: 200});
    opacity.value = withTiming(1, {duration: 100});
    externalPressOut?.(e);
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animStyle, style]}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
}
