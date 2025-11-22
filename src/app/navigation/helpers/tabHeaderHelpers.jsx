import React from 'react';
import {Platform, Text, TouchableOpacity, View} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {useSelector} from 'react-redux';
import FastImage from '@d11/react-native-fast-image';
import {HEADER_STYLES} from 'styles/style';

// ✅ 공통 아이콘 버튼 생성기 (size는 "기본 px" 개념으로만 넘기면 됨)
const createIconButton = (
  navigationFunc,
  imageSource,
  sizeWidth,
  sizeHeight,
  margin = {},
  additionalStyle = {},
) => (
  <TouchableOpacity onPress={navigationFunc} activeOpacity={0.8}>
    <FastImage
      source={imageSource}
      style={{
        width: getResponsiveIconSize(sizeWidth),
        height: getResponsiveIconSize(sizeHeight),
        ...margin,
        ...additionalStyle,
      }}
      resizeMode={FastImage.resizeMode.contain}
    />
  </TouchableOpacity>
);

// ✅ 탭바 아이콘 및 라벨 렌더러

export const renderTabBarIcon = (focused, focusedUri, defaultUri, tabName) => {
  const hasUnread = useSelector(state => state.notification.hasUnread);

  return (
    <View style={{position: 'relative'}}>
      <FastImage
        source={{uri: focused ? focusedUri : defaultUri}}
        style={
          Platform.OS === 'ios'
            ? {
                width: getResponsiveIconSize(22), // 25 → 22
                height: getResponsiveIconSize(22),
                resizeMode: 'contain',
              }
            : {
                width: getResponsiveIconSize(24), // 27.5 → 24
                height: getResponsiveIconSize(24),
                resizeMode: 'contain',
              }
        }
      />
      {/* ✅ 알림 탭일 때만 빨간 점 */}
      {tabName === '알림' && hasUnread && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: 'red',
          }}
        />
      )}
    </View>
  );
};

export const renderTabBarLabel = (label, focused) => (
  <Text
    style={
      Platform.OS === 'ios'
        ? {
            color: focused ? '#FFC84D' : 'gray',
            fontSize: getResponsiveFontSize(11), // 12 → 11
            marginTop: getResponsiveHeight(6),
          }
        : {
            color: focused ? '#FFC84D' : 'gray',
            fontSize: getResponsiveFontSize(12), // 13 → 12
            marginTop: getResponsiveHeight(6),
          }
    }>
    {label}
  </Text>
);

// ✅ 헤더 컴포넌트 모음
export const RenderHeaderTitleLogo = () => (
  <View style={{paddingBottom: getResponsiveHeight(14)}}>
    <FastImage
      source={require('@/assets/icons/kino-logo.png')}
      style={{
        top: getResponsiveHeight(4),
        width: getResponsiveWidth(40), // 47 → 40
        height: getResponsiveHeight(40),
        resizeMode: 'contain',
        marginLeft: getResponsiveWidth(16),
      }}
    />
  </View>
);

export const RenderHeaderHome = ({navigation, currentScreen}) => {
  const bellIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/bell-white.png')
      : require('@/assets/icons/bell.png');
  const settingIcon =
    currentScreen === '홈'
      ? require('@/assets/icons/setting-white.png')
      : require('@/assets/icons/setting.png');

  return (
    <View
      style={{
        flexDirection: 'row',
        marginRight: getResponsiveWidth(16), // 25 → 20
      }}>
      {createIconButton(
        () =>
          navigation.navigate('Tabs', {
            screen: currentScreen,
            params: {screen: '알림화면'},
          }),
        bellIcon,
        24, // 29 → 22
        24,
      )}
      <View
        style={{width: getResponsiveWidth(10), justifyContent: 'flex-end'}}
      />
      {createIconButton(
        () =>
          navigation.navigate('Tabs', {
            screen: currentScreen,
            params: {screen: '설정화면'},
          }),
        settingIcon,
        24,
        24,
      )}
    </View>
  );
};

export const RenderHeaderLeft1 = ({navigation}) =>
  createIconButton(
    () =>
      navigation.navigate('Tabs', {
        screen: '감정',
        params: {screen: '알림화면'},
      }),
    require('@/assets/images/navigator_alarm-button.png'),
    HEADER_STYLES.headerLeftIconWidth,
    HEADER_STYLES.headerLeftIconHeight,
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
    HEADER_STYLES.headerRightIconHeight,
    {marginRight: HEADER_STYLES.headerRightIconRightPadding},
  );

export const RenderHeaderRightChatSetting = ({setIsSettingsOpen}) =>
  createIconButton(
    () => setIsSettingsOpen(true),
    require('@/assets/images/dots2.png'),
    HEADER_STYLES.headerRightIconWidth - 2,
    HEADER_STYLES.headerRightIconHeight,
    {marginRight: HEADER_STYLES.headerRightIconRightPadding},
  );

export const RenderHeaderDeletePost = () =>
  createIconButton(
    () => {},
    require('@/assets/images/trash.png'),
    HEADER_STYLES.headerRightIconWidth,
    HEADER_STYLES.headerRightIconHeight,
    {marginRight: HEADER_STYLES.headerRightIconRightPadding},
    {zIndex: 999},
  );

export const RenderGoBackButton = ({navigation}) =>
  createIconButton(
    () => navigation.goBack(),
    require('@/assets/icons/caretDown.png'),
    HEADER_STYLES.headerLeftIconWidth,
    HEADER_STYLES.headerLeftIconHeight,
    {marginLeft: HEADER_STYLES.headerLeftIconLeftPadding},
    {zIndex: 999},
  );

export const RenderGoBackButtonGallery = ({navigation}) =>
  createIconButton(
    () => navigation.goBack(),
    require('@/assets/images/navigator_goback-button.png'),
    HEADER_STYLES.headerLeftIconWidth,
    HEADER_STYLES.headerLeftIconHeight,
    {marginLeft: HEADER_STYLES.headerLeftIconLeftPadding},
    {zIndex: 999},
  );

export const RenderHeaderLogo = ({navigation}) => (
  <TouchableOpacity
    onPress={() =>
      navigation.navigate('Tabs', {
        screen: '홈',
        params: {screen: '알림화면'},
      })
    }
    style={{flexDirection: 'row', alignItems: 'flex-end'}}>
    <FastImage
      source={require('@/assets/images/kinover.png')}
      style={{
        width: getResponsiveWidth(60), // 70 → 60
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
        fontSize: getResponsiveFontSize(20), // 24 → 20
        fontFamily: 'Pretendard-SemiBold',
      }}>
      Kinover
    </Text>
  </TouchableOpacity>
);
