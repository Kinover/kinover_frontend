import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import FastImage from '@d11/react-native-fast-image';
import BottomActionButton from 'components/BottomActionButton';

export default function SetupFinishScreen() {
  const navigation = useNavigation();

  const handleButtonClick = () => {
    navigation.navigate('Tabs'); // 홈 탭으로 이동
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 텍스트 영역 */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{`가족 모임이 생성되었어요`}</Text>
        <Text style={styles.headerSubTitle}>
          가족을 초대해 함께 추억을 쌓아가보세요
        </Text>
      </View>

      {/* 가운데 이미지 영역 */}
      <View style={styles.imageWrapper}>
        <FastImage
          style={styles.mainImage}
          resizeMode="contain"
          source={require('@/assets/images/familySetup_kinoFamily.png')}
        />
      </View>

      {/* 하단 액션 버튼 */}
      <BottomActionButton label="홈으로 가기" onPress={handleButtonClick} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(24),
    backgroundColor: '#FFFFFF',
  },

  // 상단 텍스트
  headerContainer: {
    marginTop: getResponsiveHeight(40),
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(26),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(32),
    marginBottom: getResponsiveHeight(6),
    marginTop: getResponsiveHeight(30),
  },
  headerSubTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(20),
  },

  // 중앙 이미지
  imageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    flex:1,
    width: '60%',
    objectFit: 'contain',
  },
});
