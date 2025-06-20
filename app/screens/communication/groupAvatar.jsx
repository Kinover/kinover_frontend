// components/common/GroupAvatar.jsx
import React from 'react';
import {View, Image, StyleSheet} from 'react-native';

export default function GroupAvatar({images = [], size = 60}) {
  const count = Math.min(images.length, 4);
  const imageStyle = (multiplier = 1) => ({
    width: size / multiplier,
    height: size / multiplier,
    borderRadius: (size / multiplier) / 2,
  });

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      {count === 1 && (
        <Image
          source={{uri: images[0]}}
          style={[styles.absolute, imageStyle(1)]}
        />
      )}
      {count === 2 && (
        <>
          <Image
            source={{uri: images[0]}}
            style={[
              styles.absolute,
              imageStyle(1.6),
              {top: 0, left: 0},
            ]}
          />
          <Image
            source={{uri: images[1]}}
            style={[
              styles.absolute,
              imageStyle(1.6),
              {bottom: 0, right: 0},
            ]}
          />
        </>
      )}
      {count === 3 && (
        <>
          <Image
            source={{uri: images[0]}}
            style={[
              styles.absolute,
              imageStyle(1.8),
              {top: 0, left: size * 0.25},
            ]}
          />
          <Image
            source={{uri: images[1]}}
            style={[
              styles.absolute,
              imageStyle(1.8),
              {bottom: 0, left: 0},
            ]}
          />
          <Image
            source={{uri: images[2]}}
            style={[
              styles.absolute,
              imageStyle(1.8),
              {bottom: 0, right: 0},
            ]}
          />
        </>
      )}
      {count === 4 && (
        <>
          <Image
            source={{uri: images[0]}}
            style={[
              styles.absolute,
              imageStyle(2),
              {top: 0, left: 0},
            ]}
          />
          <Image
            source={{uri: images[1]}}
            style={[
              styles.absolute,
              imageStyle(2),
              {top: 0, right: 0},
            ]}
          />
          <Image
            source={{uri: images[2]}}
            style={[
              styles.absolute,
              imageStyle(2),
              {bottom: 0, left: 0},
            ]}
          />
          <Image
            source={{uri: images[3]}}
            style={[
              styles.absolute,
              imageStyle(2),
              {bottom: 0, right: 0},
            ]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  absolute: {
    position: 'absolute',
    resizeMode: 'cover',
  },
});
