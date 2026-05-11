import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import CommunicationScreen from 'features/chat/screens';
import KinoChatRoom from 'features/chat/screens/kinoChatRoomScreen';
import ChatSettings from 'features/chat/screens/chatSetting';
import {getTabStackHeaderHeight} from 'utils/layoutMetrics';
import {getStackCardScreenOption} from '../navigationTheme';
import AppText from 'components/AppText';
import {
  RenderGoBackButton,
  RenderHeaderHome,
} from '../helpers/tabHeaderHelpers';
import AddChatMemberScreen from 'features/chat/screens/addChatMemberScreen';
import CreateChatRoom from 'features/chat/screens/createChatRoomScreen';
import ChatRoom from 'features/chat/screens/chatRoomScreen';
import KinoSelectScreen from 'features/chat/screens/kinoSelectScreen';
import {HEADER_STYLES} from 'styles/style';
import ChatRoomMediaScreen from 'features/chat/screens/chatRoomMediaScreen';
import {useColors} from 'hooks/useColors';

const Stack = createStackNavigator();

export default function CommunicationStack() {
  const colors = useColors();
  return (
    <Stack.Navigator
      initialRouteName="소통"
      screenOptions={_ => ({
        gestureEnabled: true,
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height: getTabStackHeaderHeight(),
        },
        headerTitleAlign: 'center',
        headerShown: true,
        headerBackTitleVisible: false,
        ...getStackCardScreenOption(colors),
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
            <AppText
              allowFontScaling={false}
              style={{
                fontFamily: HEADER_STYLES().mainTitleFontFamily,
                fontWeight: HEADER_STYLES().mainTitleFontWeight,
                fontSize: HEADER_STYLES().mainTitleFontSize, // 24 → 16 (다른 앱이랑 비슷한 크기)
                color: colors.textPrimary,
                textAlign: 'center',
                lineHeight: HEADER_STYLES().mainTitleLineHeight, // 살짝만
                textAlignVertical: 'center',
              }}>
              소통
            </AppText>
          ),
          headerTitleAlign: 'bottom',
 // headerTitleContainerStyle: {
 // paddingLeft: getResponsiveWidth(6),
 // },
          headerRight: () => (
            <RenderHeaderHome navigation={navigation} currentScreen="소통" />
          ),
        })}
      />

      <Stack.Screen
        name="키노상담소화면"
        component={KinoChatRoom}
        options={({navigation, route}) => ({
          headerBackTitle: '',
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: () => (
            <AppText
              allowFontScaling={false}
              numberOfLines={1}
              style={{
                fontFamily: HEADER_STYLES().defaultTitleFontFamily,
                fontSize: HEADER_STYLES().defaultTitleFontSize,
                color: colors.textPrimary,
              }}>
              {route?.params?.title ?? '키노상담소'}
            </AppText>
          ),
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
        options={({navigation, route}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: () => (
            <AppText
              allowFontScaling={false}
              numberOfLines={1}
              style={{
                fontFamily: HEADER_STYLES().defaultTitleFontFamily,
                fontSize: HEADER_STYLES().defaultTitleFontSize,
                color: colors.textPrimary,
              }}>
              {route?.params?.title ?? route?.params?.chatRoom?.roomName ?? '채팅'}
            </AppText>
          ),
        })}
      />

      <Stack.Screen
        name="채팅설정화면"
        component={ChatSettings}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
          headerBackTitleVisible: false,
        })}
      />

      <Stack.Screen
        name="채팅방멤버추가화면"
        component={AddChatMemberScreen}
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
        name="채팅방미디어모아보기화면"
        component={ChatRoomMediaScreen}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: () => '',
          headerBackTitleVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}
