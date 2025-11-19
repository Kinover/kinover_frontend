import React, {useState} from 'react';
import {View,  TouchableOpacity, Animated} from 'react-native';
import {
  getResponsiveWidth,
} from '../utils/responsive';

export default function CustomSwitch({isEnabled, toggleSwitch}) {
  const [thumbPosition] = useState(new Animated.Value(isEnabled ? 40 : 0));

  React.useEffect(() => {
    Animated.spring(thumbPosition, {
      toValue: isEnabled ? getResponsiveWidth(24) : 0,
      useNativeDriver: false,
    }).start();
  }, [isEnabled]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleSwitch}
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
  },

  switchContainer: {
    width: getResponsiveWidth(55),
    height: getResponsiveWidth(30),
    backgroundColor: '#FFC84D',
    borderRadius: 30,
    justifyContent: 'center',
    position: 'relative', // 위치 설정을 위해 relative로 설정
  },
  switchThumb: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'white',
    position: 'absolute', // thumb를 절대 위치로 설정
    left: 3,
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
