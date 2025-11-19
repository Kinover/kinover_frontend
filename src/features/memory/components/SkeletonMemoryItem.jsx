import React from 'react';
import {View, StyleSheet} from 'react-native';
import {getResponsiveHeight} from '../../../utils/responsive';

export default function SkeletonMemoryItem() {
  return (
    <View style={styles.card}>
      <View style={styles.date} />
      <View style={styles.image} />
      <View style={styles.category} />
      <View style={styles.text1} />
      <View style={styles.text2} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#eee',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 26,
    marginVertical: 12,
    overflow: 'hidden',
  },
  date: {
    width: 80,
    height: 14,
    backgroundColor: '#ddd',
    borderRadius: 4,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: getResponsiveHeight(200),
    backgroundColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  category: {
    width: 70,
    height: 16,
    backgroundColor: '#ddd',
    borderRadius: 4,
    marginBottom: 6,
  },
  text1: {
    width: '70%',
    height: 14,
    backgroundColor: '#ddd',
    borderRadius: 4,
    marginBottom: 4,
  },
  text2: {
    width: '50%',
    height: 14,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
});
