import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../utils/responsive';

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
    <Image
      source={imageSource}
      style={{
        width: getResponsiveWidth(width),
        height: getResponsiveHeight(height),
        resizeMode: 'contain',
        ...margin,
        ...additionalStyle,
      }}
    />
  </TouchableOpacity>
);

// ✅ 탭바 아이콘 렌더러
export const renderTabBarIcon = (focused, focusedUri, defaultUri) => (
  <Image
    source={{uri: focused ? focusedUri : defaultUri}}
    style={{
      width: getResponsiveIconSize(25),
      height: getResponsiveIconSize(25),
      marginTop: getResponsiveHeight(2),
      resizeMode: 'contain',
    }}
  />
);

// ✅ 탭바 라벨 렌더러
export const renderTabBarLabel = (label, focused) => (
  <Text
    style={{
      color: focused ? '#FFC84D' : 'gray',
      fontSize: getResponsiveFontSize(12),
      marginTop: getResponsiveHeight(6),
    }}>
    {label}
  </Text>
);

export const RenderHeaderTitleLogo = () => {
  return (
    <View style={{paddingBottom: getResponsiveHeight(10)}}>
      <Image
        source={require('../assets/images/kinover.png')}
        style={{
          width: getResponsiveWidth(42),
          height: getResponsiveHeight(42),
          resizeMode: 'contain',
        }}
      />
    </View>
  );
};

// ✅ 감정기록 알림 이동 버튼
export const RenderHeaderLeft1 = ({navigation}) =>
  createIconButton(
    () =>
      navigation.navigate('Tabs', {
        screen: '감정기록',
        params: {screen: '알림화면'},
      }),
    require('../assets/images/navigator_alarm-button.png'),
    getResponsiveIconSize(24),
    getResponsiveIconSize(26),
    {marginLeft: getResponsiveWidth(20), resizeMode: 'contain'},
  );

// ✅ 설정화면 이동 버튼
export const RenderHeaderRightSetting = ({navigation}) =>
  createIconButton(
    () =>
      navigation.navigate('Tabs', {
        screen: '감정기록',
        params: {screen: '설정화면'},
      }),
    require('../assets/images/setting_bt.png'),
    getResponsiveIconSize(24),
    getResponsiveIconSize(26),
    {marginRight: getResponsiveWidth(20), resizeMode: 'contain'},
  );

// ✅ 채팅 설정 열기 버튼
export const RenderHeaderRightChatSetting = ({setIsSettingsOpen}) =>
  createIconButton(
    () => setIsSettingsOpen(true),
    require('../assets/images/dots.png'),
    21,
    25,
    {marginRight: getResponsiveWidth(20)},
  );

// ✅ 게시글 삭제 아이콘
export const RenderHeaderDeletePost = () =>
  createIconButton(
    () => {}, // 삭제 로직 필요 시 여기에 구현
    require('../assets/images/trash.png'),
    20,
    20,
    {
      marginRight: getResponsiveWidth(20),
      marginBottom: getResponsiveHeight(12),
    },
    {zIndex: 999},
  );

// ✅ 일반 뒤로가기 버튼
export const RenderGoBackButton = ({navigation}) =>
  createIconButton(
    () => navigation.goBack(),
    require('../assets/images/navigator_goback-button.png'),
    12,
    23,
    {marginLeft: getResponsiveWidth(20)},
    {zIndex: 999},
  );

// ✅ 갤러리 뒤로가기 버튼
export const RenderGoBackButtonGallery = ({navigation}) =>
  createIconButton(
    () => navigation.goBack(),
    require('../assets/images/navigator_goback-button.png'),
    9,
    20,
    {marginLeft: getResponsiveWidth(25)},
    {zIndex: 999},
  );

// ✅ 로고 + 텍스트 헤더
export const RenderHeaderLogo = ({navigation}) => (
  <TouchableOpacity
    onPress={() =>
      navigation.navigate('Tabs', {
        screen: '감정기록',
        params: {screen: '알림화면'},
      })
    }
    style={{
      flexDirection: 'row',
      alignItems: 'flex-end',
    }}>
    <Image
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
