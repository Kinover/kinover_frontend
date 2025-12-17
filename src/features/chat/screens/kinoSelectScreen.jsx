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
import {BUTTON_STYLES} from 'styles/style';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const carouselRef = useRef(null);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useHideTabBar({stayHidden: true});

  const length = KINOS.length;

  const goto = i => {
    const wrapped = ((i % length) + length) % length;
    carouselRef.current?.scrollTo?.({index: wrapped, animated: true});
  };

  const handlePrev = () => goto(currentIndex - 1);
  const handleNext = () => goto(currentIndex + 1);

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

  // 캐릭터 떠다니는 애니메이션
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  const floatStyle = {
    transform: [
      {
        translateY: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
      {
        scale: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.025],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>키노 선택</Text>
        <Text style={styles.headerSubtitle}>
          채팅방에서 함께 이야기 나눌 키노를 골라주세요.
        </Text>
      </View>

      {/* 소개 텍스트 카드 */}
      <View style={styles.textCard}>
        <FadingKinoText
          index={currentIndex}
          descriptions={KINOS.map(k => k.description)}
          renderRichText={text => (
            <Text style={styles.kinoText}>{highlightKinoName(text)}</Text>
          )}
        />
      </View>

      {/* 캐릭터 캐러셀 영역 */}
      <View style={styles.carouselArea}>
        {/* 배경 원 2겹 */}
        <View style={styles.circleBgSoft} />
        <View style={styles.circleBg} />

        <View style={styles.carouselRow}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={handlePrev}
            activeOpacity={0.9}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <View style={styles.arrowGlass} />
            <Image
              source={require('../../../assets/images/leftArrow.png')}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>

          <View style={styles.carouselHolder}>
            <Carousel
              ref={carouselRef}
              width={SCREEN_WIDTH}
              height={SCREEN_WIDTH * 0.58}
              data={KINOS}
              loop={false}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.92,
                parallaxAdjacentItemScale: 0.82,
              }}
              onProgressChange={(_, absProgress) => {
                setCurrentIndex(Math.round(absProgress));
              }}
              scrollAnimationDuration={600}
              renderItem={({item}) => (
                <Animated.View style={[styles.characterCard, floatStyle]}>
                  <Image
                    source={require('../../../assets/icons/background-effect.png')}
                    style={styles.characterBackground}
                    resizeMode="contain"
                  />
                  <Image
                    source={item.image}
                    style={styles.character}
                    resizeMode="contain"
                  />
                </Animated.View>
              )}
            />
          </View>

          <TouchableOpacity
            style={styles.arrowButton}
            onPress={handleNext}
            activeOpacity={0.9}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <View style={styles.arrowGlass} />
            <Image
              source={require('../../../assets/images/rightArrow.png')}
              style={styles.arrowIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 아래 CTA */}
      <View style={styles.bottomButtonWrap}>
        <BottomActionButton
          label="이 키노로 선택하기"
          onPress={() => setConfirmVisible(true)}
        />
      </View>

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
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 6,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDisplayIndex(index);
      translateY.setValue(8);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [index, fade, translateY]);

  return (
    <Animated.View style={{opacity: fade, transform: [{translateY}]}}>
      {renderRichText(descriptions[displayIndex])}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(22),
    paddingBottom: getResponsiveHeight(24),
  },

  /* 헤더 */
  headerBlock: {
    marginBottom: getResponsiveHeight(12),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(22),
    fontFamily: 'Pretendard-SemiBold',
    color: '#1F2933',
    marginBottom: getResponsiveHeight(4),
  },
  headerSubtitle: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#7A6A5F',
    lineHeight: getResponsiveHeight(20),
  },

  /* 텍스트 카드 (글래스모피즘) */
  textCard: {
    width: '100%',
    paddingVertical: getResponsiveHeight(18),
    paddingHorizontal: getResponsiveWidth(18),
    borderRadius: getResponsiveWidth(20),
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(244,226,208,0.8)',
    marginBottom: getResponsiveHeight(18),

    shadowColor: '#E4D2BF',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 5,
  },
  kinoText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily:
      Platform.OS === 'android' ? 'Pretendard-Regular' : 'Pretendard-Light',
    lineHeight: getResponsiveHeight(18),
    color: '#18181B',
  },
  kinoHighlight: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
  },

  /* 캐러셀 영역 */
  carouselArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    top: '6%',
  },
  circleBgSoft: {
    position: 'absolute',
    width: getResponsiveWidth(320),
    height: getResponsiveWidth(320),
    borderRadius: getResponsiveWidth(340) / 2,
    backgroundColor: '#FFF3DE',
    top: '2%',
    alignSelf: 'center',
    opacity: 0.6,
  },
  circleBg: {
    position: 'absolute',
    width: getResponsiveWidth(240),
    height: getResponsiveWidth(240),
    borderRadius: getResponsiveWidth(280) / 2,
    backgroundColor: '#FFE7C4',
    top: '2%',
    alignSelf: 'center',
    opacity: 0.9,
  },
  carouselRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(12),
  },
  carouselHolder: {
    flex: 1,
    alignItems: 'center',
  },
  characterCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterBackground: {
    position: 'absolute',
    width: getResponsiveWidth(260),
    height: getResponsiveWidth(260),
  },
  character: {
    width: getResponsiveWidth(185),
    height: getResponsiveWidth(185),
  },

  /* 화살표 버튼 */
  arrowButton: {
    width: getResponsiveWidth(48),
    height: getResponsiveWidth(48),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(240,230,215,0.9)',
    shadowColor: '#E0D4C4',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  arrowIcon: {
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    resizeMode: 'contain',
    tintColor: BUTTON_STYLES.saveBg,
  },

  /* 아래 CTA */
  bottomButtonWrap: {
    marginTop: getResponsiveHeight(12),
  },
});
