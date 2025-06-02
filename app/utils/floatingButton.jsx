import React from 'react';
import {TouchableOpacity, Image, StyleSheet} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from './responsive';

export default function FloatingButton({type, navigation}) {
  const handleClick = () => {
    if (type === 'communication') {
      navigation.navigate('채팅방생성화면'); // ✅ 채팅방 생성 화면으로 이동
    } else {
      alert('플로팅 버튼 클릭!');
    }
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
    <TouchableOpacity
      style={[styles.floatingButton, {bottom: 20}]}
      onPress={handleClick}>
      <Image style={styles.buttonImage} source={getImageSource()} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 23,
    right: 23,
    zIndex: 9,
    elevation: 10,
    shadowOffset: {width: 0, height: 2.5},
    shadowRadius: 1,
    shadowColor: 'gray',
    shadowOpacity: 0.4,
  },
  buttonImage: {
    width: getResponsiveWidth(60),
    height: getResponsiveHeight(60),
    borderRadius: getResponsiveIconSize(30),
    resizeMode: 'contain',
  },
});
