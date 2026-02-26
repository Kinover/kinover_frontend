import React from 'react';
import {TouchableOpacity, Image, StyleSheet} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../utils/responsive';

// 햅틱 유틸
import {hapticLight} from '../utils/haptic';

export default function FloatingButton({type, navigation}) {
  const handleClick = () => {
 // 플로팅 버튼은 가볍게
    hapticLight();

    if (type === 'communication') {
      navigation.navigate('채팅방생성화면');
    } else if (type === 'memory') {
      navigation.navigate('추억생성화면'); // 필요 없으면 지워도 됨
    }
  };

  const getImageSource = () => {
    if (type === 'communication') {
      return require('@/assets/images/createNewChatRoom-bt.png');
    }
    if (type === 'memory') {
      return require('@/assets/images/memory_floating-button.png');
    }
    if (type === 'challenge') {
      return require('@/assets/images/communication_floating-button.png');
    }
    return null;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.floatingButton}
      onPress={handleClick}>
      <Image style={styles.buttonImage} source={getImageSource()} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: getResponsiveHeight(53),
    right: getResponsiveWidth(23),
    zIndex: 9,

 // Android
    elevation: 10,

 // iOS
    shadowOffset: {width: 0, height: 2.5},
    shadowRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
  },

  buttonImage: {
    width: getResponsiveWidth(60),
    height: getResponsiveHeight(60),
    borderRadius: getResponsiveIconSize(30),
    resizeMode: 'contain',
  },
});
