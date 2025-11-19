import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function CreateFamilyScreen() {

  return (
    <SafeAreaView style={styles.container} edges={['top,bottom,left,right']}>
      {/* 가족 이름 입력 */}

      <View
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          paddingHorizontal: '5%',
          gap: getResponsiveHeight(60),
        }}>
        <Text style={{color: 'black', fontSize: getResponsiveFontSize(30)}}>
          {`가족명을\n입력하세요`}
        </Text>

        <TextInput
          style={{
            borderColor: 'lightgray',
            borderWidth: 1,
            borderRadius: getResponsiveIconSize(10),
          }}></TextInput>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>생성 완료</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: 'white',
    display: 'flex',
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(120),
    gap: getResponsiveHeight(30),
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  elementContainer: {
    width: getResponsiveWidth(319.62),
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderColor: '#FFC84D',
    borderWidth: getResponsiveIconSize(1),
    borderRadius: 10,
    paddingHorizontal: getResponsiveWidth(15),
    paddingVertical: getResponsiveHeight(15), // 높이 유동적으로 변경
  },

  elementText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(15.5),
    textAlign: 'left',
  },

  yellowText: {
    color: '#FFB000',
  },

  semiboldFont: {
    fontFamily: 'Pretendard-SemiBold',
  },

  input: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(15.5),
    textAlign: 'left',
    width: '100%',
  },

  colorPickerContainer: {
    marginTop: getResponsiveHeight(20), // 색상 선택 박스를 더 가까운 위치로
    width: '100%',
    paddingHorizontal: getResponsiveWidth(10),
  },

  colorCircleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(10),
  },

  colorCircle: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    borderRadius: 15,
  },

  selectedColorText: {
    marginTop: getResponsiveHeight(20),
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
  },

  button: {
    position: 'absolute',
    bottom: getResponsiveHeight(50),
    backgroundColor: '#FFC84D',
    width: getResponsiveWidth(331),
    height: getResponsiveHeight(60),
    borderRadius: getResponsiveIconSize(10),
    justifyContent: 'center',
    alignSelf: 'center',
  },

  buttonText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(15.6),
    textAlign: 'center',
    color: 'black',
  },
});