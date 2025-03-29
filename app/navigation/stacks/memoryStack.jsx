import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import MemoryScreen from '../../screens/memory';
import ChallengeScreen from '../../screens/memory/challenge/challengeScreen';
import RecChallengeScreen from '../../screens/memory/challenge/recChallengeScreen';
import RecChallengeDetailScreen from '../../screens/memory/challenge/recChallengeDetailScreen';
import {Image, View} from 'react-native';
import {getResponsiveWidth, getResponsiveHeight} from '../../utils/responsive';
import {RenderGoBackButton} from '../tabHeaderHelpers';

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
        headerLeft: () => null, // ✅ 올바른 접근
      })}>
      <Stack.Screen name="추억화면" component={MemoryScreen} />
      <Stack.Screen
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
      />
    </Stack.Navigator>
  );
}
