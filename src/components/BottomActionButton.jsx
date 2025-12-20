// src/components/BottomActionButton.jsx
import React from 'react';
import {TouchableOpacity, Text, View, StyleSheet, Platform} from 'react-native';
import {BUTTON_STYLES} from 'styles/style';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
} from 'utils/responsive';

// ✅ 햅틱 유틸 (이미 쓰고 있는 그 파일)
import { hapticLight } from 'utils/haptic';
export default function BottomActionButton({label, onPress}) {
  const handlePress = () => {
    // ✅ 버튼 누를 때 햅틱
    hapticLight();
    onPress?.();
  };

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.85}>
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom:
      Platform.OS === 'ios'
        ? getResponsiveHeight(40)
        : getResponsiveHeight(25),
    gap: getResponsiveHeight(10),
    alignSelf: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: BUTTON_STYLES.saveBg,
    height: getResponsiveHeight(50),
    width: '100%',
    borderRadius: getResponsiveIconSize(10),
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: BUTTON_STYLES.fontSize,
    lineHeight: getResponsiveHeight(30),
    textAlign: 'center',
    fontFamily: BUTTON_STYLES.fontFamily,
    color: 'white',
  },
});
