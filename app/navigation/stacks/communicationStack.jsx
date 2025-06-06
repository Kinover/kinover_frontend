import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import CommunicationScreen from '../../screens/communication';
import {RenderHeaderRightSetting} from '../tabHeaderHelpers';
import KinoChatRoom from '../../screens/communication/chatRoom/kinoChatRoom';
import ChatSettings from '../../screens/communication/chatRoom/setting/chatSetting';
import {
  RenderHeaderRightChatSetting,
  // RenderHeaderRight,
  RenderHeaderLeft,
  RenderHeaderLeft2,
} from '../tabHeaderHelpers';
import {getResponsiveWidth, getResponsiveHeight} from '../../utils/responsive';
import {Image, View} from 'react-native';
import {RenderGoBackButton} from '../tabHeaderHelpers';
import NotificationScreen from '../../components/notificationScreen';
import AddChatMemeberScreen from '../../screens/communication/chatRoom/setting/addChatMemberScreen';
import CreateChatRoom from '../../screens/communication/createChatRoom';
import ChatRoom from '../../screens/communication/chatRoom/chatRoom';

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
          headerRight: () => (
            <RenderHeaderRightSetting navigation={navigation} />
          ),
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
        name="키노상담소화면"
        component={KinoChatRoom}
        options={({navigation, route}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          // headerRight: () => (
          //   <RenderHeaderRightChatSetting
          //     setIsSettingsOpen={setIsSettingsOpen}
          //   />
          // ),
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
