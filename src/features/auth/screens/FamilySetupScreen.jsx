// src/features/auth/screens/FamilySetupScreen.js

import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigation} from '@react-navigation/native';

import FamilyJoinOrCreateForm from 'features/auth/components/FamilyJoinOrCreateForm';
import {useColors} from 'hooks/useColors';

export default function FamilySetupScreen({route}) {
  const colors = useColors();
  const fromAppFlow = route?.params?.fromAppFlow === true;
  const screenNavigation = useNavigation();

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.surfacePrimary}]}
      edges={['top', 'bottom']}>
      <FamilyJoinOrCreateForm
        screenNavigation={screenNavigation}
        fromAppFlow={fromAppFlow}
        surface="screen"
        compact={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
