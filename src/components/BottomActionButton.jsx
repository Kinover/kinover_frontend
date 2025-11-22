// src/components/BottomActionButton.jsx
import React from 'react';
import {TouchableOpacity, Text, View, StyleSheet, Platform} from 'react-native';
import {BUTTON_STYLES} from 'styles/style';
import {getResponsiveHeight, getResponsiveIconSize} from 'utils/responsive';

export default function BottomActionButton({label, onPress}) {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom:
      Platform.OS === 'ios' ? getResponsiveHeight(40) : getResponsiveHeight(25),
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
