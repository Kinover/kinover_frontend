import React from 'react';
import {View, StyleSheet} from 'react-native';
import {WINDOW_WIDTH} from '@gorhom/bottom-sheet';
import {getResponsiveWidth} from 'utils/responsive';

const ITEM_MARGIN = getResponsiveWidth(2);

export default function SkeletonPhotoGridItem() {
  return (
    <View
      style={[
        styles.box,
        {
          width: (WINDOW_WIDTH - ITEM_MARGIN * 3) / 4,
          aspectRatio: 1,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#ddd',
    borderRadius: 6,
  },
});
