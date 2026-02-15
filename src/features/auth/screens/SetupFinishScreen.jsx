// src/features/onboarding/screens/SetupFinishScreen.js
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';

import BottomActionButton from 'components/BottomActionButton';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {setHasFamily} from 'utils/storage';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';
import {
  KEY_GUIDE_ENTRY_TRIGGER,
  KEY_FIRST_ENTRY_AFTER_SETUP,
  resetGuideShownKeys,
} from 'hooks/useGuide';

import {fetchUserThunk} from 'features/home/store/userThunk';

const sleep = ms => new Promise(res => setTimeout(res, ms));

const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

export default function SetupFinishScreen() {
  const dispatch = useDispatch();

  const fetchUserOnce = useCallback(async () => {
    const r = dispatch(fetchUserThunk());

    // thunk가 unwrap 지원하는 케이스
    if (r && typeof r.unwrap === 'function') {
      await withTimeout(r.unwrap(), 8000);
      return;
    }

    // 일반 promise 형태
    if (r && typeof r.then === 'function') {
      await withTimeout(r, 8000);
      return;
    }

    // 혹시 promise가 아니면 한 프레임 양보
    await sleep(0);
  }, [dispatch]);

  const handleButtonClick = useCallback(async () => {
    try {
      // 1) 가족 생성/참가 완료 상태 저장
      await setHasFamily(true);

      // ✅ 2) 유저 정보 fetch (메인 진입 전에 최신값 확보)
      // - 저장 반영 타이밍 때문에 “짧게 2번”이 가장 안전
      try {
        await fetchUserOnce();
        await sleep(300);
        await fetchUserOnce();
      } catch (e) {
        console.log('[SetupFinishScreen] fetchUser failed:', e?.message);
        // fetch 실패해도 아래는 진행 (UX 끊기지 않게)
      }

      // 3) 가이드 다시 보이게: 각 탭 "봤음" 플래그 전부 삭제 (다음 탭 진입 시 가이드 다시 노출)
      await resetGuideShownKeys();
      await AsyncStorage.setItem(KEY_GUIDE_ENTRY_TRIGGER, '1');
      // ✅ 첫 메인 진입 시 이벤트/감정 모달 숨김 (HomeScreen에서 체크 후 삭제)
      await AsyncStorage.setItem(KEY_FIRST_ENTRY_AFTER_SETUP, '1');

      // 4) 메인 진입 트리거
      emitAuthFlagsChanged({hasFamily: true});
    } catch (e) {
      console.log('[SetupFinishScreen] start error:', e);
    }
  }, [fetchUserOnce]);

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
