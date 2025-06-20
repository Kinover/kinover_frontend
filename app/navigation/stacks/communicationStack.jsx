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
import {Image, View, Text} from 'react-native';
import {RenderGoBackButton} from '../tabHeaderHelpers';
import NotificationScreen from '../../screens/home/notification/notificationScreen';
import AddChatMemeberScreen from '../../screens/communication/chatRoom/setting/addChatMemberScreen';
import CreateChatRoom from '../../screens/communication/createChatRoom';
import ChatRoom from '../../screens/communication/chatRoom/chatRoom';
import KinoSelectScreen from '../../screens/communication/chatRoom/kinoSelectScreen';

const Stack = createStackNavigator();

export default function CommunicationStack() {
  return (
    <Stack.Navigator
      initialRouteName="소통화면"
      screenOptions={({navigation}) => ({
        // ✅ 객체 구조분해 필수!
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height:
            Platform.OS == 'ios'
              ? getResponsiveHeight(120)
              : getResponsiveHeight(80),
        },
        headerTitleAlign: 'center',
        headerShown: true,
      })}>
      <Stack.Screen
        name="소통화면"
        component={CommunicationScreen}
        options={({navigation}) => ({
          headerTitleAlign: 'left',
          headerTitle: () => (
            <Text
              style={{
                fontSize: getResponsiveFontSize(26),
                fontFamily: 'Pretendard-SemiBold',
                textAlign: 'left',
                textAlignVertical: 'center',
              }}>
              채팅
            </Text>
          ),
          headerTitleContainerStyle: {
            paddingLeft: getResponsiveWidth(5),
          },
        })}
      />
      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="키노상담소화면"
        component={KinoChatRoom}
        options={({navigation, route}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="키노선택화면"
        component={KinoSelectScreen}
        options={({navigation, route}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: () => <RenderHeaderTitleLogo />,
        })}
      />
      <Stack.Screen
        name="채팅방화면"
        component={ChatRoom}
        options={({navigation, route}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="채팅설정화면"
        component={ChatSettings}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="채팅방멤버추가화면"
        component={AddChatMemeberScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="채팅방생성화면"
        component={CreateChatRoom}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
}
