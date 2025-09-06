import React from 'react';
import {Platform, Text, TouchableOpacity, View} from 'react-native';

import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../utils/responsive';
import {jsiConfigureProps} from 'react-native-reanimated/lib/typescript/core';
import {useSelector} from 'react-redux';
import FastImage from 'react-native-fast-image';

// ✅ 공통 아이콘 버튼 생성기
const createIconButton = (
  navigationFunc,
  imageSource,
  width,
  height,
  margin = {},
  additionalStyle = {},
) => (
  <TouchableOpacity onPress={navigationFunc}>
    <FastImage
      source={imageSource}
      style={{
        width: getResponsiveWidth(width),
        height: getResponsiveHeight(height),
        ...margin,
        ...additionalStyle,
      }}
      resizeMode={FastImage.resizeMode.contain}
    />
  </TouchableOpacity>
);

// ✅ 탭바 아이콘 및 라벨 렌더러

// ✅ 공통 TabBar 아이콘
export const renderTabBarIcon = (focused, focusedUri, defaultUri, tabName) => {
  const hasUnread = useSelector(state => state.notification.hasUnread);

  return (
    <View style={{position: 'relative'}}>
      <FastImage
        source={{uri: focused ? focusedUri : defaultUri}}
        style={
          Platform.OS === 'ios'
            ? {
                width: getResponsiveIconSize(25),
                height: getResponsiveIconSize(25),
                resizeMode: 'contain',
              }
            : {
                width: getResponsiveIconSize(27.5),
                height: getResponsiveIconSize(27.5),
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
            width: 8,
            height: 8,
            borderRadius: 4,
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
      Platform.OS == 'ios'
        ? {
            color: focused ? '#FFC84D' : 'gray',
            fontSize: getResponsiveFontSize(12),
            marginTop: getResponsiveHeight(8),
          }
        : {
            color: focused ? '#FFC84D' : 'gray',
            fontSize: getResponsiveFontSize(13),
            marginTop: getResponsiveHeight(8),
          }
    }>
    {label}
  </Text>
);

// ✅ 헤더 컴포넌트 모음
export const RenderHeaderTitleLogo = () => (
  <View style={{paddingBottom: getResponsiveHeight(20)}}>
    <FastImage
      source={require('../assets/icons/kino-logo.png')}
      style={{
        top: getResponsiveHeight(6),
        width: getResponsiveWidth(47),
        height: getResponsiveHeight(47),
        resizeMode: 'contain',
        marginLeft: getResponsiveWidth(18),
      }}
    />
  </View>
);

export const RenderHeaderHome = ({navigation, currentScreen}) => {
  const bellIcon =
    currentScreen === '홈'
      ? require('../assets/icons/bell-white.png')
      : require('../assets/icons/bell.png');
  const settingIcon =
    currentScreen === '홈'
      ? require('../assets/icons/setting-white.png')
      : require('../assets/icons/setting.png');

  return (
    <View
      style={{
        // display:'flex',
        flexDirection: 'row',
        marginRight: getResponsiveWidth(25),
      }}>
      {createIconButton(
        () =>
          navigation.navigate('Tabs', {
            screen: currentScreen,
            params: {screen: '알림화면'}, // 동적으로 화면 전환
          }),
        bellIcon,
        getResponsiveIconSize(29),
        getResponsiveIconSize(29),
      )}
      <View
        style={{width: getResponsiveWidth(12.5), justifyContent: 'flex-end'}}
      />
      {createIconButton(
        () =>
          navigation.navigate('Tabs', {
            screen: currentScreen,
            params: {screen: '설정화면'}, // 동적으로 화면 전환
          }),
        settingIcon,
        getResponsiveIconSize(29),
        getResponsiveIconSize(29),
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
    require('../assets/images/navigator_alarm-button.png'),
    getResponsiveIconSize(24),
    getResponsiveIconSize(26),
    {marginLeft: getResponsiveWidth(20)},
  );

export const RenderHeaderRightSetting = ({navigation}) =>
  createIconButton(
    () =>
      navigation.navigate('Tabs', {
        screen: '홈',
        params: {screen: '설정화면'},
      }),
    require('../assets/images/setting_bt.png'),
    getResponsiveIconSize(24),
    getResponsiveIconSize(26),
    {marginRight: getResponsiveWidth(20)},
  );

export const RenderHeaderRightChatSetting = ({setIsSettingsOpen}) =>
  createIconButton(
    () => setIsSettingsOpen(true),
    require('../assets/images/dots2.png'),
    21,
    25,
    {marginRight: getResponsiveWidth(30)},
  );

export const RenderHeaderDeletePost = () =>
  createIconButton(
    () => {},
    require('../assets/images/trash.png'),
    24, // 조금 크게
    24,
    {marginRight: getResponsiveWidth(20)},
    {zIndex: 999},
  );

export const RenderGoBackButton = ({navigation}) =>
  createIconButton(
    () => navigation.goBack(),
    require('../assets/icons/caretDown.png'),
    30,
    30,
    {marginLeft: getResponsiveWidth(20)},
    {zIndex: 999},
  );

export const RenderGoBackButtonGallery = ({navigation}) =>
  createIconButton(
    () => navigation.goBack(),
    require('../assets/images/navigator_goback-button.png'),
    9,
    20,
    {marginLeft: getResponsiveWidth(25)},
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
      source={require('../assets/images/kinover.png')}
      style={{
        width: getResponsiveWidth(70),
        height: getResponsiveHeight(70),
        marginLeft: getResponsiveWidth(10),
        resizeMode: 'contain',
      }}
    />
    <Text
      style={{
        position: 'absolute',
        bottom: getResponsiveHeight(8),
        width: getResponsiveWidth(120),
        height: getResponsiveHeight(30),
        fontSize: getResponsiveFontSize(24),
        fontFamily: 'Pretendard-SemiBold',
      }}>
      Kinover
    </Text>
  </TouchableOpacity>
);
