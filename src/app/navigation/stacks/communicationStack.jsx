import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import CommunicationScreen from '../../../features/chat/screens';
import KinoChatRoom from '../../../features/chat/screens/kinoChatRoomScreen';
import ChatSettings from '../../../features/chat/screens/chatSetting';
import  {getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';
import {Text, Platform} from 'react-native';
import {RenderGoBackButton,RenderHeaderHome} from '../helpers/tabHeaderHelpers';
import AddChatMemeberScreen from '../../../features/chat/screens/addChatMemberScreen';
import CreateChatRoom from '../../../features/chat/screens/createChatRoomScreen';
import ChatRoom from '../../../features/chat/screens/chatRoomScreen';
import KinoSelectScreen from '../../../features/chat/screens/kinoSelectScreen';
import SettingScreen from '../../../features/setting/screens/SettingScreen';
import NotificationScreen from '../../../features/notificationScreen';
import NotificationSettingScreen from '../../../features/setting/screens/NotificationSettingScreen';

const Stack = createStackNavigator();

export default function CommunicationStack() {
  return (
    <Stack.Navigator
      initialRouteName="소통"
      screenOptions={({_}) => ({
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
        options={({navigation}) => ({
          headerBackTitle: '',

          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="키노선택화면"
        component={KinoSelectScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: () => '',
          headerBackTitleVisible: false, // ← 요거 꼭 추가!
        })}
      />
      <Stack.Screen
        name="채팅방화면"
        component={ChatRoom}
        options={({navigation}) => ({
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
