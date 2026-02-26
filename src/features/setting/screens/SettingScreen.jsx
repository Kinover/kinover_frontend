/* eslint-disable react-native/no-inline-styles */
// SettingScreen.jsx

import React, {useEffect, useLayoutEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  Alert,
  Pressable,
} from 'react-native';

import {useNavigation, useRoute, StackActions, CommonActions} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  getLastFromTabForGlobalScreen,
  setLastFromTabForGlobalScreen,
  getResetToTabState,
} from 'app/navigation/navigationService';
import {RenderHeaderBackButton} from 'app/navigation/helpers/tabHeaderHelpers';

import RNRestart from 'react-native-restart';

import LogoutModal from 'features/home/components/LogoutModal';
import DeleteAccountModal from '../components/DeleteAccountModal';

import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';

import {useLogout} from 'features/auth/hooks/useLogout';
import useHideTabBar from 'hooks/useHideTabBar';
import {SETTING_STYLES} from 'styles/style';

import {
  checkAndAuthBiometric,
  getBiometricAvailability,
} from 'utils/biometrics';

import CustomSwitch from 'components/customSwitch';

import {setFontMode, FONT_MODE, setBioLockEnabled} from 'store/uiSlice';
import {persistor} from 'store';
import {FontModeSliderBlue} from '../components/FontModeSlider';

export default function SettingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const logout = useLogout();
  const dispatch = useDispatch();

  useHideTabBar();

  // 진입 시 복귀할 탭 저장 (params 있으면 사용, 없으면 이미 safeNavigate가 저장한 값 유지 — '홈'으로 덮어쓰지 않음)
  useEffect(() => {
    if (route?.params?.fromTab) {
      setLastFromTabForGlobalScreen(route.params.fromTab);
    } else if (!getLastFromTabForGlobalScreen()) {
      setLastFromTabForGlobalScreen('홈');
    }
  }, [route?.params?.fromTab]);

  // 뒤로가기: pop 사용 → 슬라이드 애니메이션 (detachInactiveScreens: false라 탭 유지)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <RenderHeaderBackButton
          navigation={navigation}
          route={route}
          onBackPressOverride={() => {
            if (navigation.canGoBack()) {
              navigation.dispatch(StackActions.pop(1));
            } else {
              const tab = getLastFromTabForGlobalScreen() || route?.params?.fromTab || '홈';
              navigation.dispatch(CommonActions.reset(getResetToTabState(tab)));
            }
          }}
        />
      ),
    });
  }, [navigation, route]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [bioSupported, setBioSupported] = useState(false);
  const [bioType, setBioType] = useState(null);
  const [bioLoading, setBioLoading] = useState(true);

  const fontMode = useSelector(state => state.ui.fontMode);
  const bioOn = useSelector(state => state.ui.bioLockEnabled);

  const modeToValue = useCallback(m => {
    if (m === FONT_MODE.EXTRA_LARGE) return 2;
    if (m === FONT_MODE.LARGE) return 1;
    return 0;
  }, []);

  const valueToMode = useCallback(v => {
    if (v >= 2) return FONT_MODE.EXTRA_LARGE;
    if (v >= 1) return FONT_MODE.LARGE;
    return FONT_MODE.NORMAL;
  }, []);

  const sliderStep = useMemo(
    () => modeToValue(fontMode),
    [fontMode, modeToValue],
  );

  const openLink = useCallback(async url => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('열 수 없음', '링크를 열 수 없어요.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('오류', '링크를 여는 중 문제가 발생했어요.');
    }
  }, []);

  const openMail = useCallback(async () => {
    const email = 'kinover.service@gmail.com';
    const url = `mailto:${email}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('메일 앱 없음', '메일 앱을 열 수 없어요.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('오류', '메일 앱을 여는 중 문제가 발생했어요.');
    }
  }, []);

  const loadBiometricSetting = useCallback(async () => {
    setBioLoading(true);
    try {
      const avail = await getBiometricAvailability();
      setBioSupported(!!avail?.available);
      setBioType(avail?.biometryType ?? null);
    } finally {
      setBioLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBiometricSetting();
  }, [loadBiometricSetting]);

  const applyFontMode = useCallback(
    nextMode => {
      const safe =
        nextMode === FONT_MODE.EXTRA_LARGE
          ? FONT_MODE.EXTRA_LARGE
          : nextMode === FONT_MODE.LARGE
          ? FONT_MODE.LARGE
          : FONT_MODE.NORMAL;

      if (safe === fontMode) return;

      Alert.alert(
        '적용을 위해 재시작',
        '글씨 크기 변경을 적용하려면 앱을 다시 시작할게요.',
        [
          {text: '취소', style: 'cancel'},
          {
            text: '재시작',
            onPress: async () => {
              dispatch(setFontMode(safe));
              try {
                await persistor.flush();
              } catch (e) {
                null;
              }
              RNRestart.Restart();
            },
          },
        ],
        {cancelable: true},
      );
    },
    [dispatch, fontMode],
  );

  const onToggleBiometric = useCallback(
    async next => {
      if (bioLoading) return;

      // OFF는 즉시 반영
      if (!next) {
        dispatch(setBioLockEnabled(false));
        try {
          await persistor.flush();
        } catch (e) {
          null;
        }
        return;
      }

      // ON 시도
      if (!bioSupported) {
        Alert.alert('사용 불가', '이 기기에서는 생체인식을 사용할 수 없어요.');
        return;
      }

      const res = await checkAndAuthBiometric();

      if (!res?.success) {
        Alert.alert('실패', '인증에 실패했어요. 다시 시도해줘요.');
        return;
      }

      dispatch(setBioLockEnabled(true));
      try {
        await persistor.flush();
      } catch (e) {
        null;
      }
    },
    [bioLoading, bioSupported, dispatch],
  );

  const handlePressCustomSwitch = useCallback(() => {
    if (bioLoading) return;
    onToggleBiometric(!bioOn);
  }, [bioOn, onToggleBiometric, bioLoading]);

  const bioLabel = useMemo(() => {
    return bioType
      ? bioType === 'FaceID'
        ? 'Face ID로 앱 잠금'
        : bioType === 'TouchID'
        ? '지문으로 앱 잠금'
        : '생체인식으로 앱 잠금'
      : '생체인식으로 앱 잠금';
  }, [bioType]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}>
      <Text allowFontScaling={false} style={styles.header}>
        설정
      </Text>

      {/* 1) 화면(글씨 크기) */}
      <View style={styles.section}>
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          화면
        </Text>

        <View style={styles.row}>
          <View style={{flex: 1}}>
            <Text allowFontScaling={false} style={styles.label}>
              글씨 크기
            </Text>
          </View>
        </View>

        <View
          style={{
            paddingTop: getResponsiveHeight(8),
            paddingBottom: getResponsiveHeight(12),
          }}>
          <FontModeSliderBlue
            value={sliderStep}
            onComplete={step => applyFontMode(valueToMode(step))}
          />
        </View>
      </View>

      {/* 2) 알림 */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('알림설정화면')}
          accessibilityLabel="알림 설정"
          accessibilityRole="button">
          <Text allowFontScaling={false} style={styles.label}>
            알림
          </Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
            accessibilityIgnoresInvertColors
          />
        </TouchableOpacity>
      </View>

      {/* 3) 보안(생체인식) */}
      <View style={styles.section}>
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          보안
        </Text>

        <View style={styles.row}>
          <View style={{flex: 1, paddingRight: getResponsiveWidth(10)}}>
            <Text allowFontScaling={false} style={styles.label}>
              {bioLabel}
            </Text>
            {!bioSupported && !bioLoading ? (
              <Text allowFontScaling={false} style={styles.hint}>
                이 기기에서는 사용할 수 없어요
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={handlePressCustomSwitch}
            disabled={bioLoading}
            style={{opacity: bioLoading ? 0.5 : 1}}
            accessibilityLabel={bioOn ? '생체인식 잠금 사용 중' : '생체인식 잠금 끔'}
            accessibilityRole="switch"
            accessibilityState={{checked: !!bioOn}}>
            <CustomSwitch
              isEnabled={!!bioOn}
              toggleSwitch={handlePressCustomSwitch}
            />
          </Pressable>
        </View>
      </View>

      {/* 4) 고객지원 */}
      <View style={styles.section}>
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          고객지원
        </Text>

        <TouchableOpacity style={styles.row} onPress={openMail} activeOpacity={0.8}>
          <Text allowFontScaling={false} style={styles.label}>
            문의하기
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            kinover.service@gmail.com
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5) 약관 및 정책 */}
      <View style={styles.section}>
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          약관 및 정책
        </Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            openLink('https://www.notion.so/2129f61bad50805589f6edfcac083179')
          }>
          <Text allowFontScaling={false} style={styles.label}>
            서비스 이용약관
          </Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            openLink('https://www.notion.so/2129f61bad5080f6bd29e269f5f319b1')
          }>
          <Text allowFontScaling={false} style={styles.label}>
            개인정보처리방침
          </Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
      </View>

      {/* 6) 버전 정보 */}
      <View style={styles.section}>
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          버전 정보
        </Text>
        <View style={styles.row}>
          <Text allowFontScaling={false} style={styles.label}>
            현재 버전
          </Text>
          <Text allowFontScaling={false} style={styles.value}>
            1.1.0
          </Text>
        </View>
      </View>

      {/* 7) 로그인 정보 (맨 아래 고정) */}
      <View style={styles.section}>
        <Text allowFontScaling={false} style={styles.sectionTitle}>
          로그인 정보
        </Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowLogoutModal(true)}>
          <Text allowFontScaling={false} style={styles.label}>
            로그아웃
          </Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowDeleteModal(true)}>
          <Text allowFontScaling={false} style={styles.label}>
            계정 탈퇴
          </Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
      </View>

      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
      />
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

      <View style={{paddingBottom: getResponsiveHeight(20)}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#fff',
    flex: 1,
  },
  container: {
    paddingHorizontal: getResponsiveWidth(18),
    paddingTop: getResponsiveHeight(16),
  },
  header: {
    fontSize: SETTING_STYLES().titleFontSize,
    fontWeight: SETTING_STYLES().titleFontWeight,
    marginBottom: getResponsiveHeight(20),
    color: SETTING_STYLES().titleFontColor,
    fontFamily: SETTING_STYLES().titleFontFamily,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(12.5),
    color: '#888',
    marginTop: getResponsiveHeight(6),
    marginBottom: getResponsiveHeight(6),
    fontFamily: 'Pretendard-Medium',
  },
  hint: {
    marginTop: getResponsiveHeight(3),
    fontSize: getResponsiveFontSize(11.5),
    color: '#A0A0A0',
    fontFamily: 'Pretendard-Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(10),
  },
  label: {
    fontSize: SETTING_STYLES().labelFontSize,
    color: SETTING_STYLES().labelFontColor,
    fontFamily: SETTING_STYLES().labelFontFamily,
  },
  value: {
    fontSize: getResponsiveFontSize(13),
    color: '#555',
    fontFamily: 'Pretendard-Regular',
  },
  arrow: {
    width: getResponsiveIconSize(11),
    height: getResponsiveIconSize(11),
    resizeMode: 'contain',
  },
  section: {
    borderBottomWidth: 0.5,
    borderColor: '#E5E5E5',
    paddingVertical: getResponsiveHeight(6),
  },
});
