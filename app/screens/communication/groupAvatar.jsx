// components/common/GroupAvatar.jsx
import React from 'react';
import {View, Image, StyleSheet} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../utils/responsive';

export default function GroupAvatar({images = [], size = 60}) {
  const count = Math.min(images.length, 4);
  const imageSize = size / (count > 1 ? 1.5 : 1);

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      {count === 1 && (
        <Image
          source={{uri: images[0]}}
          style={[
            styles.image,
            {width: size, height: size, borderRadius: size / 2},
          ]}
        />
      )}
      {count === 2 && (
        <>
          <Image
            source={{uri: images[0]}}
            style={[styles.imageHalf, {top: 0, left: 0}]}
          />
          <Image
            source={{uri: images[1]}}
            style={[styles.imageHalf, {bottom: 0, right: 0}]}
          />
        </>
      )}
      {count === 3 && (
        <>
          <Image
            source={{uri: images[0]}}
            style={[styles.imageThird, {top: 0, left: size / 4}]}
          />
          <Image
            source={{uri: images[1]}}
            style={[styles.imageThird, {bottom: 0, left: 0}]}
          />
          <Image
            source={{uri: images[2]}}
            style={[styles.imageThird, {bottom: 0, right: 0}]}
          />
        </>
      )}
      {count === 4 && (
        <>
          <Image
            source={{uri: images[0]}}
            style={[styles.imageQuarter, {top: 0, left: 0}]}
          />
          <Image
            source={{uri: images[1]}}
            style={[styles.imageQuarter, {top: 0, right: 0}]}
          />
          <Image
            source={{uri: images[2]}}
            style={[styles.imageQuarter, {bottom: 0, left: 0}]}
          />
          <Image
            source={{uri: images[3]}}
            style={[styles.imageQuarter, {bottom: 0, right: 0}]}
          />
        </>
      )}
    </View>
  );
}

const base = {
  position: 'absolute',
  resizeMode: 'cover',
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  imageHalf: {
    ...base,
    width: getResponsiveWidth(34),
    height: getResponsiveHeight(34),
    borderRadius: getResponsiveIconSize(19),
  },
  imageThird: {
    ...base,
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    borderRadius: getResponsiveIconSize(15),
  },
  imageQuarter: {
    ...base,
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    borderRadius: getResponsiveIconSize(15),
  },
});
