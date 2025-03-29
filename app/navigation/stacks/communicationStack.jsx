import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import CommunicationScreen from '../../screens/communication';
import ProfileScreen from '../../screens/communication/profileScreen';
import OneToOneChatRoom from '../../screens/communication/chatRoom/oneToOneChatRoom';
import KinoChatRoom from '../../screens/communication/chatRoom/kinoChatRoom';
import FamilyChatRoom from '../../screens/communication/chatRoom/familyChatRoom';
import ChatSettings from '../../screens/communication/chatRoom/chatSetting';
import {
  RenderHeaderRight,
  RenderHeaderLeft,
  RenderHeaderLeft2,
} from '../tabHeaderHelpers';
import {getResponsiveWidth, getResponsiveHeight} from '../../utils/responsive';
import {Image, View} from 'react-native';
import {RenderGoBackButton} from '../tabHeaderHelpers';
import NotificationScreen from '../../components/notificationScreen';

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
          height: getResponsiveHeight(120),
          overflow: 'visible',
        },
        headerTitleAlign: 'center',
        headerShown: true,
        headerTitle: () => (
          <View style={{paddingBottom: getResponsiveHeight(10)}}>
            <Image
              source={require('../../assets/images/kinover.png')}
              style={{
                width: getResponsiveWidth(49),
                height: getResponsiveHeight(46),
                resizeMode: 'contain',
              }}
            />
          </View>
        ),
      })}>
      <Stack.Screen
        name="소통화면"
        component={CommunicationScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderHeaderLeft2 navigation={navigation} />,
          headerRight: () => <RenderHeaderRight navigation={navigation} />,
          headerTitle: () => (
            <Image
              source={require('../../assets/images/kinover.png')}
              style={{
                width: getResponsiveWidth(49),
                height: getResponsiveHeight(46),
                marginBottom: getResponsiveHeight(10),
                resizeMode: 'contain',
              }}
            />
          ),
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
        name="프로필화면"
        component={ProfileScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="채팅방화면"
        component={OneToOneChatRoom}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="키노상담소화면"
        component={KinoChatRoom}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="가족채팅방화면"
        component={FamilyChatRoom}
        options={({navigation}) => ({
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
    </Stack.Navigator>
  );
}
