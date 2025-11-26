// SetupFinishScreen.tsx - Animated Version

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Text, Animated, Easing} from 'react-native';
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

  // 애니메이션 값들
  const illustrationScale = useRef(new Animated.Value(0.8)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;
  const illustrationTranslateY = useRef(new Animated.Value(20)).current;

  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslateY = useRef(new Animated.Value(30)).current;

  // 살짝 통통 튀는 느낌용
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 처음 등장 애니메이션
    Animated.parallel([
      Animated.timing(illustrationOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(illustrationScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(illustrationTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(bottomOpacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bottomTranslateY, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      // 등장 후에는 살짝살짝 커졌다 줄어드는 모션 반복
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.03,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  }, [
    illustrationOpacity,
    illustrationScale,
    illustrationTranslateY,
    bottomOpacity,
    bottomTranslateY,
    pulseScale,
  ]);

  const navigationButton = (
    <BottomActionButton label="시작하기" onPress={handleButtonClick} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 일러스트 영역 (애니메이션 적용) */}
      <Animated.View
        style={[
          styles.illustrationArea,
          {
            opacity: illustrationOpacity,
            transform: [
              {translateY: illustrationTranslateY},
              {scale: Animated.multiply(illustrationScale, pulseScale)},
            ],
          },
        ]}>
        <View style={styles.circleBg} />
        <FastImage
          style={styles.mainImage}
          resizeMode="contain"
          source={require('@/assets/images/familySetup_kinoFamily.png')}
        />
      </Animated.View>

      {/* 텍스트 + 버튼 (슬라이드 업 + 페이드 인) */}
      <Animated.View
        style={[
          styles.bottomArea,
          {
            opacity: bottomOpacity,
            transform: [{translateY: bottomTranslateY}],
          },
        ]}>
        <View style={styles.textBlock}>
          <Text style={styles.headerTitle}>가족 모임이 준비되었어요</Text>
          <Text style={styles.headerSubTitle}>
            가족과 함께 특별한 순간을 만들어보세요
          </Text>
        </View>
      </Animated.View>
      {navigationButton}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
