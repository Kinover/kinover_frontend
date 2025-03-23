import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import {getResponsiveFontSize,getResponsiveHeight,getResponsiveWidth} from './responsive';

export default function CustomSwitch({ isEnabled, toggleSwitch }) {
  const [thumbPosition] = useState(new Animated.Value(isEnabled ? 40 : 0));

  React.useEffect(() => {
    Animated.spring(thumbPosition, {
      toValue: isEnabled ? 37 : 0,
      useNativeDriver: false,
    }).start();
  }, [isEnabled]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleSwitch} style={styles.switchContainer}>
        <Text style={[styles.text, { left: 15 }]}>전체</Text>
        <Animated.View style={[styles.switchThumb, { transform: [{ translateX: thumbPosition }] }]} />
        <Text style={[styles.text, { right: 15 }]}>앨범</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = {
  container: {
    position: 'relative',
    width: getResponsiveWidth(80),
    height: getResponsiveHeight(30),
  },

  switchContainer: {
    width: getResponsiveWidth(80),
    height: getResponsiveWidth(30),
    backgroundColor: '#EDEDED',
    borderRadius: 30,
    justifyContent: 'center',
    position: 'relative', // 위치 설정을 위해 relative로 설정
  },
  switchThumb: {
    width: 50,
    height: 30,
    borderRadius: 50,
    backgroundColor: '#FFC84D',
    position: 'absolute', // thumb를 절대 위치로 설정
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    position: 'absolute',
    top: '30%', // 부모 컨테이너에서 50% 위치
    zIndex: 999,
    textAlign: 'center',
    fontFamily: 'Pretendard-Light',
  },
};
