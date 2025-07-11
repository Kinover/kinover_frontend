import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Image, View, Text, Platform} from 'react-native';
import MemoryScreen from '../../screens/memory';
import PostPage from '../../screens/memory/post/postPage';
import ImageSelectPage from '../../screens/memory/upload/ImageSelectPage';
import CategorySelectPage from '../../screens/memory/upload/categorySelectPage';
import CreatePostPage from '../../screens/memory/upload/createPostPage';
import CategoryPage from '../../screens/memory/navigator/categoryPage';

import {
  RenderGoBackButton,
  RenderGoBackButtonGallery,
  RenderHeaderDeletePost,
} from '../tabHeaderHelpers';

import getResponsiveFontSize, {
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../utils/responsive';

const Stack = createStackNavigator();

export default function MemoryStack() {
  const defaultHeaderStyle = {
    borderBottomWidth: 0,
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
        headerShown: true,
        headerStyle: defaultHeaderStyle,
        headerTitleAlign: 'left',
        headerTitle: '',
        headerTitleContainerStyle: {
          paddingLeft: getResponsiveWidth(15),
        },
      }}>
      <Stack.Screen name="추억" component={MemoryScreen} />

      <Stack.Screen
        name="게시글화면"
        component={PostPage}
        options={({route, navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerRight: () => <RenderHeaderDeletePost navigation={navigation} />,
          headerTitle: route.params?.memory?.title || '',
          headerTitleAlign: 'center',
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
            headerTitleAlign: 'center',
            headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          })}
        />
      ))}
    </Stack.Navigator>
  );
}
