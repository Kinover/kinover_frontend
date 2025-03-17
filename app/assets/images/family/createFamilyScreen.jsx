import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

export default function CreateFamilyScreen() {
  const [familyName, setFamilyName] = useState('');
  const [familyRole, setFamilyRole] = useState('');
  const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);
  const [isEditingFamilyRole, setIsEditingFamilyRole] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);

  const handleFamilyNameClick = () => {
    setIsEditingFamilyName(true);
  };

  const handleFamilyNameBlur = () => {
    setIsEditingFamilyName(false);
  };

  const handleFamilyRoleClick = () => {
    setIsEditingFamilyRole(true);
  };

  const handleFamilyRoleBlur = () => {
    setIsEditingFamilyRole(false);
  };

  const toggleColorPicker = () => {
    setIsColorPickerVisible(!isColorPickerVisible);
  };

  const handleColorSelect = color => {
    setSelectedColor(color);
    setIsColorPickerVisible(false); // 색상 선택 후 박스 숨기기
  };

  return (
    <View style={styles.container}>
      {/* 가족 이름 입력 */}
      <View style={styles.elementContainer}>
        {isEditingFamilyName ? (
          <TextInput
            style={[styles.input, styles.elementText]}
            placeholder=""
            value={familyName}
            onChangeText={setFamilyName}
            onBlur={handleFamilyNameBlur}
            autoFocus
          />
        ) : (
          <TouchableOpacity onPress={handleFamilyNameClick}>
            <Text style={styles.elementText}>
              {familyName ? (
                <Text>{familyName}</Text> // 입력한 가족 이름 표시
              ) : (
                <>
                  <Text style={[styles.yellowText, styles.semiboldFont]}>
                    가족 이름
                  </Text>
                  을 입력해주세요
                </>
              )}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 가족 역할 입력 */}
      <View style={styles.elementContainer}>
        {isEditingFamilyRole ? (
          <TextInput
            style={[styles.input, styles.elementText]}
            placeholder=""
            value={familyRole}
            onChangeText={setFamilyRole}
            onBlur={handleFamilyRoleBlur}
            autoFocus
          />
        ) : (
          <TouchableOpacity onPress={handleFamilyRoleClick}>
            <Text style={styles.elementText}>
              {familyRole ? (
                <Text>{familyRole}</Text> // 입력한 가족 역할 표시
              ) : (
                <>
                  <Text style={[styles.yellowText, styles.semiboldFont]}>
                    나의 역할
                  </Text>
                  을 입력해주세요
                </>
              )}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 나의 색깔을 골라주세요 */}
      <TouchableOpacity
        style={styles.elementContainer}
        onPress={toggleColorPicker}>
        {!selectedColor ? (
          <Text style={styles.elementText}>
            <Text style={[styles.yellowText, styles.semiboldFont]}>
              나의 색깔
            </Text>
            을 골라주세요
          </Text>
        ) : (
          <Text style={[styles.elementText, {color: selectedColor,fontFamily:'Pretendard-Bold'}]}>
            나의 색깔
          </Text>
        )}

        {/* 색상 선택 박스 */}
        {isColorPickerVisible && (
          <View style={styles.colorPickerContainer}>
            <View style={styles.colorCircleRow}>
              <TouchableOpacity
                style={[styles.colorCircle, {backgroundColor: '#FFCFE5'}]}
                onPress={() => handleColorSelect('#FFCFE5')}
              />
              <TouchableOpacity
                style={[styles.colorCircle, {backgroundColor: '#FFC84D'}]}
                onPress={() => handleColorSelect('#FFC84D')}
              />
              <TouchableOpacity
                style={[styles.colorCircle, {backgroundColor: '#334EA7'}]}
                onPress={() => handleColorSelect('#334EA7')}
              />
              <TouchableOpacity
                style={[styles.colorCircle, {backgroundColor: '#FF7676'}]}
                onPress={() => handleColorSelect('#FF7676')}
              />
            </View>
            <View style={styles.colorCircleRow}>
              <TouchableOpacity
                style={[styles.colorCircle, {backgroundColor: '#ADD8E6'}]}
                onPress={() => handleColorSelect('#ADD8E6')}
              />
              <TouchableOpacity
                style={[styles.colorCircle, {backgroundColor: '#C1D693'}]}
                onPress={() => handleColorSelect('#C1D693')}
              />
              <TouchableOpacity
                style={[styles.colorCircle, {backgroundColor: '#FBDCFF'}]} // 추가된 색상
                onPress={() => handleColorSelect('#FBDCFF')}
              />
              <TouchableOpacity
                style={[styles.colorCircle, {backgroundColor: '#A7A7A7'}]} // 추가된 색상
                onPress={() => handleColorSelect('#A7A7A7')}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>생성 완료</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    backgroundColor: 'white',
    display: 'flex',
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(50),
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
    bottom: getResponsiveHeight(100),
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
