import React, {useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import HomeScreen from 'features/home/screens';

import {
  RenderHeaderHome,
  RenderGoBackButton,
  RenderHeaderTitleLogo,
} from '../helpers/tabHeaderHelpers';
import {getTabStackHeaderHeight} from 'utils/layoutMetrics';
import {stackCardScreenOption} from '../navigationTheme';
import StateScreen from 'features/home/screens/stateScreen';

import {notificationApi} from 'features/notification/services/notificationApi';
import {useDispatch, useSelector} from 'react-redux';
import {useIsFocused} from '@react-navigation/native';

const Stack = createStackNavigator();

const getHeaderHeight = () => getTabStackHeaderHeight();

const defaultHeaderStyle = {
  height: getHeaderHeight(),
  shadowColor: 'transparent',
  elevation: 0,
  borderBottomWidth: 0,
};

const HomeStack = ({route}) => {
  const dispatch = useDispatch();

  const isFocused = useIsFocused();
  const userId = useSelector(state => state.user.userId);

 // 현재 HomeStack 안에서 "활성화된 화면 이름" 구하기
 // (알림화면일 때는 hasUnread 체크를 스킵하려고)
  const currentRouteName =
    route?.state?.routes?.[route.state.index]?.name ?? '홈';

  useEffect(() => {
    if (!userId) return;
    if (!isFocused) return;

 // 알림화면에서는 목록 조회 + 읽음 처리 mutation이 수행되므로
 // 여기서 hasUnread 조회는 하지 않음(중복 호출/깜빡임 방지)
    if (currentRouteName === '알림화면') return;

    const unreadCountReq = dispatch(
      notificationApi.endpoints.getUnreadCount.initiate(undefined, {
        forceRefetch: true,
      }),
    );
    const hasUnreadReq = dispatch(
      notificationApi.endpoints.getHasUnread.initiate(undefined, {
        forceRefetch: true,
      }),
    );

    return () => {
      unreadCountReq.unsubscribe();
      hasUnreadReq.unsubscribe();
    };
  }, [dispatch, userId, isFocused, currentRouteName]);

  return (
    <Stack.Navigator
      initialRouteName="홈"
      screenOptions={{
        gestureEnabled: true,
        headerStyle: defaultHeaderStyle,
        headerTitleAlign: 'bottom',
        headerShown: true,
        ...stackCardScreenOption,
        headerLeft: () => <RenderHeaderTitleLogo />,
 // headerLeft: null,
        headerTitle: '',
      }}>
      <Stack.Screen
        name="홈"
        component={HomeScreen}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerTransparent: true,
          headerRight: () => (
            <RenderHeaderHome navigation={navigation} currentScreen="홈" />
          ),
          headerStyle: [defaultHeaderStyle],
        })}
      />

      <Stack.Screen
        name="감정상태화면"
        component={StateScreen}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
