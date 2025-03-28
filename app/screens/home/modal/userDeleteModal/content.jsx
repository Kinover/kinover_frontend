import React from 'react';
import {View, Text, Image} from 'react-native';
import {getResponsiveFontSize, getResponsiveHeight} from '../../../../utils/responsive';
import {StyleSheet} from 'react-native';

export default function UserDeleteModalContent({user}) {
  return (
    <View style={{gap: getResponsiveHeight(20)}}>
      <View style={styles.centered}>
        <Image style={styles.userImage} source={{uri: user.image}} />
      </View>
      <View style={styles.centered}>
        <Text
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: getResponsiveFontSize(17),
          }}>
          정말  '{user.name}' 님을 삭제하시겠습니까?
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImage: {
    width: 75,
    height: 75,
    borderRadius: 36.5,
    resizeMode: 'cover',
    borderWidth: 0.15,
    borderColor: 'gray',
  },
});
