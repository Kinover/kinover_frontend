import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../utils/responsive';

// 탭 바 아이콘 렌더링 함수
export const renderTabBarIcon = (focused, focusedUri, defaultUri) => (
  <Image
    source={{uri: focused ? focusedUri : defaultUri}}
    style={{
      width: getResponsiveIconSize(25),
      height: getResponsiveIconSize(25),
      marginTop: getResponsiveHeight(15),
      resizeMode: 'contain',
    }}
  />
);

// 탭 바 라벨 렌더링 함수
export const renderTabBarLabel = (label, focused) => (
  <Text
    style={{
      color: focused ? '#FFC84D' : 'gray',
      fontSize: getResponsiveFontSize(12),
      marginTop: getResponsiveHeight(11),
    }}>
    {label}
  </Text>
);

// 홈 화면 헤더 우측 버튼
export function RenderHeaderRightHome({navigation}) {
  return (
    <TouchableOpacity onPress={() => navigation.navigate('가족설정화면')}>
      <Image
        source={require('../assets/images/navigator_family-button.png')}
        style={{
          width: getResponsiveWidth(26),
          height: getResponsiveHeight(28),
          marginRight: getResponsiveWidth(30),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}

// 기본 헤더 우측 버튼 (프로필화면 이동)
export function RenderHeaderRightHome2({navigation}) {
  return (
    <TouchableOpacity onPress={() => navigation.navigate('프로필화면')}>
      <Image
        source={require('../assets/images/navigator_user-profile-button.png')}
        style={{
          width: getResponsiveWidth(26),
          height: getResponsiveHeight(28),
          marginRight: getResponsiveWidth(30),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}

// 헤더 좌측 알림 버튼
export function RenderHeaderLeft1({navigation}) {
  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('Tabs', {
          screen: '감정기록',
          params: {screen: '알림화면'},
        })
      }>
      <Image
        source={require('../assets/images/navigator_alarm-button.png')}
        style={{
          width: getResponsiveWidth(24),
          height: getResponsiveHeight(26),
          marginLeft: getResponsiveWidth(30),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}

// 헤더 좌측 알림 버튼
export function RenderHeaderLogo({navigation}) {
  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('Tabs', {
          screen: '감정기록',
          params: {screen: '알림화면'},
        })
      }
      style={{position:'relative',display: 'flex', flexDirection: 'row', alignItems: 'flex-end'}}>
      <Image
        source={require('../assets/images/kinover.png')}
        style={{
          width: getResponsiveWidth(70),
          height: getResponsiveHeight(70),
          marginLeft: getResponsiveWidth(10),
          resizeMode: 'contain',
        }}
      />
      <View>
        <Text
          style={{
            position:'absolute',
            bottom:'12',
            width: getResponsiveWidth(120),
            height: getResponsiveHeight(30),
            fontSize: getResponsiveIconSize(30),
            fontFamily:'Pretendard-SemiBold',
          }}>
          Kinover
        </Text>
      </View>
    </TouchableOpacity>
  );
}


// 헤더 좌측 알림 버튼
export function RenderHeaderLeft2({navigation}) {
  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('Tabs', {
          screen: '소통기록',
          params: {screen: '알림화면'},
        })
      }>
      <Image
        source={require('../assets/images/navigator_alarm-button.png')}
        style={{
          width: getResponsiveWidth(24),
          height: getResponsiveHeight(26),
          marginLeft: getResponsiveWidth(30),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}

// 뒤로 가기 버튼
export function RenderGoBackButton({navigation}) {
  return (
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Image
        source={require('../assets/images/navigator_goback-button.png')}
        style={{
          width: getResponsiveWidth(12),
          height: getResponsiveHeight(23),
          marginLeft: getResponsiveWidth(20),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}

// 헤더 좌측 알림 버튼
export function RenderHeaderRightChatSetting({setIsSettingsOpen}) {
  return (
    <TouchableOpacity
    onPress={() => setIsSettingsOpen(true)}

      >
      <Image
        source={require('../assets/images/dots.png')}
        style={{
          width: getResponsiveWidth(21),
          height: getResponsiveHeight(25),
          marginRight: getResponsiveWidth(20),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}

// 헤더 좌측 알림 버튼
export function RenderHeaderRightSetting({navigation}) {
  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('Tabs', {
          screen: '설정화면',
          params: {screen: '설정화면'},
        })
      }>
      <Image
        source={require('../assets/images/setting_bt.png')}
        style={{
          width: getResponsiveWidth(26),
          height: getResponsiveHeight(28),
          marginRight: getResponsiveWidth(30),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}

// 뒤로 가기 버튼
export function RenderHeaderDeletePost({navigation}) {
  return (
    <TouchableOpacity>
      <Image
        source={require('../assets/images/trash.png')}
        style={{
          width: getResponsiveWidth(20),
          height: getResponsiveHeight(20),
          marginRight: getResponsiveWidth(25),
          marginBottom: getResponsiveWidth(12),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}

// 뒤로 가기 버튼
export function RenderGoBackButtonGallery({navigation}) {
  return (
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Image
        source={require('../assets/images/navigator_goback-button.png')}
        style={{
          width: getResponsiveWidth(9),
          height: getResponsiveHeight(20),
          marginLeft: getResponsiveWidth(25),
          resizeMode: 'contain',
        }}
      />
    </TouchableOpacity>
  );
}