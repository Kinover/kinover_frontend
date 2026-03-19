import React from 'react';
import {View, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {getResponsiveWidth, getResponsiveHeight} from 'utils/responsive';

export default function GalleryToggle({isGalleryView, onToggle}) {
  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity onPress={() => onToggle(true)}>
        <Image
          source={
            isGalleryView
              ? require('assets/images/grid_on.png')
              : require('assets/images/grid_off.png')
          }
          style={styles.icon}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onToggle(false)}>
        <Image
          source={
            !isGalleryView
              ? require('assets/images/list_on.png')
              : require('assets/images/list_off.png')
          }
          style={styles.icon}
        />
      </TouchableOpacity>
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
