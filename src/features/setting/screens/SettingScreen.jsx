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
import {SETTING_STYLES, getHeaderStyles} from 'styles/style';

import {
  checkAndAuthBiometric,
  getBiometricAvailability,
} from 'utils/biometrics';

import CustomSwitch from 'components/customSwitch';

import {setBioLockEnabled, BIO_LOCK_STORAGE_KEY} from 'store/uiSlice';
import {persistor} from 'store';
import mmkvStorage from 'utils/mmkvStorage';
import {FONTS} from 'styles/typography';

const INQUIRY_NOTION_URL =
  'https://www.notion.so/Kinover-3429f61bad508089ba77d5c6b12012b5';
const SHOW_APP_LOCK_OPTION = false;

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
    const H = getHeaderStyles();
    navigation.setOptions({
      headerTitle: () => (
        <AppText
          allowFontScaling={false}
          style={{
            fontSize: H.defaultTitleFontSize,
            color: H.defaultTitleFontColor,
            fontFamily: H.defaultTitleFontFamily,
          }}>
          설정
        </AppText>
      ),
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

  const bioOn = useSelector(state => state.ui.bioLockEnabled);

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
        fontFamily: FONTS.MEDIUM,
      },
      hint: {
        marginTop: getResponsiveHeight(3),
        fontSize: rf(11.5),
        color: '#A0A0A0',
        fontFamily: FONTS.REGULAR,
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
        fontFamily: FONTS.REGULAR,
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
    };
  });

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

  const onToggleBiometric = useCallback(
    async next => {
      if (bioLoading) return;

      // OFF는 즉시 반영
      if (!next) {
        dispatch(setBioLockEnabled(false));
        try { await mmkvStorage.setItem(BIO_LOCK_STORAGE_KEY, 'false'); } catch { null; }
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
      try { await mmkvStorage.setItem(BIO_LOCK_STORAGE_KEY, 'true'); } catch { null; }
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
      {/* 1) 알림 */}
      <View style={styles.section}>
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          알림
        </AppText>

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
      </View>

      {/* 3) 보안 */}
      <View style={styles.section}>
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          보안
        </AppText>

        {SHOW_APP_LOCK_OPTION ? (
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
        ) : null}

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

      {/* 4) 고객지원 */}
      <View style={styles.section}>
        <AppText allowFontScaling={false} style={styles.sectionTitle}>
          고객지원
        </AppText>

        <TouchableOpacity
          style={styles.row}
          onPress={() => openLink(INQUIRY_NOTION_URL)}
          activeOpacity={0.8}
          accessibilityLabel="문의하기"
          accessibilityRole="link">
          <AppText allowFontScaling={false} style={styles.label}>
            문의하기
          </AppText>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
            accessibilityIgnoresInvertColors
          />
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
