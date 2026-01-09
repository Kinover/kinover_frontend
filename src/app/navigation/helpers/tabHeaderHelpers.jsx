// src/utils/navigationRenderers.js
import React, {memo} from 'react';
import {Platform, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import FastImage from '@d11/react-native-fast-image';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {BUTTON_STYLES, HEADER_STYLES} from 'styles/style';
import {hapticLight} from 'utils/haptic';

/** ---------------------------------------------------
 * ✅ 공통: 아이콘 위에 빨간 점/숫자 뱃지 얹는 컴포넌트
 * --------------------------------------------------- */
const IconWithBadge = memo(function IconWithBadge({
  source,
  size = 24,
  showDot = false,
  badgeCount = 0,
  dotStyle,
  badgeStyle,
  badgeTextStyle,
  imageStyle,
}) {
  const showBadge = Number(badgeCount || 0) > 0;

  return (
    <View style={styles.iconWrap}>
      <FastImage
        source={source}
        style={[
          {
            width: getResponsiveIconSize(size),
            height: getResponsiveIconSize(size),
          },
          imageStyle,
        ]}
        resizeMode={FastImage.resizeMode.contain}
      />

      {/* ✅ 숫자 뱃지 우선 */}
      {showBadge ? (
        <View style={[styles.badge, badgeStyle]}>
          <Text style={[styles.badgeText, badgeTextStyle]} numberOfLines={1}>
            {badgeCount > 99 ? '99+' : String(badgeCount)}
          </Text>
        </View>
      ) : (
        showDot && <View style={[styles.dot, dotStyle]} />
      )}
    </View>
  );
});

/** ---------------------------------------------------
 * ✅ 탭바 아이콘 (알림 탭일 때: "bell 전용" unreadCount 표시)
 * --------------------------------------------------- */
export const TabBarIcon = memo(function TabBarIcon({
  focused,
  focusedUri,
  defaultUri,
  tabName,
}) {
  const hasUnread = useSelector(state => state.notification.hasUnread);
  const unreadCount = useSelector(state => state.notification.unreadCount || 0);

  const size = Platform.OS === 'ios' ? 22 : 24;

  const isAlarmTab = tabName === '알림';
  const badgeCount = isAlarmTab ? unreadCount : 0;
  const showDot = isAlarmTab ? !!hasUnread : false;

  return (
    <IconWithBadge
      source={{uri: focused ? focusedUri : defaultUri}}
      size={size}
      badgeCount={badgeCount}
      showDot={showDot}
      dotStyle={styles.tabDot}
      badgeStyle={styles.tabBadge}
      badgeTextStyle={styles.tabBadgeText}
    />
  );
});

/** ---------------------------------------------------
 * ✅ 탭바 라벨
 * --------------------------------------------------- */
export const renderTabBarLabel = (label, focused) => (
  <Text
    style={
      Platform.OS === 'ios'
        ? {
            color: focused ? BUTTON_STYLES.saveBg : 'gray',
            fontSize: getResponsiveFontSize(11),
            marginTop: getResponsiveHeight(6),
          }
        : {
            color: focused ? BUTTON_STYLES.saveBg : 'gray',
            fontSize: getResponsiveFontSize(12),
            marginTop: getResponsiveHeight(6),
          }
    }>
    {label}
  </Text>
);

/** ---------------------------------------------------
 * ✅ 공통 아이콘 버튼 생성기 (햅틱 포함)
 * --------------------------------------------------- */
const createIconButton = (
  onPress,
  imageSource,
  size,
  margin = {},
  additionalStyle = {},
) => (
  <TouchableOpacity
    onPress={() => {
      hapticLight();
      onPress?.();
    }}
    activeOpacity={0.8}>
    <FastImage
      source={imageSource}
      style={{
        width: getResponsiveIconSize(size),
        height: getResponsiveIconSize(size),
        ...margin,
        ...additionalStyle,
      }}
      resizeMode={FastImage.resizeMode.contain}
    />
  </TouchableOpacity>
);

/** ---------------------------------------------------
 * ✅ 헤더: 로고(좌측 작은 로고)
 * --------------------------------------------------- */
export const RenderHeaderTitleLogo = () => (
  <View style={{paddingBottom: getResponsiveHeight(14)}}>
    <FastImage
      source={require('@/assets/icons/kino-logo.png')}
      style={{
        top: getResponsiveHeight(4),
        width: getResponsiveWidth(40),
        height: getResponsiveHeight(40),
        resizeMode: 'contain',
        marginLeft: getResponsiveWidth(16),
      }}
    />
  </View>
);

/** --------------------------------------------------- * ✅ RenderHeaderBook (홈에서만 흰색 tint 원하면 여기에도 적용) * --------------------------------------------------- */
export const RenderHeaderBook = ({navigation, currentScreen = '홈'}) => {
  const bookIcon = require('@/assets/icons/book.png');
  const tint = currentScreen === '홈' ? '#FFFFFF' : '#525252';
  const goBook = () =>
    navigation.navigate('Tabs', {
      screen: '추억',
      params: {screen: '매거진화면'},
    });
  return (
    <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
      <TouchableOpacity
        onPress={() => {
          hapticLight();
          goBook();
        }}
        activeOpacity={0.8}>
        <FastImage
          source={bookIcon}
          style={{
            marginLeft: getResponsiveWidth(16),
            width: getResponsiveIconSize(26),
            height: getResponsiveIconSize(26),
          }}
          resizeMode={FastImage.resizeMode.contain}
          tintColor={tint}
        />
      </TouchableOpacity>
    </View>
  );
};

/** ---------------------------------------------------
 * ✅ 헤더: 홈(종 + 설정)
 * - ✅ 설정 눌렀을 때와 "완전히 동일한 방식"으로 종도 이동:
 *   navigation.navigate('Tabs', { screen: currentScreen, params: { screen: '알림화면' } })
 * --------------------------------------------------- */

export const RenderHeaderHome = ({navigation, currentScreen}) => {
  const hasUnread = useSelector(state => state.notification.hasUnread);
  const unreadCount = useSelector(state => state.notification.unreadCount || 0);

  const isHome = currentScreen === '홈';
  // const iconTint = isHome ? undefined : '#525252';
  const iconTint = isHome ? undefined : 'black';


  const bellIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/header/bell_filled.png')
      : require('@/assets/icons/header/bell_filled_dark.png');

  const settingIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/header/setting_filled.png')
      : require('@/assets/icons/header/setting_filled_dark.png');

  // ✅ 설정이랑 같은 패턴: "현재 탭(currentScreen) 스택 안"으로 이동
  const goAlarm = () =>
    navigation.navigate('Tabs', {
      screen: currentScreen,
      params: {screen: '알림화면'},
    });

  const goSetting = () =>
    navigation.navigate('Tabs', {
      screen: currentScreen,
      params: {screen: '설정화면'},
    });

  return (
    <View style={{flexDirection: 'row', marginRight: getResponsiveWidth(20)}}>
      {/* ✅ 종(뱃지/빨간점 포함) */}
      <TouchableOpacity
        onPress={() => {
          hapticLight();
          goAlarm();
        }}
        activeOpacity={0.8}>
        <IconWithBadge
          source={bellIcon}
          size={25}
          badgeCount={unreadCount}
          showDot={!!hasUnread}
          dotStyle={styles.headerDot}
          badgeStyle={styles.headerBadge}
          badgeTextStyle={styles.headerBadgeText}
        />
      </TouchableOpacity>
      <View style={{width: getResponsiveWidth(12)}} />
      {/* ⚙️ 설정 */}
      {createIconButton(
        goSetting,
        settingIcon,
        25,
        iconTint ? {tintColor: iconTint} : {},
      )}
    </View>
  );
};

/** ---------------------------------------------------
 * ✅ 나머지 헤더 버튼들
 * --------------------------------------------------- */
export const RenderHeaderLeft1 = ({navigation}) =>
  createIconButton(
    () =>
      navigation.navigate('Tabs', {
        screen: '감정',
        params: {screen: '알림화면'},
      }),
    require('@/assets/images/navigator_alarm-button.png'),
    HEADER_STYLES.headerLeftIconWidth,
    {marginLeft: HEADER_STYLES.headerLeftIconLeftPadding},
  );

export const RenderHeaderRightSetting = ({navigation}) =>
  createIconButton(
    () =>
      navigation.navigate('Tabs', {
        screen: '홈',
        params: {screen: '설정화면'},
      }),
    require('@/assets/images/setting_bt.png'),
    HEADER_STYLES.headerRightIconWidth,
    {marginRight: HEADER_STYLES.headerRightIconRightPadding},
  );

export const RenderHeaderRightChatSetting = ({setIsSettingsOpen}) =>
  createIconButton(
    () => setIsSettingsOpen(true),
    require('@/assets/icons/List.png'),
    HEADER_STYLES.headerRightIconWidth,
    {marginRight: HEADER_STYLES.headerRightIconRightPadding},
  );

export const RenderHeaderDeletePost = () =>
  createIconButton(
    () => {},
    require('@/assets/images/trash.png'),
    HEADER_STYLES.headerRightIconWidth,
    {marginRight: HEADER_STYLES.headerRightIconRightPadding},
    {zIndex: 999},
  );

export const RenderGoBackButton = ({navigation}) =>
  createIconButton(
    () => navigation.goBack(),
    require('@/assets/icons/caretDown.png'),
    HEADER_STYLES.headerLeftIconWidth,
    {marginLeft: HEADER_STYLES.headerLeftIconLeftPadding},
    {zIndex: 999},
  );

export const RenderGoBackButtonGallery = ({navigation}) =>
  createIconButton(
    () => navigation.goBack(),
    require('@/assets/images/navigator_goback-button.png'),
    HEADER_STYLES.headerLeftIconWidth,
    {marginLeft: HEADER_STYLES.headerLeftIconLeftPadding},
    {zIndex: 999},
  );

/** ---------------------------------------------------
 * ✅ 헤더: 로고(상단 Kinover 로고)
 * - ✅ 종이랑 "동일한 이동 방식" 적용
 * - currentScreen 안 주면 기본 '홈' 기준으로 알림화면 이동
 * --------------------------------------------------- */
export const RenderHeaderLogo = ({navigation, currentScreen = '홈'}) => (
  <TouchableOpacity
    onPress={() => {
      hapticLight();
      navigation.navigate('Tabs', {
        screen: currentScreen,
        params: {screen: '알림화면'},
      });
    }}
    style={{flexDirection: 'row', alignItems: 'flex-end'}}>
    <FastImage
      source={require('@/assets/images/kinover.png')}
      style={{
        width: getResponsiveWidth(60),
        height: getResponsiveHeight(60),
        marginLeft: getResponsiveWidth(8),
        resizeMode: 'contain',
      }}
    />
    <Text
      style={{
        position: 'absolute',
        bottom: getResponsiveHeight(6),
        width: getResponsiveWidth(110),
        height: getResponsiveHeight(24),
        fontSize: getResponsiveFontSize(20),
        fontFamily: 'Pretendard-SemiBold',
      }}>
      Kinover
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  iconWrap: {position: 'relative'},

  // ✅ 빨간 점
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FF3B30',
  },

  // ✅ 숫자 뱃지(공통)
  badge: {
    position: 'absolute',
    minWidth: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
    borderRadius: 999,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(4),
  },
  badgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(10),
    fontFamily: 'Pretendard-SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // ✅ 헤더 종 빨간점 위치
  headerDot: {
    top: -2.5,
    right: -2.5,
  },

  // ✅ 탭바 빨간점 위치
  tabDot: {
    top: -2.5,
    right: -2.5,
  },

  // ✅ 헤더 뱃지 위치/크기
  headerBadge: {
    top: -6,
    right: -8,
  },
  headerBadgeText: {
    fontSize: getResponsiveFontSize(10),
  },

  // ✅ 탭 뱃지 위치/크기
  tabBadge: {
    top: -6,
    right: -10,
  },
  tabBadgeText: {
    fontSize: getResponsiveFontSize(10),
  },
});
