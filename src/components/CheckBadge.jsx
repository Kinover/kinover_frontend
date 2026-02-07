import React from 'react';
import {View, StyleSheet} from 'react-native';
import {getResponsiveIconSize, getResponsiveWidth} from 'utils/responsive';
import {COLORS} from 'styles/style';

export default function CheckBadge({
  // 표시만 담당 (애니메이션은 부모에서 opacity로 처리해도 됨)
  size = getResponsiveWidth(16),
  dotSize = getResponsiveIconSize(6),

  borderWidth = 2,
  borderColor = COLORS.brandPrimary,

  backgroundColor = '#FFFFFF',
  dotColor = COLORS.brandPrimary,

  style,
}) {
  const s = typeof size === 'number' ? size : getResponsiveWidth(16);
  const d = typeof dotSize === 'number' ? dotSize : getResponsiveIconSize(6);

  return (
    <View
      style={[
        styles.badge,
        {
          width: s,
          height: s,
          borderRadius: s / 2,
          borderWidth,
          borderColor,
          backgroundColor,
        },
        style,
      ]}>
      <View
        style={{
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: dotColor,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
