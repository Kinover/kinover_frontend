// src/components/common/MeasuredBlock.jsx
import React from 'react';
import {View} from 'react-native';

export default function MeasuredBlock({onHeight, style, children}) {
  return (
    <View
      collapsable={false}
      style={style}
      onLayout={e => {
        const h = e?.nativeEvent?.layout?.height ?? 0;
        onHeight?.(h);
      }}>
      {children}
    </View>
  );
}
