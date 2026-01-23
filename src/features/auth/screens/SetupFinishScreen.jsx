// SetupFinishScreen.tsx - Refined Animated Version

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Text, Animated, Easing, Platform} from 'react-native';
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
  const illustrationScale = useRef(new Animated.Value(0.9)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;
  const illustrationTranslateY = useRef(new Animated.Value(24)).current;

  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslateY = useRef(new Animated.Value(24)).current;

  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(illustrationOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(illustrationScale, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.back(1.25)),
        useNativeDriver: true,
      }),
      Animated.timing(illustrationTranslateY, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(bottomOpacity, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bottomTranslateY, {
            toValue: 0,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.03,
            duration: 1100,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 1100,
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
      {/* 상단 일러스트 영역 */}
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

      {/* 텍스트 영역 */}
      <Animated.View
        style={[
          styles.bottomArea,
          {
            opacity: bottomOpacity,
            transform: [{translateY: bottomTranslateY}],
          },
        ]}>
        <View style={styles.textBlock}>
          <Text allowFontScaling={false} style={styles.headerTitle}>가족 모임 준비 완료!</Text>
          <Text allowFontScaling={false} style={styles.headerSubTitle}>
            이제 키노와 함께 가족의 하루를 나누고,{'\n'}
            소중한 순간들을 편하게 기록해 보세요.
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getResponsiveWidth(24),
  },

  illustrationArea: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: getResponsiveHeight(22),
  },
  circleBg: {
    position: 'absolute',
    width: getResponsiveWidth(260),
    height: getResponsiveWidth(260),
    borderRadius: getResponsiveWidth(260) / 2,
    backgroundColor: '#FFF3DE',
    opacity: 0.9,
    top:
      Platform.OS === 'android'
        ? getResponsiveHeight(150)
        : getResponsiveHeight(140),
  },
  mainImage: {
    width: '60%',
    aspectRatio: 1.05,
    marginBottom:
      Platform.OS === 'android'
        ? getResponsiveHeight(36)
        : getResponsiveHeight(30),
  },

  bottomArea: {
    flex: 0.85,
    justifyContent: 'space-between',
    paddingBottom: getResponsiveHeight(22),
  },
  textBlock: {
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(24),
    fontFamily: 'Pretendard-SemiBold',
    color: '#161823',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(30),
    marginBottom: getResponsiveHeight(10),
  },
  headerSubTitle: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(20),
  },
});

