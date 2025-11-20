// src/components/BottomActionButton.jsx
import React from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

export default function BottomActionButton({label, onPress}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: getResponsiveHeight(26), // 바텀시트 버튼과 비슷한 여백
    width: '100%',
    paddingHorizontal: getResponsiveWidth(22),
  },

  button: {
    backgroundColor: '#111827', // BottomSheetButtons의 saveButton 색상
    paddingVertical: getResponsiveHeight(13),
    borderRadius: 9, // 동일
    alignItems: 'center',
    justifyContent: 'center',

    // 살짝 그림자 추가 (선택)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  buttonText: {
    fontFamily: 'Pretendard-SemiBold', // 동일
    fontSize: getResponsiveFontSize(14.5),
    color: '#FFFFFF',
  },
});
