import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {View, Text, Image, Dimensions, StyleSheet,TouchableOpacity} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { getResponsiveIconSize } from '../../../utils/responsive';

const {width} = Dimensions.get('window');
const {height} = Dimensions.get('window');

export default function CardSlider({data}) {
  const navigation = useNavigation();


  // 데이터 예시
  // data가 배열인지 확인하고, 데이터가 없으면 처리
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text>.</Text>
      </View>
    );
  } else {
    // 데이터가 있을 경우 카로셀을 보여줌
    return (
      <View style={styles.container}>
        <Carousel
          loop
          width={width} // 화면의 너비
          height={width * 0.8} // 슬라이드 높이
          autoPlay={true} // 자동 슬라이드
          data={data}
          scrollAnimationDuration={1000} // 슬라이드 애니메이션 시간
          keyExtractor={(item, index) => index.toString()} // 고유 key를 지정
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                // 아이템 클릭 시 RecChallengeDetailScreen으로 navigation
                navigation.navigate('추천챌린지세부화면', { challenge: item });
              }}
            >
              <Image source={{uri: item.image}} style={styles.image} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  card: {
    width: width * 0.8, // 카드를 화면 너비의 60%로 설정
    height: width * 0.8, // 카드 높이를 너비와 동일하게 설정하여 1:1 비율 유지
    justifyContent: 'center', // 수직 중앙 정렬
    alignSelf: 'center', // 수평 중앙 정렬
  },
  image: {
    width: '100%',
    height: '100%',
    alignSelf: 'center', // 수평 중앙 정렬
    borderRadius: getResponsiveIconSize(10),
    // marginBottom: 15,
  },
});
