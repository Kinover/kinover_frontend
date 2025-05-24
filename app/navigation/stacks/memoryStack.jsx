import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import MemoryScreen from '../../screens/memory';
import {Image, View} from 'react-native';
import getResponsiveFontSize, {
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../utils/responsive';
import {
  RenderGoBackButtonGallery,
  RenderHeaderDeletePost,
} from '../tabHeaderHelpers';
import PostPage from '../../screens/memory/postPage';
import ImageSelectPage from '../../screens/memory/ImageSelectPage';
import {RenderGoBackButton} from '../../navigation/tabHeaderHelpers';
import CategorySelectPage from '../../screens/memory/categorySelectPage';
import CreatePostPage from '../../screens/memory/createPostPage';
import CategoryPage from '../../screens/memory/categoryPage';

const Stack = createStackNavigator();

export default function MemoryStack() {
  return (
    <Stack.Navigator
      initialRouteName="추억화면"
      screenOptions={({navigation}) => ({
        // ✅ 객체 구조분해 필수!
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height: getResponsiveHeight(120),
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
        headerLeft: () => null, // ✅ 올바른 접근
      })}>
      <Stack.Screen name="추억화면" component={MemoryScreen} />
      
      <Stack.Screen
        name="게시글화면"
        component={PostPage}
        options={({route, navigation}) => ({
          headerTitle: route.params.memory.title, // memory.title을 타이틀로!
          headerTitleAlign: 'center',
          headerTitleStyle: {
            color: 'black',
            fontSize: getResponsiveFontSize(17),
            textAlign: 'center',
            bottom: '5',
            fontFamily: 'Pretendard-Light',
          },
          headerLeft: () => (
            <RenderGoBackButtonGallery navigation={navigation} />
          ),
          headerRight: () => <RenderHeaderDeletePost navigation={navigation} />,
          headerTransparent: true, // 뒤에 투명하게 할거면 true, 기본은 false
          headerStyle: {
            backgroundColor: 'rgba(255,255,255,0.7)', // 헤더 투명도 조절 (배경색 지정)
            borderBottomWidth: 0,
            shadowOpacity: 0,
            elevation: 0,
            height: getResponsiveHeight(90),
          },
        })}
      />
      <Stack.Screen
        name="카테고리화면"
        component={CategoryPage}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}/>

      <Stack.Screen
        name="이미지선택화면"
        component={ImageSelectPage}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="카테고리선택화면"
        component={CategorySelectPage}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      <Stack.Screen
        name="게시글작성화면"
        component={CreatePostPage}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />

      {/* <Stack.Screen
        name="챌린지화면"
        component={ChallengeScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="추천챌린지화면"
        component={RecChallengeScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="추천챌린지세부화면"
        component={RecChallengeDetailScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      /> */}
    </Stack.Navigator>
  );
}
