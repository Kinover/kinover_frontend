// src/navigation/rootScreen.jsx
import React from 'react';
import { Text} from 'react-native';
import {useSelector} from 'react-redux';

import AuthNavigator from './authNavigator';
import RootNavigator from './rootNavigator';
import {useAutoLogin} from 'features/auth/hooks/useAutoLogin';
import { SafeAreaView } from 'react-native-safe-area-context';

function BootLoading() {
  return (
    <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text allowFontScaling={false}></Text>
    </SafeAreaView>
  );
}

export default function RootScreen() {
  useAutoLogin();

  const authChecked = useSelector(state => state.login?.authChecked);
  const isLoggedIn = useSelector(state => state.login?.isLoggedIn);

  if (!authChecked) return <BootLoading />;
  if (!isLoggedIn) return <AuthNavigator />;
  return <RootNavigator />; // ✅ 여기!
}
