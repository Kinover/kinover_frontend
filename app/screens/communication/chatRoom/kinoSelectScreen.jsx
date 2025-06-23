import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import { updateKinoPersonalityThunk } from '../../../redux/thunk/chatRoomThunk';
import { useRoute } from '@react-navigation/native';

const characterImages = [
  require('../../../assets/images/blueKino.png'),   // SUNNY
  require('../../../assets/images/pinkKino.png'),   // SERENE
  require('../../../assets/images/yellowKino.png'), // SNUGGLE
];

const personalityTypes = ['SUNNY', 'SERENE', 'SNUGGLE'];

export default function KinoSelectScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dispatch = useDispatch();
  const route = useRoute();
  const { chatRoomId } = route.params;

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? characterImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === characterImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleKinoSelect = () => {
    const selectedPersonality = personalityTypes[currentIndex];
    dispatch(updateKinoPersonalityThunk({ chatRoomId, personality: selectedPersonality }))
      .unwrap()
      .then((res) => {
        console.log('🎉 키노 유형 변경 완료:', res);
        // 이후 화면 이동이나 토스트 등 추가 로직 작성 가능!
      })
      .catch((err) => {
        console.error('🚨 키노 변경 실패:', err);
        // 에러 처리 UI 추가 가능
      });
  };

  return (
    <View style={styles.container}>
      {/* 텍스트 인삿말 */}
      <View style={styles.textBlock}>
        <Text style={styles.greeting}>안녕하세요,</Text>
        <Text style={styles.kinoText}>
          상담사 <Text style={styles.kinoHighlight}>키노</Text>예요.
        </Text>
        <Text style={styles.question}>어떤 고민을 가지고 계신가요?</Text>
      </View>

      {/* 캐릭터 캐러셀 */}
      <View style={styles.imageWrapper}>
        <TouchableOpacity style={styles.arrowButton} onPress={handlePrev}>
          <Image
            source={require('../../../assets/images/leftArrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>

        <View style={styles.characterBackground}>
          <Image
            source={characterImages[currentIndex]}
            style={styles.character}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity style={styles.arrowButton} onPress={handleNext}>
          <Image
            source={require('../../../assets/images/rightArrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>

      {/* 하단 버튼 */}
      <TouchableOpacity style={styles.button} onPress={handleKinoSelect}>
        <Text style={styles.buttonText}>교수님 상담사와 채팅하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(30),
    paddingBottom: getResponsiveHeight(30),
    justifyContent: 'space-between',
  },
  textBlock: {
    marginLeft: getResponsiveWidth(22),
  },
  greeting: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-Light',
  },
  kinoText: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-Light',
    marginTop: getResponsiveHeight(4),
  },
  kinoHighlight: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
  },
  question: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-Light',
    marginTop: getResponsiveHeight(4),
  },
  imageWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: getResponsiveHeight(20),
  },
  character: {
    width: getResponsiveWidth(160),
    height: getResponsiveWidth(160),
  },
  arrowButton: {
    paddingHorizontal: getResponsiveWidth(10),
  },
  arrowIcon: {
    width: getResponsiveIconSize(25),
    height: getResponsiveIconSize(25),
    resizeMode: 'contain',
  },
  characterBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    width: getResponsiveWidth(160),
    height: getResponsiveWidth(160),
    borderRadius: getResponsiveWidth(80),
    backgroundColor: 'rgba(255, 200, 77, 0.2)',
    shadowColor: '#FFC84D',
    shadowOffset: { width: 0, height: getResponsiveHeight(60) },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 15,
  },
  button: {
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveWidth(12),
    width: getResponsiveWidth(330),
    alignSelf: 'center',
    paddingVertical: getResponsiveHeight(14),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(15),
    color: 'black',
  },
});
