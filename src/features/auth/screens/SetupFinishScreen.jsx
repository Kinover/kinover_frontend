// src/features/onboarding/screens/SetupFinishScreen.js
import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Image,
  Text,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import mmkvStorage from 'utils/mmkvStorage';
import {useStore} from 'react-redux';

import BottomActionButton from 'components/BottomActionButton';
import {
  getResponsiveFontSizeIgnoreAppMode,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

import {setHasFamily} from 'utils/storage';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';
import {
  KEY_GUIDE_ENTRY_TRIGGER,
  KEY_FIRST_ENTRY_AFTER_SETUP,
  resetGuideShownKeys,
} from 'hooks/useGuide';

import {homeApi} from 'features/home/services/homeApi';

const sleep = ms => new Promise(res => setTimeout(res, ms));

const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

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
    width: '55%',
    resizeMode: 'contain',
    top: getResponsiveHeight(80),
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
    fontSize: getResponsiveFontSizeIgnoreAppMode(24),
    fontFamily: 'Pretendard-SemiBold',
    color: '#161823',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(30),
    marginBottom: getResponsiveHeight(10),
  },
  headerSubTitle: {
    fontSize: getResponsiveFontSizeIgnoreAppMode(13.5),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(20),
  },
});

export default function SetupFinishScreen() {
  const store = useStore();

  const fetchUserOnce = useCallback(async () => {
    const result = store.dispatch(
      homeApi.endpoints.getUser.initiate(undefined, {forceRefetch: true}),
    );
    await withTimeout(result.unwrap(), 8000);
  }, [store]);

  const handleButtonClick = useCallback(async () => {
    try {
      // 0) 첫 진입 플래그 먼저 설정 (홈 마운트 전에 있어야 감정 모달 안 뜨고 가이드만 뜸)
      await mmkvStorage.setItem(KEY_FIRST_ENTRY_AFTER_SETUP, '1');

      // 1) 가족 생성/참가 완료 상태 저장
      await setHasFamily(true);

      // 2) 유저 정보 fetch (메인 진입 전에 최신값 확보)
      // - 저장 반영 타이밍 때문에 “짧게 2번”이 가장 안전
      try {
        await fetchUserOnce();
        await sleep(300);
        await fetchUserOnce();
      } catch (e) {
        // fetch 실패해도 아래는 진행 (UX 끊기지 않게)
      }

      await resetGuideShownKeys();
      await mmkvStorage.setItem(KEY_GUIDE_ENTRY_TRIGGER, '1');

      // 4) 메인 진입 트리거
      emitAuthFlagsChanged({hasFamily: true});
    } catch (e) {
      null;
    }
  }, [fetchUserOnce]);

  // 애니메이션 값들
  const illustrationScale = useRef(new Animated.Value(0.9)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;
  const illustrationTranslateY = useRef(new Animated.Value(24)).current;

  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const bottomTranslateY = useRef(new Animated.Value(24)).current;

  const pulseScale = useRef(new Animated.Value(1)).current;

  // 첫 진입 플래그를 화면 마운트 시 미리 설정 (홈 진입 시 레이스 방지)
  useEffect(() => {
    (async () => {
      try {
        await mmkvStorage.setItem(KEY_FIRST_ENTRY_AFTER_SETUP, '1');
      } catch (_) {
        null;
      }
    })();
  }, []);

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

      <BottomActionButton
        useAppFontScaling={false}
        label="시작하기"
        onPress={handleButtonClick}
      />
    </SafeAreaView>
  );
}

