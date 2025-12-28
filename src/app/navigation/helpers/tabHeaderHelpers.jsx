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

// ✅ 햅틱 유틸 (네가 만든 파일 기준으로 경로만 맞춰줘!)
import {hapticLight} from 'utils/haptic';

/** ---------------------------------------------------
 *  ✅ 공통: 아이콘 위에 빨간 점(뱃지) 얹는 컴포넌트
 *  - hook은 "컴포넌트" 안에서만 씀 (중요)
 *  --------------------------------------------------- */
const IconWithDot = memo(function IconWithDot({
  source,
  size = 24,
  showDot = false,
  dotStyle,
  imageStyle,
}) {
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
      {showDot && <View style={[styles.dot, dotStyle]} />}
    </View>
  );
});

/** ---------------------------------------------------
 *  ✅ 탭바 아이콘 (알림 탭일 때 unread면 빨간점)
 *  - Tab.Navigator screenOptions에서 사용
 *  --------------------------------------------------- */
export const TabBarIcon = memo(function TabBarIcon({
  focused,
  focusedUri,
  defaultUri,
  tabName,
}) {
  const hasUnread = useSelector(state => state.notification.hasUnread);

  const size = Platform.OS === 'ios' ? 22 : 24;
  const showDot = tabName === '알림' && !!hasUnread;

  return (
    <IconWithDot
      source={{uri: focused ? focusedUri : defaultUri}}
      size={size}
      showDot={showDot}
      dotStyle={styles.tabDot}
    />
  );
});

/** ---------------------------------------------------
 *  ✅ 탭바 라벨
 *  --------------------------------------------------- */
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
 *  ✅ 공통 아이콘 버튼 생성기
 *  - ✅ 여기서 햅틱을 공통으로 넣으면 전체 헤더 버튼이 다 통일됨
 *  --------------------------------------------------- */
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
 *  ✅ 헤더: 로고
 *  --------------------------------------------------- */
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

/** ---------------------------------------------------
 *  ✅ 헤더: 홈(종 + 설정)
 *  - 여기서도 unread 빨간점 표시
 *  - ✅ 종/설정 모두 햅틱 적용
 *  --------------------------------------------------- */
export const RenderHeaderHome = ({navigation, currentScreen}) => {
  const hasUnread = useSelector(state => state.notification.hasUnread);
  // const hasUnread = true;

  const bellIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/header/bell_filled.png')
      : require('@/assets/icons/header/bell_filled_dark.png');
  // ? require('@/assets/icons/bell-white.png')
  // : require('@/assets/icons/bell.png');

  const settingIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/header/setting_filled.png')
      : require('@/assets/icons/header/setting_filled_dark.png');
  // ? require('@/assets/icons/setting-white.png')
  // : require('@/assets/icons/setting.png');

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
      {/* ✅ 종(빨간점 포함) + ✅ 햅틱 */}
      <TouchableOpacity
        onPress={() => {
          hapticLight();
          goAlarm();
        }}
        activeOpacity={0.8}>
        <IconWithDot
          source={bellIcon}
          size={25}
          showDot={!!hasUnread}
          dotStyle={styles.headerDot}
        />
      </TouchableOpacity>

      <View style={{width: getResponsiveWidth(12)}} />

      {/* ✅ 설정 (createIconButton 안에서 햅틱 자동 적용됨) */}
      {createIconButton(goSetting, settingIcon, 25, {})}
    </View>
  );
};

/** ---------------------------------------------------
 *  ✅ 나머지 헤더 버튼들 (기존 그대로 + createIconButton에 햅틱이 들어가서 자동 적용됨)
 *  --------------------------------------------------- */
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
      navigation.navigate('Tabs', {
        screen: '홈',
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
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FF3B30',
    // borderWidth: 2,
    // borderColor: '#fff',
  },
  // ✅ 헤더 종 빨간점 (조금 더 눈에 띄게)
  headerDot: {
    top: -2.5,
    right: -2.5,
  },

  // ✅ 탭바 빨간점
  tabDot: {
    top: -2.5,
    right: -2.5,
  },
});
