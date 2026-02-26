import React, {useState, useEffect} from 'react';
import {View, TouchableOpacity, Animated} from 'react-native';
import {getResponsiveWidth} from '../utils/responsive';

// 햅틱 유틸 import
import {hapticSelection} from '../utils/haptic';

export default function CustomSwitch({isEnabled, toggleSwitch}) {
  const [thumbPosition] = useState(
    new Animated.Value(isEnabled ? getResponsiveWidth(24) : 0),
  );

  useEffect(() => {
    Animated.spring(thumbPosition, {
      toValue: isEnabled ? getResponsiveWidth(24) : 0,
      useNativeDriver: false,
      friction: 6,
      tension: 80,
    }).start();
  }, [isEnabled, thumbPosition]);

  const handlePress = () => {
 // 스위치 토글용 햅틱 (가볍게)
    hapticSelection();
    toggleSwitch?.();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={[
          styles.switchContainer,
          {backgroundColor: isEnabled ? '#FFC84D' : '#ccc'},
        ]}>
        <Animated.View
          style={[
            styles.switchThumb,
            {transform: [{translateX: thumbPosition}]},
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: getResponsiveWidth(60),
    height: getResponsiveWidth(30),
    justifyContent: 'center',
  },

  switchContainer: {
    width: getResponsiveWidth(55),
    height: getResponsiveWidth(30),
    borderRadius: 30,
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 3,
  },

  switchThumb: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 3,
    elevation: 7, // Android 살짝 떠 보이게
    shadowColor: '#000', // iOS
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
};
