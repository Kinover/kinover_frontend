import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import CommunicationScreen from '../../screens/communication';
import KinoChatRoom from '../../screens/communication/chatRoom/kinoChatRoom';
import ChatSettings from '../../screens/communication/chatRoom/setting/chatSetting';
import {RenderHeaderTitleLogo} from '../tabHeaderHelpers';
import getResponsiveFontSize, {
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../utils/responsive';
import {Image, View, Text, Platform} from 'react-native';
import {RenderGoBackButton} from '../tabHeaderHelpers';
import AddChatMemeberScreen from '../../screens/communication/chatRoom/setting/addChatMemberScreen';
import CreateChatRoom from '../../screens/communication/createChatRoom';
import ChatRoom from '../../screens/communication/chatRoom/chatRoom';
import KinoSelectScreen from '../../screens/communication/chatRoom/kinoSelectScreen';
import SettingScreen from '../../screens/home/setting/settingScreen';
import NotificationScreen from '../../screens/notification/notificationScreen';
import NotificationSettingScreen from '../../screens/home/setting/notificationSettingScreen';

import {RenderHeaderHome} from '../tabHeaderHelpers';
const Stack = createStackNavigator();

export default function CommunicationStack() {
  return (
    <Stack.Navigator
      initialRouteName="소통"
      screenOptions={({navigation}) => ({
        gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

        // ✅ 객체 구조분해 필수!

        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height:
            Platform.OS == 'ios'
              ? getResponsiveHeight(107.5)
              : getResponsiveHeight(80),
        },

        headerTitleAlign: 'center',
        headerShown: true,
        headerBackTitleVisible: false,
      })}>
      <Stack.Screen
        name="소통"
        component={CommunicationScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerBackTitleVisible: false,
          headerBackTitle: '',
          headerLeft: () => null,
          headerTitle: () => (
            <Text
              style={{
                fontFamily: 'Pretendard-Bold',
                fontWeight: 'bold',
                fontSize: getResponsiveFontSize(24),
                // color: '#4D4D4D',
                color: 'black',
                textAlign: 'center',
                lineHeight: getResponsiveHeight(30),
                textAlignVertical: 'center',
              }}>
              채팅
            </Text>
          ),
          headerTitleAlign: 'bottom',
          headerTitleContainerStyle: {
            paddingLeft: getResponsiveWidth(12),
          },
          headerRight: () => (
            <RenderHeaderHome navigation={navigation} currentScreen="소통" />
          ),
        })}
      />

      <Stack.Screen
        name="알림설정화면"
        component={NotificationSettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerBackTitle: '',
          headerRight: () => null,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
      <Stack.Screen
        name="키노상담소화면"
        component={KinoChatRoom}
        options={({navigation, route}) => ({
          headerBackTitle: '',

          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="키노선택화면"
        component={KinoSelectScreen}
        options={({navigation, route}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: () => '',
          headerBackTitleVisible: false, // ← 요거 꼭 추가!
        })}
      />
      <Stack.Screen
        name="채팅방화면"
        component={ChatRoom}
        options={({navigation, route}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="채팅설정화면"
        component={ChatSettings}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="채팅방멤버추가화면"
        component={AddChatMemeberScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="채팅방생성화면"
        component={CreateChatRoom}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerRight: () => null,

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="설정화면"
        component={SettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerRight: () => null,

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
    </Stack.Navigator>
  );
}
