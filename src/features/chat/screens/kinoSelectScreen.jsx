/* eslint-disable react-native/no-inline-styles */
// src/features/chat/screens/KinoSelectScreen.jsx

import React, {useEffect, useRef, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {useDispatch} from 'react-redux';
import {useNavigation, useRoute} from '@react-navigation/native';

import KinoConfirmModal from '../components/kinoConfirmModal';
import useHideTabBar from 'hooks/useHideTabBar';
import {updateKinoPersonalityThunk} from '../store/chatRoomThunk';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';
import {BUTTON_STYLES} from 'styles/style';
import SelectionFrameLayout from 'components/layouts/SelectionFrameLayout';

const KINO_TYPE_TO_PERSONALITY = {
  YELLOW_KINO: 'SUNNY',
  BLUE_KINO: 'SERENE',
  PINK_KINO: 'SNUGGLE',
};

// kinoType 기준으로 통일
const KINOS = [
  {
    kinoType: 'YELLOW_KINO',
    title: '옐로 키노',
    tone: '밝고 경쾌한 스타일',
    image: require('../../../assets/kinos/yellowKino.png'),
    description:
      '안녕하세요~!\n\n저는 밝고 긍정적인 에너지를 전하는 상담사, 키노예요.\n\n언제든 기분이 꿀꿀할 땐 저랑 수다 떨어요~\n웃으면서 기분 전환, 제가 책임질게요!',
  },
  {
    kinoType: 'BLUE_KINO',
    title: '블루 키노',
    tone: '차분하고 안정적인 스타일',
    image: require('../../../assets/kinos/blueKino.png'),
    description:
      '안녕하세요.\n\n저는 잔잔하고 조용하게 곁을 지켜주는 상담사, 키노입니다.\n\n말하지 않아도 괜찮아요.\n천천히, 편안하게 당신의 이야기를 들어드릴게요.',
  },
  {
    kinoType: 'PINK_KINO',
    title: '핑크 키노',
    tone: '다정하고 공감형 스타일',
    image: require('../../../assets/kinos/pinkKino.png'),
    description:
      '아… 안녕하세요…\n\n저는 부족하지만 진심으로 곁에 있고 싶은 상담사, 키노예요.\n\n뭔가 잘 모르지만… 그냥 옆에 있고 싶었어요.\n우리 같이, 천천히 이야기해봐요…!',
  },
];

const mod = (n, m) => ((n % m) + m) % m;

// 설명 카드 팔레트 (kinoType)
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

const SCREEN_BG = {
  YELLOW_KINO: '#FFF8ED',
  BLUE_KINO: '#F4F8FF',
  PINK_KINO: '#FFF5FA',
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
        personality: selectedPersonality, // 이걸로 보내야 서버가 바뀜
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

  const currentKinoType = useMemo(() => {
    return KINOS[currentIndex]?.kinoType || 'YELLOW_KINO';
  }, [currentIndex]);

  const cardColors = useMemo(() => {
    return CARD_PALETTE[currentKinoType] || CARD_PALETTE.YELLOW_KINO;
  }, [currentKinoType]);

  const screenBg = useMemo(() => {
    return SCREEN_BG[currentKinoType] || SCREEN_BG.YELLOW_KINO;
  }, [currentKinoType]);

 /**
 * 줄바꿈 안정화 + 하이라이트(키노) 유지:
 * - "한 줄"만 받아서 하이라이트 처리
 * - 전체 텍스트는 split('\n') 후, 하나의 Text 컨테이너 안에서 렌더
 */
  const renderHighlightedLine = useCallback(
    line => {
      if (!line) return null;
      const parts = line.split(/(키노예요|키노입니다|키노)/g);

      return parts.map((part, i) =>
        part === '키노' || part === '키노예요' || part === '키노입니다' ? (
          <Text
            key={`h-${i}`}
            style={[styles.kinoText, styles.kinoHighlight, {color: cardColors.highlight}]}>
            {part}
          </Text>
        ) : (
          <Text key={`t-${i}`} style={styles.kinoText}>
            {part}
          </Text>
        ),
      );
    },
    [cardColors.highlight],
  );

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

  return (
    <SelectionFrameLayout
      title="키노를 선택해주세요"
      subtitle="원하는 대화 스타일의 키노를 골라보세요."
      backgroundColor={screenBg}
      actionLabel="선택 완료"
      onActionPress={() => setConfirmVisible(true)}
      headerExtra={
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            KINO PERSONA
          </Text>
        </View>
      }
    >
      <View style={styles.bubbleWrap}>
        <View
          style={[
            styles.textCard,
            {
              borderColor: cardColors.border,
              shadowColor: cardColors.shadow,
            },
          ]}>
          <View style={styles.textCardContent}>
            <FadingKinoText
              index={currentIndex}
              descriptions={KINOS.map(k => k.description)}
              renderLine={renderHighlightedLine}
            />
          </View>
        </View>
      </View>

      <View style={[styles.carouselArea, {width: screenW}]}>
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

        <View style={styles.kinoMetaWrap}>
          <Text style={styles.kinoName}>
            {KINOS[currentIndex]?.title}
          </Text>
          <Text style={styles.kinoTone}>
            {KINOS[currentIndex]?.tone}
          </Text>
        </View>

        <View style={styles.pagination}>
          {KINOS.map((k, idx) => {
            const active = idx === currentIndex;
            return (
              <View
                key={k.kinoType}
                style={[styles.dot, active && styles.dotActive]}
              />
            );
          })}
        </View>
      </View>
      <KinoConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onConfirm={handleKinoSelect}
      />
    </SelectionFrameLayout>
  );
}

/**
 * 줄바꿈을 확실히 먹이면서 애니메이션 페이드 유지
 * - 텍스트를 lines로 나눈 뒤
 * - "단일 Text 컨테이너" 안에서 줄별 렌더
 * - 줄 사이에는 '\n'을 그대로 넣어 RN이 라인 레이아웃을 안정적으로 계산하게 함
 */
function FadingKinoText({index, descriptions, renderLine}) {
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

  const rawText = descriptions?.[displayIndex] ?? '';
  const text = String(rawText)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n');
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <Animated.View style={{opacity: fade, transform: [{translateY}]}}>
      {paragraphs.map((paragraph, idx) => {
        const isLast = idx === paragraphs.length - 1;
        const isGreeting = idx === 0;
        return (
          <Text
            key={`p-${idx}`}
            lineBreakStrategyIOS="hangul-word"
            textBreakStrategy="highQuality"
            style={[
              isGreeting ? styles.kinoGreeting : styles.kinoText,
              !isLast ? styles.paraGap : null,
            ]}>
            {renderLine(paragraph)}
          </Text>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerBadge: {
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 999,
    marginBottom: getResponsiveHeight(10),
    backgroundColor: 'rgba(17,24,39,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
  },
  headerBadgeText: {
    fontSize: getResponsiveFontSize(10),
    letterSpacing: 1,
    color: '#374151',
    fontFamily: 'Pretendard-SemiBold',
  },

  textCard: {
    width: '96%',
    paddingVertical: getResponsiveHeight(18),
    paddingHorizontal: getResponsiveWidth(20),
    borderRadius: getResponsiveWidth(24),

    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9EE',

    marginTop: getResponsiveHeight(6),
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
    zIndex: 10,
  },
  bubbleWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(6),
  },
  textCardContent: {
    minHeight: getResponsiveHeight(94),
    justifyContent: 'center',
  },

  kinoGreeting: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: getResponsiveFontSize(23),
    color: '#111827',
  },
  kinoText: {
    fontSize: getResponsiveFontSize(14.5),
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveFontSize(21),
    color: '#1F2937',
  },
  paraGap: {
    marginBottom: getResponsiveHeight(10),
  },
  kinoHighlight: {
    fontFamily: 'Pretendard-Bold',
  },

  carouselArea: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveHeight(106),
    position: 'relative',
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

  character: {
    width: getResponsiveWidth(165),
    height: getResponsiveWidth(165),
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#E0D4C4',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  arrowIcon: {
    width: getResponsiveIconSize(18),
    height: getResponsiveIconSize(18),
    resizeMode: 'contain',
    tintColor: BUTTON_STYLES().saveBg,
  },

  kinoMetaWrap: {
    marginTop: getResponsiveHeight(8),
    alignItems: 'center',
  },
  kinoName: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(18),
    color: '#111827',
  },
  kinoTone: {
    marginTop: getResponsiveHeight(4),
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12.5),
    color: '#6B7280',
  },
  pagination: {
    flexDirection: 'row',
    gap: getResponsiveWidth(8),
    marginTop: getResponsiveHeight(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: getResponsiveWidth(8),
    height: getResponsiveWidth(8),
    borderRadius: 99,
    backgroundColor: 'rgba(107,114,128,0.28)',
  },
  dotActive: {
    width: getResponsiveWidth(22),
    backgroundColor: '#111827',
  },
});
