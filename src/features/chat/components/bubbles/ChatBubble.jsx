import React from 'react';
import {View, StyleSheet} from 'react-native';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';

/**
 * 일반(비-키노) 채팅 말풍선 컨테이너
 * - 텍스트/미디어에 따라 padding만 다르게 적용
 * - 실제 텍스트/이미지 렌더는 children으로 위임
 */
export default function ChatBubble({
  alignment = 'left', // left | right
  paddingVariant = 'text', // text | media
  backgroundColor = '#FFECC3',
  maxWidth,
  children,
  style,
}) {
  const paddingStyle =
    paddingVariant === 'text'
      ? {
          paddingVertical: getResponsiveHeight(10),
          paddingHorizontal: getResponsiveWidth(14.5),
        }
      : {
          paddingVertical: getResponsiveHeight(4.5),
          paddingHorizontal: getResponsiveWidth(4.5),
        };

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          maxWidth: maxWidth ?? getResponsiveWidth(260),
          ...(alignment === 'right' ? {alignSelf: 'flex-end'} : null),
        },
        paddingStyle,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: getResponsiveIconSize(20),
    flexShrink: 1,
  },
});

