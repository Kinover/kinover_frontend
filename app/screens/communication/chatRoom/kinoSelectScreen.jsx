import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import {useDispatch} from 'react-redux';
import KinoConfirmModal from './kinoConfirmModal';
import {useCallback} from 'react';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {updateKinoPersonalityThunk} from '../../../redux/thunk/chatRoomThunk';
import {useFocusEffect, useRoute} from '@react-navigation/native';
import useHideTabBar from '../../../hooks/useHideTabBar';
import {useNavigation} from '@react-navigation/native';

const characterImages = [
  require('../../../assets/images/yellowKino.png'), // SNUGGLE
  require('../../../assets/images/blueKino.png'), // SUNNY
  require('../../../assets/images/pinkKino.png'), // SERENE
];

const personalityTypes = ['SUNNY', 'SERENE', 'SNUGGLE'];

export default function KinoSelectScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dispatch = useDispatch();
  const route = useRoute();
  const {chatRoomId} = route.params;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const navigation = useNavigation();
  const kinoDescriptions = [
    `안녕하세요~! \n\n저는 밝고 긍정적인 에너지를 전하는 상담사, 키노예요. \n\n언제든 기분이 꿀꿀할 땐 저랑 수다 떨어요~\n웃으면서 기분 전환, 제가 책임질게요!`, // SUNNY
    `안녕하세요. \n\n저는 잔잔하고 조용하게 곁을 지켜주는 상담사, 키노입니다. \n\n말하지 않아도 괜찮아요.\n천천히, 편안하게 당신의 이야기를 들어드릴게요.`, // SERENE
    `아… 안녕하세요… \n\n저는 부족하지만 진심으로 곁에 있고 싶은 상담사, 키노예요. \n\n뭔가 잘 모르지만… 그냥 옆에 있고 싶었어요.\n우리 같이, 천천히 이야기해봐요…!`, // SNUGGLE
  ];

  useHideTabBar({stayHidden: true}); // ✅ 반드시 함수 "호출" 형태여야 함!

  const handlePrev = () => {
    setCurrentIndex(prev =>
      prev === 0 ? characterImages.length - 1 : prev - 1,
    );
  };

  const handleNext = () => {
    setCurrentIndex(prev =>
      prev === characterImages.length - 1 ? 0 : prev + 1,
    );
  };

  const handleKinoSelect = () => {
    const selectedPersonality = personalityTypes[currentIndex];
    dispatch(
      updateKinoPersonalityThunk({
        chatRoomId,
        personality: selectedPersonality,
      }),
    )
      .unwrap()
      .then(res => {
        console.log('🎉 키노 유형 변경 완료:', res);
        // ✅ 선택 완료 후 소통 화면으로 이동!
        navigation.reset({
          index: 0,
          routes: [{name: 'Tabs', params: {screen: '소통'}}],
        });
      })
      .catch(err => {
        console.error('🚨 키노 변경 실패:', err);
      });
  };

  const highlightKinoName = text => {
    const parts = text.split(/(키노)/g); // '키노' 기준으로 split하면서 그룹 유지
    return parts.map((part, index) => {
      if (part === '키노') {
        return (
          <Text key={index} style={styles.kinoHighlight}>
            {part}
          </Text>
        );
      } else {
        return (
          <Text key={index} style={styles.kinoText}>
            {part}
          </Text>
        );
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* 텍스트 인삿말 */}
      <View style={styles.textBlock}>
        <Text style={styles.kinoText}>
          {highlightKinoName(kinoDescriptions[currentIndex])}
        </Text>
      </View>

      {/* 캐릭터 캐러셀 */}
      <View style={styles.characterWrapper}>
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
      <TouchableOpacity
        style={styles.button}
        onPress={() => setConfirmVisible(true)}>
        <Text style={styles.buttonText}>이 키노로 선택하기</Text>
      </TouchableOpacity>

      <KinoConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onConfirm={handleKinoSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(30),
    paddingBottom: getResponsiveHeight(50),
    alignItems: 'center',
  },

  textBlock: {
    marginHorizontal: getResponsiveWidth(20),
    marginBottom: getResponsiveHeight(20),
  },

  characterWrapper: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    transform: [{translateY: -getResponsiveWidth(40)}], // 높이 절반만큼 위로!
    paddingHorizontal: getResponsiveWidth(20),
  },

  characterBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    width: getResponsiveWidth(40),
    height: getResponsiveWidth(40),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 200, 77, 0.2)',
    shadowColor: '#FFC84D',
    shadowOffset: {width: 0, height: getResponsiveHeight(60)},
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 15,
  },

  button: {
    position: 'absolute',
    bottom: getResponsiveHeight(50),
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveWidth(12),
    width: getResponsiveWidth(330),
    alignSelf: 'center',
    paddingVertical: getResponsiveHeight(14),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  textBlock: {
    marginHorizontal: getResponsiveWidth(20),
  },
  greeting: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-Light',
  },
  kinoText: {
    fontSize: getResponsiveFontSize(17.5),
    fontFamily: 'Pretendard-Light',
    marginTop: getResponsiveHeight(4),
  },
  kinoHighlight: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
  },
  highlight: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#FF9F1C',
  },
  question: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-Light',
    marginTop: getResponsiveHeight(4),
  },
  imageWrapper: {
    flex: 1,
    height: '100%',
    position: 'absolute',
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

  buttonText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(15),
    color: 'black',
  },
});
