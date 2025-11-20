import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import CommunicationScreen from '../../../features/chat/screens';
import KinoChatRoom from '../../../features/chat/screens/kinoChatRoomScreen';
import ChatSettings from '../../../features/chat/screens/chatSetting';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';
import {Text, Platform} from 'react-native';
import {
  RenderGoBackButton,
  RenderHeaderHome,
} from '../helpers/tabHeaderHelpers';
import AddChatMemeberScreen from '../../../features/chat/screens/addChatMemberScreen';
import CreateChatRoom from '../../../features/chat/screens/createChatRoomScreen';
import ChatRoom from '../../../features/chat/screens/chatRoomScreen';
import KinoSelectScreen from '../../../features/chat/screens/kinoSelectScreen';
import SettingScreen from '../../../features/setting/screens/SettingScreen';
import NotificationScreen from '../../../features/NotificationScreen';
import NotificationSettingScreen from '../../../features/setting/screens/NotificationSettingScreen';

const Stack = createStackNavigator();

export default function CommunicationStack() {
  return (
    <Stack.Navigator
      initialRouteName="소통"
      screenOptions={_ => ({
        gestureEnabled: true,
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height:
            Platform.OS === 'ios'
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
          gestureEnabled: true,
          headerBackTitleVisible: false,
          headerBackTitle: '',
          headerLeft: () => null,
          headerTitle: () => (
            <Text
              style={{
                fontFamily: 'Pretendard-Bold',
                fontWeight: Platform.OS === 'android' ? '700' : undefined,
                fontSize: getResponsiveFontSize(20), // ✅ 24 → 16 (다른 앱이랑 비슷한 크기)
                color: 'black',
                textAlign: 'center',
                lineHeight: getResponsiveHeight(22), // 살짝만
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
          gestureEnabled: true,
          headerBackTitle: '',
          headerRight: () => null,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="키노상담소화면"
        component={KinoChatRoom}
        options={({navigation}) => ({
          headerBackTitle: '',
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="키노선택화면"
        component={KinoSelectScreen}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: () => '',
          headerBackTitleVisible: false,
        })}
      />

      <Stack.Screen
        name="채팅방화면"
        component={ChatRoom}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="채팅설정화면"
        component={ChatSettings}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="채팅방멤버추가화면"
        component={AddChatMemeberScreen}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="채팅방생성화면"
        component={CreateChatRoom}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerRight: () => null,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="설정화면"
        component={SettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerRight: () => null,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
    </Stack.Navigator>
  );
}
