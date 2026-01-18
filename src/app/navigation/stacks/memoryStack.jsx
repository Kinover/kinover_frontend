import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Platform, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import MemoryScreen from '../../../features/memory/screens';
import PostPage from '../../../features/memory/screens/PostScreen';
import CategoryPage from '../../../features/memory/screens/CategoryPage';
import CategorySelectPage from '../../../features/memory/screens/CategorySelectScreen';
import SettingScreen from '../../../features/setting/screens/SettingScreen';
import CreatePostPage from '../../../features/memory/screens/CreatePostScreen';
import NotificationSettingScreen from '../../../features/setting/screens/NotificationSettingScreen';
import ImageSelectPage from '../../../features/memory/screens/ImageSelectScreen';

import {
  RenderGoBackButton,
  RenderHeaderDeletePost,
  RenderHeaderHome,
} from '../helpers/tabHeaderHelpers';

import {getResponsiveHeight} from '../../../utils/responsive';
import MagazineDetailScreen from 'features/magazine/screens/MagazineDetailScreen';
import BookShelfScreen from 'features/magazine/screens';
import { HEADER_STYLES } from 'styles/style';

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
        gestureEnabled: true,
        headerShown: true,
        headerStyle: defaultHeaderStyle,
        headerTitleAlign: 'left',
        // headerTitle: '',
        headerRight: () => (
          <RenderHeaderHome navigation={navigation} currentScreen="추억" />
        ),
        // headerLeft: () => (
        //   <RenderHeaderBook currentScreen="추억" navigation={navigation} />
        // ),
        headerTitle: () => (
          <Text
            style={{
              fontFamily: HEADER_STYLES.mainTitleFontFamily,
              fontWeight: HEADER_STYLES.mainTitleFontWeight,
              fontSize: HEADER_STYLES.mainTitleFontSize, // ✅ 24 → 16 (다른 앱이랑 비슷한 크기)
              color: 'black',
              lineHeight: HEADER_STYLES.mainTitleLineHeight, // ✅ 너무 크지 않게 살짝만
              textAlignVertical: 'center',
            }}>
            추억
          </Text>
        ),
      }}>
      <Stack.Screen name="추억" component={MemoryScreen} />

      <Stack.Screen
        name="게시글화면"
        component={PostPage}
        options={({route, navigation: nav}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={nav} />,
          headerRight: () => <RenderHeaderDeletePost navigation={nav} />,
          headerTitle: route.params?.memory?.title || '',
          headerTitleAlign: 'center',
        })}
      />

      <Stack.Screen
        name="매거진화면"
        component={BookShelfScreen}
        options={({navigation: nav}) => ({
          headerLeft: () => <RenderGoBackButton navigation={nav} />,
          headerRight: null,
        })}
      />
      <Stack.Screen
        name="매거진상세화면"
        component={MagazineDetailScreen}
        options={({navigation: nav}) => ({
          headerTransparent: 'true',
          headerLeft: () => <RenderGoBackButton navigation={nav} />,
          headerRight: null,
        })}
      />


      <Stack.Screen
        name="설정화면"
        component={SettingScreen}
        options={({navigation: nav}) => ({
          gestureEnabled: true,
          headerRight: () => null,
          headerLeft: () => <RenderGoBackButton navigation={nav} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="알림설정화면"
        component={NotificationSettingScreen}
        options={({navigation: nav}) => ({
          gestureEnabled: true,
          headerRight: () => null,
          headerLeft: () => <RenderGoBackButton navigation={nav} />,
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
          options={({navigation: nav}) => ({
            gestureEnabled: true,
            headerTitleAlign: 'center',
            headerLeft: () => <RenderGoBackButton navigation={nav} />,
          })}
        />
      ))}
    </Stack.Navigator>
  );
}
