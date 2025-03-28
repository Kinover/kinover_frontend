import React from 'react';
import {TouchableOpacity, Image, StyleSheet} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from './responsive';

export default function FloatingButton({type}) {
  const handleClick = () => {
    alert('플로팅 버튼 클릭!');
  };

  const getImageSource = () => {
    if (type === 'communication') {
      return require('../assets/images/communication_floating-button.png');
    } else if (type === 'memory') {
      return require('../assets/images/memory_floating-button.png');
    } else if (type === 'challenge') {
      return require('../assets/images/communication_floating-button.png');
    }
  };

  return (
    <TouchableOpacity style={[styles.floatingButton, {bottom: type === 'challenge' ? 70 : 20}]} onPress={handleClick}>
      <Image style={styles.buttonImage} source={getImageSource()} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 9,
    elevation: 10,
  },
  buttonImage: {
    width: getResponsiveWidth(60),
    height: getResponsiveHeight(60),
    borderRadius: getResponsiveIconSize(30),
    resizeMode: 'contain',
  },
});
