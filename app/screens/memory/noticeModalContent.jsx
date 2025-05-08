import React from 'react';
import {View, Text, TextInput} from 'react-native';

import {
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../utils/responsive';

export default function NoticeModalContent({
  currentNotice,
  noticeInput,
  setNoticeInput,
}) {
  return (
    <View style={{gap: getResponsiveHeight(15)}}>
      <Text
        style={{
          fontFamily: 'Pretendard-SemiBold',
          fontSize: getResponsiveFontSize(20),
        }}>
        공지사항을 변경하시겠습니까?
      </Text>
      <View
        style={{
          width: '100%',
          height: getResponsiveHeight(100),
          borderWidth: 1,
          borderColor: '#999',
          borderRadius: 8,
          paddingHorizontal: getResponsiveHeight(10),
          paddingVertical: getResponsiveHeight(10),
          justifyContent: 'flex-start',
        }}>
        <TextInput
          value={noticeInput}
          onChangeText={setNoticeInput}
          style={{
            fontSize: getResponsiveFontSize(14),
            fontFamily: 'Pretendard-Regular',
            color: '#000',
            flexWrap: 'wrap',
          }}
          multiline={true} // ✅ 여러 줄 입력 가능
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );
}
