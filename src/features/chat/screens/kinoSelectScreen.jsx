import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {useDispatch} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';

import KinoConfirmModal from '../components/kinoConfirmModal';
import useHideTabBar from '../../../hooks/useHideTabBar';
import {updateKinoPersonalityThunk} from '../store/chatRoomThunk';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import BottomActionButton from 'components/BottomActionButton';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 🔗 데이터 하나로 묶어서 매핑 실수 방지
const KINOS = [
  {
    personality: 'SUNNY',
    image: require('../../../assets/images/yellowKino.png'),

    description:
      '안녕하세요~! \n\n저는 밝고 긍정적인 에너지를 전하는 상담사, 키노예요. \n\n언제든 기분이 꿀꿀할 땐 저랑 수다 떨어요~ \n웃으면서 기분 전환, 제가 책임질게요!',
  },
  {
    personality: 'SERENE',
    image: require('../../../assets/images/blueKino.png'),

    description:
      '안녕하세요. \n\n저는 잔잔하고 조용하게 곁을 지켜주는 상담사, 키노입니다. \n\n말하지 않아도 괜찮아요.\n천천히, 편안하게 당신의 이야기를 들어드릴게요.',
  },
  {
    personality: 'SNUGGLE',
    image: require('../../../assets/images/pinkKino.png'),

    description:
      '아… 안녕하세요… \n\n저는 부족하지만 진심으로 곁에 있고 싶은 상담사, 키노예요. \n\n뭔가 잘 모르지만… 그냥 옆에 있고 싶었어요.\n우리 같이, 천천히 이야기해봐요…!',
  },
];

export default function KinoSelectScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const {chatRoomId} = route.params;

  const length = KINOS.length;

  const goto = i => {
    const wrapped = ((i % length) + length) % length; // 음수 방지
    carouselRef.current?.scrollTo?.({
      index: wrapped,
      animated: true,
    });
  };

  const handlePrev = () => goto(currentIndex - 1);
  const handleNext = () => goto(currentIndex + 1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const carouselRef = useRef(null);

  useHideTabBar({stayHidden: true});

  const handleKinoSelect = () => {
    const selected = KINOS[currentIndex].personality;
    dispatch(
      updateKinoPersonalityThunk({
        chatRoomId,
        personality: selected,
      }),
    )
      .unwrap()
      .then(() => {
        navigation.reset({
          index: 0,
          routes: [{name: 'Tabs', params: {screen: '소통'}}],
        });
      })
      .catch(err => console.error('🚨 키노 변경 실패:', err));
  };

  const highlightKinoName = text => {
    const parts = text.split(/(키노)/g);
    return parts.map((part, i) =>
      part === '키노' ? (
        <Text key={i} style={styles.kinoHighlight}>
          {part}
        </Text>
      ) : (
        <Text key={i} style={styles.kinoText}>
          {part}
        </Text>
      ),
    );
  };

  return (
    <View style={styles.container}>
      {/* 소개 텍스트 */}
      <View style={styles.textBlock}>
        <FadingKinoText
          index={currentIndex}
          descriptions={KINOS.map(k => k.description)}
          renderRichText={text => (
            <Text style={styles.kinoText}>{highlightKinoName(text)}</Text>
          )}
        />
      </View>

      {/* 캐릭터 캐러셀 */}
      <View style={styles.carouselRow}>
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={handlePrev}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Image
            source={require('../../../assets/images/leftArrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>

        <View style={styles.carouselHolder}>
          <Carousel
            ref={carouselRef}
            width={SCREEN_WIDTH}
            height={SCREEN_WIDTH * 0.65}
            data={KINOS}
            loop={false}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.9,
              parallaxAdjacentItemScale: 0.8,
            }}
            onProgressChange={(_, absProgress) => {
              // loop 모드에서 가장 정확
              setCurrentIndex(Math.round(absProgress));
            }}
            scrollAnimationDuration={600}
            renderItem={({item, index}) => (
              <View style={styles.characterCard}>
                <Image
                  source={item.image}
                  style={styles.character}
                  resizeMode="contain"
                />
                {/* <View style={styles.characterBackground}></View> */}
                <Image
                  source={require('../../../assets/icons/background-effect.png')}
                  style={styles.characterBackground}
                />
                {/* <Text style={styles.personalityLabel}>{item.personality}</Text> */}
              </View>
            )}
          />
        </View>

        <TouchableOpacity
          style={styles.arrowButton}
          onPress={handleNext}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Image
            source={require('../../../assets/images/rightArrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>

      <BottomActionButton
        label="이 키노로 선택하기"
        onPress={() => {
          setConfirmVisible(true);
        }}></BottomActionButton>

      <KinoConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onConfirm={handleKinoSelect}
      />
    </View>
  );
}

function FadingKinoText({index, descriptions, renderRichText}) {
  const [displayIndex, setDisplayIndex] = useState(index);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1) fade out
    Animated.timing(fade, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      // 2) 내용 교체
      setDisplayIndex(index);
      // 3) fade in
      Animated.timing(fade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [index]);

  return (
    <Animated.View style={{opacity: fade}}>
      {renderRichText(descriptions[displayIndex])}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(25),
    paddingBottom: getResponsiveHeight(40),
    alignItems: 'center',
  },

  textBlock: {
    paddingHorizontal: getResponsiveWidth(20),
    marginBottom: getResponsiveHeight(10),
  },
  kinoText: {
    fontSize: getResponsiveFontSize(17.5),
    fontFamily:
      Platform.OS === 'android' ? 'Pretendard-Regular' : 'Pretendard-Light',
    lineHeight: getResponsiveHeight(24),
    color: 'black',
  },
  kinoHighlight: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
  },

  carouselRow: {
    position: 'absolute',
    alignSelf: 'center',
    marginTop: getResponsiveHeight(10),
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
    top: '35%',
  },
  carouselHolder: {
    flex: 1,
    alignItems: 'center',
  },
  characterCard: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  characterBackground: {
    position: 'absolute',
    width: getResponsiveWidth(300),
    height: getResponsiveWidth(300),
    zIndex: -1,
  },
  character: {
    alignSelf: 'center',
    width: getResponsiveWidth(180),
    height: getResponsiveWidth(180),
  },
  personalityLabel: {
    marginTop: getResponsiveHeight(12),
    fontSize: getResponsiveFontSize(10),
    color: '#111',
    fontFamily: 'Pretendard-Medium',
  },

  arrowButton: {
    paddingHorizontal: getResponsiveWidth(10),
    zIndex: 100,
  },
  arrowIcon: {
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    resizeMode: 'contain',
  },

  dots: {
    flexDirection: 'row',
    gap: getResponsiveWidth(6),
    marginTop: getResponsiveHeight(16),
    marginBottom: getResponsiveHeight(12),
  },
  dot: {
    width: getResponsiveWidth(8),
    height: getResponsiveWidth(8),
    borderRadius: 99,
    backgroundColor: '#E6E6E6',
  },
  dotActive: {
    backgroundColor: '#FFC84D',
    // width: getResponsiveWidth(20),
    borderRadius: getResponsiveWidth(10),
  },

  button: {
    position: 'absolute',
    bottom: getResponsiveHeight(50),
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveWidth(12),
    width: getResponsiveWidth(330),
    alignSelf: 'center',
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(14)
        : getResponsiveHeight(17),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.1,
    shadowRadius: 30,
    // elevation: 7,
  },
  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '700',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(17)
        : getResponsiveFontSize(19),
    color: 'white',
    lineHeight: 22,
  },
});
