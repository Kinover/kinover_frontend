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
import {BUTTON_STYLES, HEADER_STYLES, LAYOUT_STYLE} from 'styles/style';
import {hapticLight} from 'utils/haptic';

// ✅ 추가: 전역 네비게이션 서비스 사용
import {safeNavigate} from '../navigationService';
// 경로는 프로젝트 구조에 맞게 조정!
// 만약 현재 파일이 src/utils 밑이라면 보통:
// import {safeNavigate} from '../app/navigation/navigationService';
// 또는
// import {safeNavigate} from '@/app/navigation/navigationService';

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

export const RenderHeaderTitleLogo = () => (
  <View style={{paddingBottom: getResponsiveHeight(14)}}>
    <FastImage
      source={require('@/assets/icons/kino-logo.png')}
      style={{
        top: getResponsiveHeight(4),
        width: getResponsiveWidth(40),
        height: getResponsiveHeight(40),
        resizeMode: 'contain',
        marginLeft: LAYOUT_STYLE.screenPaddingHorizontal - 3,
      }}
    />
  </View>
);

export const RenderHeaderBook = ({navigation, currentScreen = '홈'}) => {
  const bookIcon = require('@/assets/icons/header/magazine.png');
  const tint = currentScreen === '홈' ? '#FFFFFF' : 'black';

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
            width: getResponsiveIconSize(30),
            height: getResponsiveIconSize(30),
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
 * - 🚫 기존: "현재 탭 스택 안으로 알림화면 push" (문제 원인)
 * - ✅ 변경: Tabs 밖 전역 스크린(NotificationModal)로 열기
 * --------------------------------------------------- */
export const RenderHeaderHome = ({navigation, currentScreen}) => {
  const hasUnread = useSelector(state => state.notification.hasUnread);
  const unreadCount = useSelector(state => state.notification.unreadCount || 0);

  const isHome = currentScreen === '홈';
  const iconTint = isHome ? undefined : 'black';

  const bellIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/header/bell_white.png')
      : require('@/assets/icons/header/bell_black.png');

  const settingIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/header/setting_white.png')
      : require('@/assets/icons/header/setting_black.png');

  // ✅ 알림: 전역 모달(탭에 안 보임, 홈스택 안 망가짐)
  const goAlarm = () =>
    safeNavigate('알림화면', {
      fromTab: currentScreen, // ✅ 핵심
    });
  // 설정은 기존대로 "현재 탭 스택 안"으로 이동 (원하면 이것도 전역으로 분리 가능)
  const goSetting = () =>
    navigation.navigate('Tabs', {
      screen: currentScreen,
      params: {screen: '설정화면'},
    });

  return (
    <View
      style={{
        flexDirection: 'row',
        marginRight: LAYOUT_STYLE.screenPaddingHorizontal,
      }}>
      <TouchableOpacity
        onPress={() => {
          hapticLight();
          goAlarm();
        }}
        activeOpacity={0.8}>
        <IconWithBadge
          source={bellIcon}
          size={28}
          badgeCount={unreadCount}
          showDot={!!hasUnread}
          dotStyle={styles.headerDot}
          badgeStyle={styles.headerBadge}
          badgeTextStyle={styles.headerBadgeText}
        />
      </TouchableOpacity>

      <View style={{width: getResponsiveWidth(12)}} />

      {createIconButton(
        goSetting,
        settingIcon,
        28,
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
    // 🚫 기존: Tabs 안의 감정탭/알림화면으로 보내는 패턴은 홈스택 오염 가능
    // ✅ 변경: 전역 알림 모달로 통일
    () => safeNavigate('알림화면'),
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

export const RenderNotificationBackButton = ({navigation, route}) => {
  const fromTab = route?.params?.fromTab;
  const fromScreen = route?.params?.fromScreen;
  const fromParams = route?.params?.fromParams;

  const onPress = () => {
    hapticLight();

    if (fromTab) {
      navigation.navigate('Tabs', {
        screen: fromTab,
        params: fromScreen
          ? {screen: fromScreen, params: fromParams}
          : undefined,
      });
      return;
    }

    navigation.goBack();
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <FastImage
        source={require('@/assets/icons/caretDown.png')}
        style={{
          width: getResponsiveIconSize(24),
          height: getResponsiveIconSize(24),
          marginLeft: HEADER_STYLES.headerLeftIconLeftPadding,
        }}
        resizeMode={FastImage.resizeMode.contain}
      />
    </TouchableOpacity>
  );
};

/** ---------------------------------------------------
 * ✅ 헤더: 로고(상단 Kinover 로고)
 * - 기존엔 "알림화면 이동"으로 연결돼 있었는데, 이 역시 홈스택 오염 원인 가능
 * - ✅ 변경: 전역 알림 모달로 통일
 * --------------------------------------------------- */
export const RenderHeaderLogo = ({navigation, currentScreen = '홈'}) => (
  <TouchableOpacity
    onPress={() => {
      hapticLight();
      safeNavigate('알림화면');
    }}
    style={{flexDirection: 'row', alignItems: 'flex-end'}}>
    <FastImage
      source={require('@/assets/images/kinover.png')}
      style={{
        width: getResponsiveWidth(60),
        height: getResponsiveHeight(60),
        marginRight: LAYOUT_STYLE.screenPaddingHorizontal,
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

  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FF3B30',
  },

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

  headerDot: {top: -2.5, right: -2.5},
  tabDot: {top: -2.5, right: -2.5},

  headerBadge: {top: -6, right: -8},
  headerBadgeText: {fontSize: getResponsiveFontSize(10)},

  tabBadge: {top: -6, right: -10},
  tabBadgeText: {fontSize: getResponsiveFontSize(10)},
});
