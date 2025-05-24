import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';

export default function NoticeCard({item, onPress}) {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => onPress(item)}>
      <View style={styles.cardBorder}></View>
      <View style={styles.cardContent}>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    width: getResponsiveWidth(350),
    height: getResponsiveHeight(130),
    borderRadius: getResponsiveWidth(15),
    backgroundColor: 'white',
    overflow: 'hidden',
    marginRight: getResponsiveWidth(0),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center',
  },
  cardBorder: {
    position: 'absolute',
    left:getResponsiveWidth(6.5),
    top:getResponsiveWidth(6),

    width: '96%',
    height: '90%',
    borderRadius: getResponsiveWidth(15),
    borderWidth:5,
    borderColor: '#FFC84D',
  },
  cardContent: {
    paddingVertical: getResponsiveWidth(20),
    paddingHorizontal: getResponsiveWidth(23),
  },
  cardCategory: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFC84D',
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#333',
  },
});
