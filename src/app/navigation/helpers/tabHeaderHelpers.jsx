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
import {CommonActions} from '@react-navigation/native';

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
 * - 채팅 알림/채팅 unread는 여기로 들어오면 안 됨
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
 * ✅ 헤더: 로고
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

/**
 * ✅ Tabs 강제 이동 (알림탭으로 확실히 보내기)
 */
function goToAlarmTab(navigation) {
  // 1) Tabs -> 알림 탭으로 강제
  try {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Tabs',
        params: {screen: '알림'},
      }),
    );
    return;
  } catch {
    null;
  }

  // 2) fallback (구조가 다를 때)
  try {
    navigation.navigate('Tabs', {
      screen: '홈',
      params: {screen: '알림화면'},
    });
  } catch {
    null;
  }
}

/** ---------------------------------------------------
 * ✅ 헤더: 홈(종 + 설정)
 * - 종: bell 전용 unreadCount(숫자) 우선, 없으면 빨간 점
 * - ✅ 채팅 푸시로 bell 상태가 변하면 안 됨(그건 listener에서 이미 차단)
 * --------------------------------------------------- */
export const RenderHeaderHome = ({navigation, currentScreen}) => {
  const hasUnread = useSelector(state => state.notification.hasUnread);
  const unreadCount = useSelector(state => state.notification.unreadCount || 0);

  const bellIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/header/bell_filled.png')
      : require('@/assets/icons/header/bell_filled_dark.png');

  const settingIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/header/setting_filled.png')
      : require('@/assets/icons/header/setting_filled_dark.png');

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
          goToAlarmTab(navigation);
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

      {/* ✅ 설정 */}
      {createIconButton(goSetting, settingIcon, 25, {})}
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

export const RenderHeaderLogo = ({navigation}) => (
  <TouchableOpacity
    onPress={() => {
      hapticLight();
      goToAlarmTab(navigation);
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
