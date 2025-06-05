import React from 'react';
import {Text} from 'react-native';
import {getResponsiveFontSize} from '../../responsive';

export default function ComingSoonModalContent() {
  return (
    <Text
      style={{
        fontFamily: 'Pretendard-SemiBold',
        fontSize: getResponsiveFontSize(15),
      }}>
      설정은 추후 업데이트될 예정입니다.
    </Text>
  );
}
