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
      return require('../assets/images/createNewChatRoom-bt.png');
    } else if (type === 'memory') {
      return require('../assets/images/memory_floating-button.png');
    } else if (type === 'challenge') {
      return require('../assets/images/communication_floating-button.png');
    }
  };

  return (
    <TouchableOpacity style={[styles.floatingButton, {bottom: type === 'challenge' ? 20 : 20}]} onPress={handleClick}>
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
    // shadowRadius:1.5,
    // shadowOpacity:0.5,
    // shadowColor:'lightGray',
    // shadowOffset:-10,
  },
  buttonImage: {
    width: getResponsiveWidth(55),
    height: getResponsiveHeight(55),
    borderRadius: getResponsiveIconSize(22.5),
    resizeMode: 'contain',
  },
});
