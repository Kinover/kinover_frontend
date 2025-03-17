import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Animated} from 'react-native';
import {ZoomIn} from 'react-native-reanimated';
import {getResponsiveHeight, getResponsiveWidth} from './responsive';

export default function CustomSwitch() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [thumbPosition] = useState(new Animated.Value(0)); // thumb 위치 애니메이션

  const toggleSwitch = () => {
    setIsEnabled(!isEnabled);
    Animated.spring(thumbPosition, {
      toValue: isEnabled ? 0 : 40, // 위치 변화
      useNativeDriver: false,
    }).start();
  };

  return (
    <View
      style={[
        styles.container,
        {display: 'flex', flexDirection: 'row', alignItems: 'center'},
      ]}>

      {/* 스위치 */}
      <TouchableOpacity onPress={toggleSwitch} style={styles.switchContainer}>
              <Text style={[styles.text, {left: 15}]}>전체</Text>

        <Animated.View
          style={[
            styles.switchThumb,
            {transform: [{translateX: thumbPosition}]},
          ]}
        />
              <Text style={[styles.text, {right: 15}]}>앨범</Text>

      </TouchableOpacity>

      {/* 스위치 오른쪽 "앨범" */}
      {/* <Text style={[styles.text, {right: 15}]}>앨범</Text> */}
    </View>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: getResponsiveWidth(90),
    height: getResponsiveHeight(30),
    // backgroundColor: 'black',
  },
  switchContainer: {
    width: 90,
    height: 30,
    backgroundColor: '#EDEDED',
    borderRadius: 30,
    justifyContent: 'center',
    position: 'relative', // 위치 설정을 위해 relative로 설정
  },
  switchThumb: {
    width: 50,
    height: 30,
    borderRadius: 60,
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
