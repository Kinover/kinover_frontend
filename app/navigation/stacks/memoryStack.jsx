import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Platform} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MemoryScreen from '../../screens/memory';
import PostPage from '../../screens/memory/pages/PostPage';
import CategoryPage from '../../screens/memory/category/categoryPage';
import CategorySelectPage from '../../screens/memory/pages/CategorySelectPage';
import SettingScreen from '../../screens/home/setting/settingScreen';
import CreatePostPage from '../../screens/memory/pages/CreatePostPage';
import NotificationScreen from '../../screens/notification/notificationScreen';
import NotificationSettingScreen from '../../screens/home/setting/notificationSettingScreen';
import ImageSelectPage from '../../screens/memory/pages/ImageSelectPage';
import {
  RenderGoBackButton,
  RenderGoBackButtonGallery,
  RenderHeaderDeletePost,
  RenderHeaderHome,
} from '../tabHeaderHelpers';

import getResponsiveFontSize, {
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../utils/responsive';

const Stack = createStackNavigator();

export default function MemoryStack() {
  const navigation = useNavigation();
  const defaultHeaderStyle = {
    borderBottomWidth: 0,
    display: 'flex',
    shadowOpacity: 0,
    elevation: 0,
    height:
      Platform.OS === 'ios'
        ? getResponsiveHeight(107.5)
        : getResponsiveHeight(80),
  };

  return (
    <Stack.Navigator
      initialRouteName="추억"
      screenOptions={{
        gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
        headerShown: true,
        headerStyle: defaultHeaderStyle,
        headerTitleAlign: 'left',
        headerTitle: '',
        headerTitleContainerStyle: {},
        headerRight: () => (
          <RenderHeaderHome navigation={navigation} currentScreen="추억" />
        ),
      }}>
      <Stack.Screen name="추억" component={MemoryScreen} />

      <Stack.Screen
        name="게시글화면"
        component={PostPage}
        options={({route, navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerRight: () => <RenderHeaderDeletePost navigation={navigation} />,
          headerTitle: route.params?.memory?.title || '',
          headerTitleAlign: 'center',
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
      <Stack.Screen
        name="알림설정화면"
        component={NotificationSettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerRight: () => null,

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      {[
        {name: '카테고리화면', component: CategoryPage},
        {name: '이미지선택화면', component: ImageSelectPage},
        {name: '카테고리선택화면', component: CategorySelectPage},
        {name: '게시글작성화면', component: CreatePostPage},
      ].map(({name, component}) => (
        <Stack.Screen
          key={name}
          name={name}
          component={component}
          options={({navigation}) => ({
            gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

            headerTitleAlign: 'center',
            headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          })}
        />
      ))}
    </Stack.Navigator>
  );
}
