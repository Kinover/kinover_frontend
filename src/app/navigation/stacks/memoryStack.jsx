import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import AppText from 'components/AppText';
import {useNavigation} from '@react-navigation/native';

import MemoryScreen from 'features/memory/screens';
import PostPage from 'features/memory/screens/PostScreen';
import CategoryPage from 'features/memory/screens/CategoryPage';
import CategorySelectPage from 'features/memory/screens/CategorySelectScreen';
import CreatePostPage from 'features/memory/screens/CreatePostScreen';
import ImageSelectPage from 'features/memory/screens/ImageSelectScreen';

import {
  RenderGoBackButton,
  RenderHeaderDeletePost,
  RenderHeaderHome,
} from '../helpers/tabHeaderHelpers';

import {getTabStackHeaderHeight} from 'utils/layoutMetrics';
import {stackCardScreenOption} from '../navigationTheme';

import {HEADER_STYLES} from 'styles/style';

const Stack = createStackNavigator();

export default function MemoryStack() {
  const navigation = useNavigation();

  const defaultHeaderStyle = {
    borderBottomWidth: 0,
    display: 'flex',
    shadowOpacity: 0,
    elevation: 0,
    height: getTabStackHeaderHeight(),
  };

  return (
    <Stack.Navigator
      initialRouteName="추억"
      screenOptions={{
        gestureEnabled: false,
        headerShown: true,
        headerBackVisible: false,

        headerStyle: defaultHeaderStyle,
        headerTitleAlign: 'left',
        ...stackCardScreenOption,
 // headerTitle: '',
        headerRight: () => (
          <RenderHeaderHome navigation={navigation} currentScreen="추억" />
        ),

        headerTitle: () => (
          <AppText
            allowFontScaling={false}
            style={{
              fontFamily: HEADER_STYLES().mainTitleFontFamily,
              fontWeight: HEADER_STYLES().mainTitleFontWeight,
              fontSize: HEADER_STYLES().mainTitleFontSize, // 24 → 16 (다른 앱이랑 비슷한 크기)
              color: 'black',
              lineHeight: HEADER_STYLES().mainTitleLineHeight, // 너무 크지 않게 살짝만
              textAlignVertical: 'center',
            }}>
            추억
          </AppText>
        ),
      }}>
      <Stack.Screen
        name="추억"
        screenOptions={{headerBackVisible: false}}
        component={MemoryScreen}
      />

      <Stack.Screen
        name="게시글화면"
        component={PostPage}
        options={({route, navigation: nav}) => ({
          gestureEnabled: false,
          headerLeft: () => <RenderGoBackButton navigation={nav} />,
          headerRight: () => <RenderHeaderDeletePost navigation={nav} />,
          headerTitle: route.params?.memory?.title || '',
          headerTitleAlign: 'center',
          headerBackVisible: false,
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
            gestureEnabled: false,
            headerTitleAlign: 'center',
            headerLeft: () => <RenderGoBackButton navigation={nav} />,
          })}
        />
      ))}
    </Stack.Navigator>
  );
}
