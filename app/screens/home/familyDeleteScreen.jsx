import React from 'react';
import {StyleSheet, View, Image, Text} from 'react-native';
import {getResponsiveHeight, getResponsiveWidth} from '../../utils/responsive';

export default function FamilyDeleteScreen() {
  return <View style={styles.container}></View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#FFF8E9',
    paddingTop: getResponsiveHeight(30),
    paddingBottom: getResponsiveHeight(30),
    paddingHorizontal: getResponsiveWidth(30),
    gap: getResponsiveHeight(20),
  },
});
