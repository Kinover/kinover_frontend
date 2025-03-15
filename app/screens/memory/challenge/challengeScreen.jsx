import React from 'react';
import {StyleSheet, View,Text,Image} from 'react-native';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import { SCREEN_WIDTH } from '@gorhom/bottom-sheet';

export default function ChallengeScreen({navigation}) {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>운동 기록 인증하고 뱃지 받아요!</Text>
            <Image style={styles.headerImage} source={{uri:'https://i.postimg.cc/Zq6FSSQG/Group-486-1.png'}}></Image>
        </View>
      </View>

      <View style={styles.bodyContainer}>
        <Image style={styles.image} source={{uri: 'https://i.postimg.cc/pd2WCQKg/Rectangle-196.png'}}></Image>
        <Image style={styles.image} source={{uri: 'https://i.postimg.cc/pd2WCQKg/Rectangle-196.png'}}></Image>
        <Image style={styles.image} source={{uri: 'https://i.postimg.cc/pd2WCQKg/Rectangle-196.png'}}></Image>
        <View style={styles.image2}></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: getResponsiveHeight(230),
    backgroundColor: '#FFD372',
  },

  header: {
    position: 'relative',
    width: '90%',
    height: '90%',
  },

  headerTitle: {
    position: 'absolute',
    color: 'black',
    fontSize: getResponsiveFontSize(20),
    width: getResponsiveWidth(160),
    fontFamily: 'Pretendard-Light',
    textAlign: 'left',
    left: getResponsiveWidth(15),
    top: getResponsiveHeight(15),
    letterSpacing: 1,
  },

  headerImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: getResponsiveWidth(220),
    height: getResponsiveHeight(160),
    objectFit: 'contain',
  },

  bodyContainer: {
    width: '100%',
    height:'100%',
    backgroundColor: 'white',
    paddingVertical: getResponsiveIconSize(35),
    paddingHorizontal: getResponsiveIconSize(30),  // 좌우 패딩 추가
    flexDirection: 'row',  // 가로 배치
    flexWrap: 'wrap',      // 줄 바꿈 허용
    justifyContent: 'space-between', // 가로 정렬 (space-between or center 사용 가능)
  },

  image: {
    width: (SCREEN_WIDTH - getResponsiveIconSize(90)) / 3,  // 화면 너비에서 padding을 제외하고 3등분
    height: (SCREEN_WIDTH - getResponsiveIconSize(90)) / 3,  // 화면 너비에서 padding을 제외하고 3등분
    borderRadius: getResponsiveIconSize(15),
    marginBottom: getResponsiveIconSize(10), // 아래 간격 추가
  },

  image2: {
    width: (SCREEN_WIDTH - getResponsiveIconSize(90)) / 3,  // 화면 너비에서 padding을 제외하고 3등분
    height: (SCREEN_WIDTH - getResponsiveIconSize(90)) / 3,  // 화면 너비에서 padding을 제외하고 3등분
    borderRadius: getResponsiveIconSize(15),
    marginBottom: getResponsiveIconSize(10), // 아래 간격 추가
    backgroundColor:'#D9D9D9'
  },


});
