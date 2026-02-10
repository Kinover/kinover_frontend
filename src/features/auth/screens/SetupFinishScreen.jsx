// SetupFinishScreen.tsx
import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  Platform,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import BottomActionButton from 'components/BottomActionButton';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {setHasFamily} from 'utils/storage';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';

// ✅✅✅ 추가: 전역 트리거 키 (useGuide에서 쓰는 키와 동일해야 함)
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY_GUIDE_ENTRY_TRIGGER = '@kinover/guide/entry_trigger_v1';

export default function SetupFinishScreen() {
  const handleButtonClick = useCallback(async () => {
    try {
      await setHasFamily(true);
  
      // ✅ 가족 생성/참가 완료 직후: 가이드 노출 자격 ON
      await AsyncStorage.setItem(KEY_GUIDE_ENTRY_TRIGGER, '1');
  
      emitAuthFlagsChanged({hasFamily: true});
    } catch (e) {
      console.log('[SetupFinishScreen] start error:', e);
    }
  }, []);

  // 애니메이션 값들
  const illustrationScale = useRef(new Animated.Value(0.9)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;
  const illustrationTranslateY = useRef(new Animated.Value(24)).current;

  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslateY = useRef(new Animated.Value(24)).current;

  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const intro = Animated.parallel([
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
    ]);

    const loop = Animated.loop(
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
    );

    intro.start(() => loop.start());

    return () => {
      intro.stop();
      loop.stop();
    };
  }, [
    illustrationOpacity,
    illustrationScale,
    illustrationTranslateY,
    bottomOpacity,
    bottomTranslateY,
    pulseScale,
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
        <Image
          style={styles.mainImage}
          source={require('@/assets/images/familySetup_kinoFamily.png')}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomArea,
          {
            opacity: bottomOpacity,
            transform: [{translateY: bottomTranslateY}],
          },
        ]}>
        <View style={styles.textBlock}>
          <Text allowFontScaling={false} style={styles.headerTitle}>
            가족 모임 준비 완료!
          </Text>
          <Text allowFontScaling={false} style={styles.headerSubTitle}>
            이제 키노와 함께 가족의 하루를 나누고{'\n'}
            소중한 순간들을 편하게 기록해 보세요.
          </Text>
        </View>
      </Animated.View>

      <BottomActionButton label="시작하기" onPress={handleButtonClick} />
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
    resizeMode: 'contain',
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
