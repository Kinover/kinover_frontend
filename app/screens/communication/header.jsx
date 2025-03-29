import 'react-native-gesture-handler'; // 이 코드가 제일 첫 줄에 있어야 합니다.
import {TextInput} from 'react-native-gesture-handler';
import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {useSelector} from 'react-redux'; // useSelector로 가져오고, useDispatch로 알림

export default function UserHeader() {
  const user = useSelector(state => state.user);

  return (
    <View style={styles.mainHeader}>
      <Image style={styles.mainHeaderImage} source={{uri: user.image}} />
      <View style={styles.mainHeaderTitleBox}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: getResponsiveWidth(9),
          }}>
          <Text style={styles.mainHeaderTitle}>{user.name}</Text>
          <Text style={styles.mainHeaderSubTitleSmall}>첫째</Text>
        </View>

        <TextInput
          style={styles.mainHeaderSubTitle}
          placeholder="오늘의 한마디를 적어주세요!"
          placeholderTextColor="black"></TextInput>
      </View>
    </View>
  );
}

// 스타일 시트
const styles = StyleSheet.create({
  mainHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: getResponsiveIconSize(20),
    width: '100%',
  },

  mainHeaderImage: {
    width: getResponsiveWidth(110),
    height: getResponsiveHeight(110),
    borderRadius: getResponsiveIconSize(55),
  },

  mainHeaderTitleBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: 'auto',
    gap: Platform.OS === 'ios' ? getResponsiveHeight(10) : 0,
  },

  mainHeaderTitle: {
    fontFamily: 'Pretendard-Bold', // 로드한 폰트를 지정
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(32)
        : getResponsiveFontSize(34),
    textAlign: 'center',
  },

  // "막내" 텍스트 스타일 추가
  mainHeaderSubTitleSmall: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(15), // 작은 글씨 크기
    color: '#5F5F5F', // 색상 추가
    paddingBottom: getResponsiveHeight(3),
    textAlign: 'center',
  },

  mainHeaderSubTitle: {
    fontFamily: 'Pretendard-Regular', // Regular 폰트 적용
    fontSize: getResponsiveFontSize(17),
  },

  mainHeaderMore: {
    fontFamily: 'Pretendard-Bold', // 로드한 폰트를 지정
    fontSize: getResponsiveFontSize(15),
    fontWeight: 'bold', // bold 스타일 적용
  },

});
