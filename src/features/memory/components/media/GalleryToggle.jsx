import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import {getResponsiveWidth, getResponsiveHeight} from 'utils/responsive';

export default function GalleryToggle({isGalleryView, onToggle}) {
  return (
    <View style={styles.toggleContainer}>
      <SpringPressable onPress={() => onToggle(true)}>
        <Image
          source={
            isGalleryView
              ? require('assets/images/grid_on.png')
              : require('assets/images/grid_off.png')
          }
          style={styles.icon}
        />
      </SpringPressable>
      <SpringPressable onPress={() => onToggle(false)}>
        <Image
          source={
            !isGalleryView
              ? require('assets/images/list_on.png')
              : require('assets/images/list_off.png')
          }
          style={styles.icon}
        />
      </SpringPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: getResponsiveWidth(5),
    alignContent: 'flex-end',
    alignItems: 'flex-end',
  },
  icon: {
    width: getResponsiveWidth(32),
    height: getResponsiveHeight(30),
    resizeMode: 'contain',
    top: 2,
  },
});
