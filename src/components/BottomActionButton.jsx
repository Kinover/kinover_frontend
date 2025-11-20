// src/components/BottomActionButton.jsx
import React from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
} from 'utils/responsive';

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
    bottom: getResponsiveHeight(60),
    gap: getResponsiveHeight(10),
    alignSelf: 'center',
    width: '100%',
  },
  button: {
    // backgroundColor: '#FFC84D',
    backgroundColor: '#111827',

    height: getResponsiveHeight(50),
    width: '100%',
    borderRadius: getResponsiveIconSize(10),
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: getResponsiveFontSize(15),
    lineHeight: getResponsiveHeight(30),
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
    // color: 'black',
    color: 'white',
  },
});
