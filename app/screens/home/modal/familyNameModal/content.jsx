import React from 'react';
import {View, Text, TextInput} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
} from '../../../../utils/responsive';

export default function FamilyNameModalContent({
  familyNameInput,
  setFamilyNameInput,
  currentFamilyName,
}) {
  return (
    <View style={{gap: getResponsiveHeight(15)}}>
      <Text
        style={{
          fontFamily: 'Pretendard-SemiBold',
          fontSize: getResponsiveFontSize(20),
        }}>
        {`'${currentFamilyName}'`} 패밀리 님,{'\n'}가족명을 변경하시겠습니까?
      </Text>
      <View
        style={{
          width: '100%',
          height: getResponsiveHeight(45),
          borderWidth: 1,
          borderColor: '#999',
          borderRadius: 8,
          paddingHorizontal: 10,
          justifyContent: 'center',
        }}>
        <TextInput
          value={familyNameInput}
          onChangeText={setFamilyNameInput}
          style={{
            fontSize: getResponsiveFontSize(15),
            fontFamily: 'Pretendard-SemiBold',
            color: '#000',
          }}
          placeholder="가족명을 입력하세요"
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );
}
