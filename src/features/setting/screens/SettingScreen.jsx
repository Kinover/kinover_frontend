/* eslint-disable react-native/no-inline-styles */
// SettingScreen.jsx

import React, {useEffect, useLayoutEffect, useState, useCallback, useMemo} from 'react';
import { View, TouchableOpacity, ScrollView, Image, Linking, Alert, Pressable } from 'react-native';

import {useNavigation, useRoute, StackActions, CommonActions} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import AppText from 'components/AppText';
import {
  getLastFromTabForGlobalScreen,
  setLastFromTabForGlobalScreen,
  getResetToTabState,
} from 'app/navigation/navigationService';
import {RenderHeaderBackButton} from 'app/navigation/helpers/tabHeaderHelpers';

import RNRestart from 'react-native-restart';
import * as Keychain from 'react-native-keychain';

import LogoutModal from 'features/home/components/LogoutModal';
import DeleteAccountModal from '../components/DeleteAccountModal';

import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

import {useLogout} from 'features/auth/hooks/useLogout';
import useHideTabBar from 'hooks/useHideTabBar';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {useReduxFontMode} from 'hooks/useReduxFontMode';
import {SETTING_STYLES} from 'styles/style';

import {
  checkAndAuthBiometric,
  getBiometricAvailability,
} from 'utils/biometrics';

import CustomSwitch from 'components/customSwitch';

import {setFontMode, FONT_MODE, setBioLockEnabled} from 'store/uiSlice';
import {persistor} from 'store';
import mmkvStorage from 'utils/mmkvStorage';

const FONT_MODE_STORAGE_KEY = 'ui:fontMode';
const FONT_MODE_KEYCHAIN_SERVICE = 'kinover.ui.fontMode';

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

  const fontMode = useReduxFontMode();
  const [pendingFontMode, setPendingFontMode] = useState(
    fontMode ?? FONT_MODE.NORMAL,
  );
  const bioOn = useSelector(state => state.ui.bioLockEnabled);

  useEffect(() => {
    setPendingFontMode(fontMode ?? FONT_MODE.NORMAL);
  }, [fontMode]);

  const styles = useScaledStyleSheet(rf => {
    const S = SETTING_STYLES();
    return {
      scroll: {
        backgroundColor: '#fff',
        flex: 1,
      },
      container: {
        paddingHorizontal: getResponsiveWidth(20),
        paddingTop: getResponsiveHeight(10),
      },
      header: {
        fontSize: S.titleFontSize,
        fontWeight: S.titleFontWeight,
        marginBottom: getResponsiveHeight(14),
        color: S.titleFontColor,
        fontFamily: S.titleFontFamily,
      },
      sectionTitle: {
        fontSize: rf(12.5),
        color: '#888',
        marginTop: 0,
        marginBottom: getResponsiveHeight(8),
        fontFamily: 'Pretendard-Medium',
      },
      hint: {
        marginTop: getResponsiveHeight(3),
        fontSize: rf(11.5),
        color: '#A0A0A0',
        fontFamily: 'Pretendard-Regular',
      },
      row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: getResponsiveHeight(56),
        paddingVertical: getResponsiveHeight(11),
      },
      rowTextWrap: {
        flex: 1,
        paddingRight: getResponsiveWidth(10),
      },
      label: {
        fontSize: S.labelFontSize,
        color: S.labelFontColor,
        fontFamily: S.labelFontFamily,
      },
      value: {
        fontSize: rf(13),
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
        paddingTop: getResponsiveHeight(10),
        paddingBottom: getResponsiveHeight(8),
      },
      fontSliderWrap: {
        paddingTop: getResponsiveHeight(4),
        paddingBottom: getResponsiveHeight(8),
      },
      fontRowSliderWrap: {
        width: getResponsiveWidth(220),
        alignItems: 'flex-end',
      },
      fontSegmentWrap: {
        flexDirection: 'row',
        borderRadius: getResponsiveWidth(999),
        backgroundColor: '#E5E7EB',
        padding: getResponsiveWidth(3),
      },
      fontSegmentBtn: {
        minWidth: getResponsiveWidth(56),
        paddingVertical: getResponsiveHeight(6),
        paddingHorizontal: getResponsiveWidth(8),
        borderRadius: getResponsiveWidth(999),
        alignItems: 'center',
        justifyContent: 'center',
      },
      fontSegmentBtnActive: {
        backgroundColor: '#FFFFFF',
      },
      fontSegmentText: {
        fontSize: rf(10.5),
        color: '#7B808A',
        fontFamily: 'Pretendard-Medium',
      },
      fontSegmentTextActive: {
        color: '#111827',
        fontFamily: 'Pretendard-SemiBold',
      },
    };
  });

  const fontModeOptions = useMemo(
    () => [
      {mode: FONT_MODE.NORMAL, label: 'S'},
      {mode: FONT_MODE.LARGE, label: 'M'},
      {mode: FONT_MODE.EXTRA_LARGE, label: 'L'},
    ],
    [],
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
      setPendingFontMode(safe);
      Alert.alert(
        '적용을 위해 재시작',
        '글씨 크기 변경을 적용하려면 앱을 다시 시작할게요.',
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => setPendingFontMode(fontMode ?? FONT_MODE.NORMAL),
          },
          {
            text: '재시작',
            onPress: async () => {
              try {
                await mmkvStorage.setItem(FONT_MODE_STORAGE_KEY, safe);
                await Keychain.setInternetCredentials(
                  FONT_MODE_KEYCHAIN_SERVICE,
                  'fontMode',
                  safe,
                );
              } catch (e) {
                null;
              }
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
      <AppText allowFontScaling={false} style={styles.header}>
        설정
      </AppText>

      {/* 1) 화면(글씨 크기) */}
      <View style={styles.section}>
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          화면
        </AppText>

        <View style={styles.row}>
          <View style={{flex: 1}}>
            <AppText allowFontScaling={false} style={styles.label}>
              글씨 크기
            </AppText>
          </View>
          <View style={styles.fontRowSliderWrap}>
            <View style={styles.fontSegmentWrap}>
              {fontModeOptions.map(option => {
                const active = pendingFontMode === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => applyFontMode(option.mode)}
                    style={[
                      styles.fontSegmentBtn,
                      active && styles.fontSegmentBtnActive,
                    ]}>
                    <AppText
                      allowFontScaling={false}
                      style={[
                        styles.fontSegmentText,
                        active && styles.fontSegmentTextActive,
                      ]}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* 2) 알림 */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('알림설정화면')}
          accessibilityLabel="알림 설정"
          accessibilityRole="button">
          <AppText allowFontScaling={false} style={styles.label}>
            알림
          </AppText>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
            accessibilityIgnoresInvertColors
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('차단계정화면')}
          accessibilityLabel="신고 및 차단"
          accessibilityRole="button">
          <AppText allowFontScaling={false} style={styles.label}>
            신고 및 차단
          </AppText>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
            accessibilityIgnoresInvertColors
          />
        </TouchableOpacity>
      </View>

      {/* 3) 보안(생체인식) */}
      <View style={styles.section}>
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          보안
        </AppText>

        <View style={styles.row}>
          <View style={styles.rowTextWrap}>
            <AppText allowFontScaling={false} style={styles.label}>
              {bioLabel}
            </AppText>
            {!bioSupported && !bioLoading ? (
              <AppText allowFontScaling={false} style={styles.hint}>
                이 기기에서는 사용할 수 없어요
              </AppText>
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
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          고객지원
        </AppText>

        <TouchableOpacity style={styles.row} onPress={openMail} activeOpacity={0.8}>
          <AppText allowFontScaling={false} style={styles.label}>
            문의하기
          </AppText>
          <AppText allowFontScaling={false} style={styles.value}>
            kinover.service@gmail.com
          </AppText>
        </TouchableOpacity>
      </View>

      {/* 5) 약관 및 정책 */}
      <View style={styles.section}>
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          약관 및 정책
        </AppText>

        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            openLink('https://www.notion.so/2129f61bad50805589f6edfcac083179')
          }>
          <AppText allowFontScaling={false} style={styles.label}>
            서비스 이용약관
          </AppText>
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
          <AppText allowFontScaling={false} style={styles.label}>
            개인정보처리방침
          </AppText>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
      </View>

      {/* 6) 버전 정보 */}
      <View style={styles.section}>
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          버전 정보
        </AppText>
        <View style={styles.row}>
          <AppText allowFontScaling={false} style={styles.label}>
            현재 버전
          </AppText>
          <AppText allowFontScaling={false} style={styles.value}>
            1.1.0
          </AppText>
        </View>
      </View>

      {/* 7) 로그인 정보 (맨 아래 고정) */}
      <View style={styles.section}>
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          로그인 정보
        </AppText>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowLogoutModal(true)}>
          <AppText allowFontScaling={false} style={styles.label}>
            로그아웃
          </AppText>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowDeleteModal(true)}>
          <AppText allowFontScaling={false} style={styles.label}>
            계정 탈퇴
          </AppText>
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
