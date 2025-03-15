import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Button,
  FlatList,
  Text,
  Image,
  TextInput,
} from 'react-native';
import ChallengeSlider from './challengeSlider';
import {
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';

export default function RecChallengeScreen() {

  const RenderChallenges = () => {
    return (
      <ScrollView style={styles.mainContainer}>
        {/* 챌린지 공유 */}
        <ChallengeSlider />
      </ScrollView>
    );
  };

  return <RenderChallenges />;
}

// 스타일 시트
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: getResponsiveHeight(10),
    backgroundColor: '#FFFFFF',
    alignContent: 'center',
  },
});
