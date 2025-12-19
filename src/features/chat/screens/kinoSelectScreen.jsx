import React, {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
  Easing,
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
import {BACKGROUND_COLORS, BUTTON_STYLES} from 'styles/style';

const KINO_TYPE_TO_PERSONALITY = {
  YELLOW_KINO: 'SUNNY',
  BLUE_KINO: 'SERENE',
  PINK_KINO: 'SNUGGLE',
};
// ✅ kinoType 기준으로 통일
const KINOS = [
  {
    kinoType: 'YELLOW_KINO',
    image: require('../../../assets/images/yellowKino.png'),
    description:
      '안녕하세요~! \n\n저는 밝고 긍정적인 에너지를 전하는 상담사, 키노예요. \n\n언제든 기분이 꿀꿀할 땐 저랑 수다 떨어요~ \n웃으면서 기분 전환, 제가 책임질게요!',
  },
  {
    kinoType: 'BLUE_KINO',
    image: require('../../../assets/images/blueKino.png'),
    description:
      '안녕하세요. \n\n저는 잔잔하고 조용하게 곁을 지켜주는 상담사, 키노입니다. \n\n말하지 않아도 괜찮아요.\n천천히, 편안하게 당신의 이야기를 들어드릴게요.',
  },
  {
    kinoType: 'PINK_KINO',
    image: require('../../../assets/images/pinkKino.png'),
    description:
      '아… 안녕하세요… \n\n저는 부족하지만 진심으로 곁에 있고 싶은 상담사, 키노예요. \n\n뭔가 잘 모르지만… 그냥 옆에 있고 싶었어요.\n우리 같이, 천천히 이야기해봐요…!',
  },
];

const mod = (n, m) => ((n % m) + m) % m;

// ✅ 배경 원 팔레트 (kinoType)
const CIRCLE_PALETTE = {
  YELLOW_KINO: {soft: '#FFF3DE', strong: '#FFE7C4'},
  BLUE_KINO: {soft: '#EAF4FF', strong: '#D7E9FF'},
  // PINK_KINO: {soft: '#FFEAF2', strong: '#FFD6E5'},
  PINK_KINO: {soft: '#FFF8FB', strong: '#FFEAF2'},
};

// ✅ 설명 카드 팔레트 (kinoType)
const CARD_PALETTE = {
  YELLOW_KINO: {
    bg: '#FFFBF3',
    border: 'rgba(244,226,208,0.9)',
    shadow: '#E4D2BF',
    highlight: '#F59E0B',
  },
  BLUE_KINO: {
    bg: '#F3F8FF',
    border: 'rgba(205,228,255,0.9)',
    shadow: '#C7DBF5',
    highlight: '#3B82F6',
  },
  PINK_KINO: {
    bg: '#FFF9FB',
    border: 'rgba(255,214,229,0.9)',
    shadow: '#F2C9DA',
    highlight: '#EC4899',
  },
};

export default function KinoSelectScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const {chatRoomId} = route.params;

  const {width: screenW} = useWindowDimensions();
  const length = KINOS.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const carouselRef = useRef(null);
  const floatAnim = useRef(new Animated.Value(0)).current;

  // ✅ 배경 원 애니메이션 값들 (슬라이드업 + 페이드)
  const circleSoftY = useRef(
    new Animated.Value(getResponsiveHeight(44)),
  ).current;
  const circleSoftOpacity = useRef(new Animated.Value(0)).current;

  const circleStrongY = useRef(
    new Animated.Value(getResponsiveHeight(58)),
  ).current;
  const circleStrongOpacity = useRef(new Animated.Value(0)).current;

  useHideTabBar({stayHidden: true});

  const ARROW_W = getResponsiveWidth(46);
  const ARROW_H = getResponsiveWidth(46);
  const carouselHeight = screenW * 0.55;

  const handlePrev = useCallback(() => {
    const target = mod(currentIndex - 1, length);
    setCurrentIndex(target);
    carouselRef.current?.scrollTo?.({index: target, animated: true});
  }, [currentIndex, length]);

  const handleNext = useCallback(() => {
    const target = mod(currentIndex + 1, length);
    setCurrentIndex(target);
    carouselRef.current?.scrollTo?.({index: target, animated: true});
  }, [currentIndex, length]);

  const handleKinoSelect = () => {
    const selectedKinoType = KINOS[currentIndex].kinoType;
    const selectedPersonality = KINO_TYPE_TO_PERSONALITY[selectedKinoType];

    dispatch(
      updateKinoPersonalityThunk({
        chatRoomId,
        personality: selectedPersonality, // ✅ 이걸로 보내야 서버가 바뀜
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

  // ✅ 현재 선택 kinoType
  const currentKinoType = useMemo(() => {
    return KINOS[currentIndex]?.kinoType || 'YELLOW_KINO';
  }, [currentIndex]);

  // ✅ 현재 선택 kinoType에 따른 원 색상
  const circleColors = useMemo(() => {
    return CIRCLE_PALETTE[currentKinoType] || CIRCLE_PALETTE.YELLOW_KINO;
  }, [currentKinoType]);

  // ✅ 현재 선택 kinoType에 따른 카드 색상
  const cardColors = useMemo(() => {
    return CARD_PALETTE[currentKinoType] || CARD_PALETTE.YELLOW_KINO;
  }, [currentKinoType]);

  const highlightKinoName = text => {
    if (!text) return null;
    const parts = text.split(/(키노)/g);
    return parts.map((part, i) =>
      part === '키노' ? (
        <Text
          key={i}
          style={[styles.kinoHighlight, {color: cardColors.highlight}]}>
          {part}
        </Text>
      ) : (
        <Text key={i} style={styles.kinoText}>
          {part}
        </Text>
      ),
    );
  };

  // 둥둥 모션(캐릭터)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
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
          outputRange: [0, -6],
        }),
      },
      {
        scale: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02],
        }),
      },
    ],
  };

  // ✅ 캐릭터(키노)가 바뀔 때마다: 원 2개가 아래에서 위로 올라오며 깔리기
  useEffect(() => {
    circleSoftY.setValue(getResponsiveHeight(54));
    circleSoftOpacity.setValue(0);

    circleStrongY.setValue(getResponsiveHeight(72));
    circleStrongOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(circleStrongY, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(circleStrongOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      Animated.timing(circleSoftY, {
        toValue: 0,
        duration: 460,
        delay: 40,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(circleSoftOpacity, {
        toValue: 1,
        duration: 240,
        delay: 40,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    currentIndex,
    circleSoftY,
    circleSoftOpacity,
    circleStrongY,
    circleStrongOpacity,
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>키노를 선택해주세요</Text>
      <Text style={styles.subtitle}>각기 다른 성격의 키노를 만나보세요</Text>

      {/* ✅ 카드도 키노 색에 맞게 변경 */}
      <View
        style={[
          styles.textCard,
          {
            backgroundColor: cardColors.bg,
            borderColor: cardColors.border,
            shadowColor: cardColors.shadow,
          },
        ]}>
        <View style={styles.textCardContent}>
          <FadingKinoText
            index={currentIndex}
            descriptions={KINOS.map(k => k.description)}
            renderRichText={text => (
              <Text style={styles.kinoText}>{highlightKinoName(text)}</Text>
            )}
          />
        </View>
      </View>

      <View style={[styles.carouselArea, {width: screenW}]}>
        {/* 배경 원 */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.circleSoft,
            {
              backgroundColor: circleColors.soft,
              transform: [{translateY: circleSoftY}],
              opacity: circleSoftOpacity,
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.circleStrong,
            {
              backgroundColor: circleColors.strong,
              transform: [{translateY: circleStrongY}],
              opacity: circleStrongOpacity,
            },
          ]}
        />

        {/* 캐러셀 */}
        <View
          style={[
            styles.carouselHolder,
            {width: screenW, height: carouselHeight},
          ]}>
          <Carousel
            ref={carouselRef}
            data={KINOS}
            loop={false}
            width={screenW}
            height={carouselHeight}
            defaultIndex={0}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.93,
              parallaxAdjacentItemScale: 0.62,
            }}
            onSnapToItem={idx => setCurrentIndex(mod(idx, length))}
            scrollAnimationDuration={620}
            renderItem={({item}) => (
              <Animated.View
                style={[
                  styles.characterCard,
                  {width: screenW, height: carouselHeight},
                  floatStyle,
                ]}>
                {/* <Image
                  source={require('../../../assets/icons/background-effect.png')}
                  style={styles.characterBackground}
                  resizeMode="contain"
                /> */}
                <Image
                  source={item.image}
                  style={styles.character}
                  resizeMode="contain"
                />
              </Animated.View>
            )}
          />
        </View>

        {/* 화살표 */}
        <TouchableOpacity
          style={[
            styles.arrowButton,
            {left: getResponsiveWidth(10), width: ARROW_W, height: ARROW_H},
          ]}
          onPress={handlePrev}
          activeOpacity={0.9}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <View style={styles.arrowGlass} />
          <Image
            source={require('../../../assets/images/leftArrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.arrowButton,
            {right: getResponsiveWidth(10), width: ARROW_W, height: ARROW_H},
          ]}
          onPress={handleNext}
          activeOpacity={0.9}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <View style={styles.arrowGlass} />
          <Image
            source={require('../../../assets/images/rightArrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>

      <BottomActionButton
        label="선택 완료"
        onPress={() => setConfirmVisible(true)}
      />

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
    if (!descriptions || descriptions.length === 0) return;

    Animated.parallel([
      Animated.timing(fade, {toValue: 0, duration: 120, useNativeDriver: true}),
      Animated.timing(translateY, {
        toValue: 6,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const safeIndex = index >= 0 && index < descriptions.length ? index : 0;
      setDisplayIndex(safeIndex);
      translateY.setValue(8);

      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [index, descriptions, fade, translateY]);

  const text = descriptions?.[displayIndex] ?? '';
  return (
    <Animated.View style={{opacity: fade, transform: [{translateY}]}}>
      {renderRichText(text)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getResponsiveHeight(45),
    paddingHorizontal: getResponsiveWidth(20),
    paddingBottom: getResponsiveHeight(16),
    backgroundColor: '#F9F9F9',
  },

  title: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-SemiBold',
    color: 'black',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(6),
    zIndex: 5,
  },
  subtitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Light',
    color: '#6B7280',
    textAlign: 'center',
    zIndex: 5,
    marginBottom: getResponsiveHeight(18),
  },

  textCard: {
    width: '100%',
    paddingVertical: getResponsiveHeight(16),
    paddingHorizontal: getResponsiveWidth(18),
    borderRadius: getResponsiveWidth(20),

    // ✅ 기본값(혹시 모를 fallback)
    backgroundColor: BACKGROUND_COLORS.primaryBg,
    borderWidth: 1,
    borderColor: 'rgba(244,226,208,0.9)',

    marginTop: getResponsiveHeight(10),
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 4,
    zIndex: 10,
  },
  textCardContent: {
    maxHeight: getResponsiveHeight(90),
    overflow: 'hidden',
  },

  kinoText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily:
      Platform.OS === 'android' ? 'Pretendard-Regular' : 'Pretendard-Light',
    lineHeight: getResponsiveHeight(18),
    color: '#18181B',
  },
  kinoHighlight: {
    fontFamily: 'Pretendard-Bold',
  },

  carouselArea: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveHeight(160),
    position: 'relative',
  },

  circleSoft: {
    position: 'absolute',
    width: getResponsiveWidth(700),
    height: getResponsiveWidth(700),
    top: getResponsiveHeight(-170),
    right: getResponsiveHeight(80),
    borderRadius: 999,
    alignSelf: 'center',
    opacity: 0.7,
    zIndex: -1,
  },
  circleStrong: {
    position: 'absolute',
    width: getResponsiveWidth(1300),
    height: getResponsiveWidth(1300),
    borderRadius: 999,
    top: getResponsiveHeight(-120),
    left: getResponsiveHeight(-150),
    alignSelf: 'center',
    opacity: 0.87,
    zIndex: 0,
  },

  carouselHolder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  characterCard: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterBackground: {
    position: 'absolute',
    width: getResponsiveWidth(260),
    height: getResponsiveWidth(260),
    top: '50%',
    left: '50%',
    marginLeft: -getResponsiveWidth(130),
    marginTop: -getResponsiveWidth(130),
  },
  character: {
    width: getResponsiveWidth(185),
    height: getResponsiveWidth(185),
    zIndex: 2,
  },

  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -getResponsiveWidth(23),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  arrowGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(240,230,215,0.9)',
    shadowColor: '#E0D4C4',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  arrowIcon: {
    width: getResponsiveIconSize(18),
    height: getResponsiveIconSize(18),
    resizeMode: 'contain',
    tintColor: BUTTON_STYLES.saveBg,
  },
});
