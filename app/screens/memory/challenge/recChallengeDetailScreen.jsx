import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

export default function RecChallengeDetailScreen({ route }) {
  const { challenge } = route.params;

  return (
    <ScrollView style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{challenge.title}</Text>
        <View style={styles.categoryLine}>
          {challenge.categories.map((category, index) => (
            <View
              key={index}
              style={[styles.category, { width: getResponsiveWidth(25+category.length * 10) }]} // 글자 길이에 맞춰 너비 조정
            >
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bodyContainer}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>기간</Text>
          <Text style={styles.sectionDescription}>{challenge.duration}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>참여 방법</Text>
          <Text style={styles.sectionDescription}>{challenge.taskDescription}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>달성 시 리워드</Text>
          <Text style={styles.sectionDescription}>{challenge.rewardDescription}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <TouchableOpacity style={[styles.startButton]}>
            <Text style={styles.buttonText}>오늘의 챌린지 도전하러 가기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(40),
    paddingVertical: getResponsiveHeight(20),
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    backgroundColor: 'white',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    height: getResponsiveHeight(100),
    gap: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(25),
  },

  title: {
    fontSize: getResponsiveFontSize(30),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
  },

  categoryLine: {
    width: getResponsiveWidth(300),
    height: getResponsiveHeight(50),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: getResponsiveWidth(10),
  },

  category: {
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    backgroundColor: '#FFC84D',
    height: getResponsiveHeight(19),
    borderRadius: getResponsiveIconSize(14.5),
  },

  categoryText: {
    fontFamily: 'Prentendard-Light',
    color: 'black',
    fontSize: getResponsiveFontSize(12),
    textAlign: 'center',
  },

  bodyContainer: {
    display: 'flex',
    width: '100%',
    height:'100%',
    flexDirection: 'column',
    gap: getResponsiveHeight(40),
  },

  sectionContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: getResponsiveHeight(15),
    alignContent: 'flex-start',
  },

  sectionTitle: {
    fontSize: getResponsiveFontSize(20),
    color: '#EBA710',
    fontFamily: 'Pretendard-Bold',
  },

  sectionDescription: {
    paddingLeft: getResponsiveWidth(3),
    fontSize: getResponsiveFontSize(15.89),
    color: 'black',
    fontFamily: 'Pretendard-Light',
  },

  startButton: {
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC84D',
    alignSelf: 'center',
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(43),
    borderRadius: getResponsiveIconSize(10),
  },

  buttonText: {
    color: 'black',
    fontFamily: 'Pretendard-Light',
    textAlign: 'center',
  },
});
