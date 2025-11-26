// SetupFinishScreen.tsx - Version 2

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
    navigation.navigate('Tabs');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 일러스트 영역 */}
      <View style={styles.illustrationArea}>
        <View style={styles.circleBg} />
        <FastImage
          style={styles.mainImage}
          resizeMode="contain"
          source={require('@/assets/images/familySetup_kinoFamily.png')}
        />
      </View>

      {/* 텍스트 + 버튼 */}
      <View style={styles.bottomArea}>
        <View style={styles.textBlock}>
          <Text style={styles.headerTitle}>가족 모임이 준비되었어요</Text>
          <Text style={styles.headerSubTitle}>
            가족과 함께 특별한 순간을 만들어보세요
          </Text>
        </View>
      </View>
      <BottomActionButton label="시작하기" onPress={handleButtonClick} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#FFF5E6',
    backgroundColor: 'white',
    paddingHorizontal: getResponsiveWidth(24),
  },

  illustrationArea: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: getResponsiveHeight(24),
  },
  circleBg: {
    position: 'absolute',
    width: getResponsiveWidth(300),
    height: getResponsiveWidth(300),
    borderRadius: getResponsiveWidth(300) / 2,
    // backgroundColor: '#FFDFAF', 제일 연한 노랑
    // backgroundColor: '#FFF8EB', 중간 노랑
    backgroundColor: '#FFF3DE',
    opacity: 1,
    top: getResponsiveHeight(90),
  },
  mainImage: {
    width: '60%',
    aspectRatio: 1.1,
    marginBottom: getResponsiveHeight(65),
  },

  bottomArea: {
    flex: 0.9,
    justifyContent: 'space-between',
    paddingBottom: getResponsiveHeight(30),
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: getResponsiveHeight(16),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(30),
    marginBottom: getResponsiveHeight(6),
  },
  headerSubTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(20),
  },
});
