// src/features/onboarding/screens/SetupFinishScreen.js
import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Text,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import mmkvStorage from 'utils/mmkvStorage';
import {useStore, useDispatch} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';

import BottomActionButton from 'components/BottomActionButton';
import {clearPhoneVerificationPending, setSkipFamilyMainEntry} from 'features/auth/store/loginSlice';
import {
  getResponsiveFontSizeIgnoreAppMode,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

import {
  setHasFamily,
  clearSignupOnboardingAux,
  setNeedsSignup,
  skipFamilySetupAndComplete,
  getAuthRoutingMmkvSnapshotSync,
} from 'utils/storage';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';
import {
  KEY_GUIDE_ENTRY_TRIGGER,
  KEY_FIRST_ENTRY_AFTER_SETUP,
  resetGuideShownKeys,
} from 'hooks/useGuide';

import {fetchUserThunk} from 'features/home/store/userThunk';
import {
  fetchFamilyThunk,
  fetchFamilyStatusThunk,
} from 'features/home/store/familyThunk';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';
import {baseApi} from 'services/baseApi';
import {FONTS} from 'styles/typography';
import {resetToMainAppFlow} from 'app/navigation/navigationService';

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
    paddingBottom:getResponsiveHeight(52),
  },
  circleImageWrapper: {
    width: getResponsiveWidth(260),
    height: getResponsiveWidth(260),
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBg: {
    position: 'absolute',
    width: getResponsiveWidth(260),
    height: getResponsiveWidth(260),
    borderRadius: getResponsiveWidth(260) / 2,
    backgroundColor: '#FFF3DE',
    opacity: 0.9,
  },
  mainImage: {
    width: '78%',
    height: '78%',
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
    fontSize: getResponsiveFontSizeIgnoreAppMode(24),
    fontFamily: FONTS.SEMI_BOLD,
    color: '#161823',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(30),
    marginBottom: getResponsiveHeight(10),
  },
  headerSubTitle: {
    fontSize: getResponsiveFontSizeIgnoreAppMode(13.5),
    fontFamily: FONTS.REGULAR,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(20),
  },
});

export default function SetupFinishScreen() {
  const store = useStore();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const fromAppFlow = route.params?.fromAppFlow === true;
  const routeSkippedFamily = route.params?.skippedFamilySetup === true;
  const mmkvSkipPending =
    getAuthRoutingMmkvSnapshotSync().familySkipPendingFinish === true;
  const skippedFamilySetup = routeSkippedFamily || mmkvSkipPending;

  /** RTK getUser만 갱신하면 홈은 되지만, 일정/채팅/추억 등은 Redux user·family·userFamily를 쓰므로 스토어까지 동기화 */
  const syncUserAndFamilyToStore = useCallback(async () => {
    const userPayload = await withTimeout(
      store.dispatch(fetchUserThunk()).unwrap(),
      8000,
    );
    const familyId =
      userPayload?.familyId ?? userPayload?.family?.familyId ?? null;
    if (!familyId) return;

    const run = async thunkPromise =>
      withTimeout(thunkPromise, 8000);

    try {
      await run(store.dispatch(fetchFamilyThunk(familyId)));
    } catch {
      null;
    }
    try {
      await run(store.dispatch(fetchFamilyUserListThunk(familyId)));
    } catch {
      null;
    }
    try {
      await run(store.dispatch(fetchFamilyStatusThunk(familyId)));
    } catch {
      null;
    }

    store.dispatch(baseApi.util.invalidateTags(['ChatRoom']));
  }, [store]);

  const handleButtonClick = useCallback(async () => {
    try {
      if (skippedFamilySetup) {
        // 라우팅·MMKV를 네트워크보다 먼저 (fetch 대기로 홈 전환이 막히지 않게)
        skipFamilySetupAndComplete();
        dispatch(setSkipFamilyMainEntry(true));
        dispatch(clearPhoneVerificationPending());
        emitAuthFlagsChanged();
        if (fromAppFlow) {
          navigation.navigate('Tabs');
        } else {
          resetToMainAppFlow('홈');
        }
        void (async () => {
          try {
            await mmkvStorage.setItem(KEY_FIRST_ENTRY_AFTER_SETUP, '1');
            try {
              await store.dispatch(fetchUserThunk()).unwrap();
            } catch {
              null;
            }
            await resetGuideShownKeys();
            await mmkvStorage.setItem(KEY_GUIDE_ENTRY_TRIGGER, '1');
          } catch {
            null;
          }
        })();
        return;
      }

      await clearSignupOnboardingAux();
      await setNeedsSignup(false);

      await mmkvStorage.setItem(KEY_FIRST_ENTRY_AFTER_SETUP, '1');
      await setHasFamily(true);

      await resetGuideShownKeys();
      await mmkvStorage.setItem(KEY_GUIDE_ENTRY_TRIGGER, '1');

      emitAuthFlagsChanged({hasFamily: true});

      if (fromAppFlow) {
        navigation.navigate('Tabs');
      } else {
        resetToMainAppFlow('홈');
      }

      void (async () => {
        try {
          await syncUserAndFamilyToStore();
          await sleep(300);
          await syncUserAndFamilyToStore();
        } catch (e) {
          null;
        }
      })();
    } catch (e) {
      null;
    }
  }, [
    syncUserAndFamilyToStore,
    fromAppFlow,
    navigation,
    skippedFamilySetup,
    store,
    dispatch,
  ]);

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
        <View style={styles.circleImageWrapper}>
          <View style={styles.circleBg} />
          <Image
            style={styles.mainImage}
            source={require('@/assets/images/familySetup_kinoFamily.png')}
          />
        </View>
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
            {skippedFamilySetup
              ? '이제 가족과 연결해 볼까요?'
              : '가족 모임 준비 완료!'}
          </Text>
          <Text allowFontScaling={false} style={styles.headerSubTitle}>
            {skippedFamilySetup
              ? '가족 코드는 홈에서 입력하면 돼요.\n시작하기를 누르면 홈으로 들어가요.'
              : `이제 키노와 함께 가족의 하루를 나누고${'\n'}소중한 순간들을 편하게 기록해 보세요.`}
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

