// src/features/home/components/HeaderSection.jsx
import React, {useMemo, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {useNavigation} from '@react-navigation/native';
import DropShadow from 'react-native-drop-shadow';
import {hapticLight} from '../../../utils/haptic';
import {getEmotionImage} from '../utils/emotionUtils';
import {COLORS, DEFAULT_STYLE, LAYOUT_STYLE} from 'styles/style';

// ✅ reanimated
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';
const EMOTION_EXPIRE_MS = 24 * 60 * 60 * 1000;

function isEmotionValid(emotion, emotionUpdatedAt) {
  if (!emotion || !emotionUpdatedAt) return false;
  const t = new Date(emotionUpdatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= EMOTION_EXPIRE_MS;
}

const AVATAR = getResponsiveIconSize(92);
const CARD_RADIUS = getResponsiveIconSize(16);

// ===== base sizes =====
const BASE_DISPLAY = AVATAR * 1.3;
const BASE_RING = BASE_DISPLAY * 1.15;
const BASE_AREA = BASE_DISPLAY * 1.05;
const BASE_OVERLAP = -BASE_DISPLAY * 0.299;

export default function HeaderSection({user, onUserPress}) {
  const navigation = useNavigation();
  const {width: screenWidth} = useWindowDimensions();

  const containerWidth = screenWidth - LAYOUT_STYLE.screenPaddingHorizontal * 2;

  /** =========================
   * ✅ 감정 판단
   * ========================= */
  const emotionKey = useMemo(() => {
    if (!isEmotionValid(user?.emotion, user?.emotionUpdatedAt)) return null;
    return String(user.emotion).toUpperCase();
  }, [user?.emotion, user?.emotionUpdatedAt]);

  const emotionImage = emotionKey ? getEmotionImage(emotionKey) : null;
  const hasEmotion = !!emotionImage;

  const profileSource = useMemo(() => {
    return user?.image
      ? {
          uri: user.image.startsWith('https')
            ? user.image
            : CLOUD_FRONT + user.image,
        }
      : require('../../../assets/images/default.png');
  }, [user?.image]);

  /** =========================
   * ✅ 사이즈
   * ========================= */
  const ringSize = BASE_RING;
  const areaSize = BASE_AREA;
  const overlap = BASE_OVERLAP;

  /** =========================
   * ✅ emotion peek 애니메이션 (위랑 동일)
   * ========================= */
  const emotionPeek = useSharedValue(0);
  const pressedRef = useRef(false);

  const PEEK_IN = 140;
  const PEEK_OUT = 180;

  const peekDistance = ringSize * 0.72;

  const emotionPeekStyle = useAnimatedStyle(() => ({
    transform: [{translateY: -emotionPeek.value * peekDistance}],
  }));

  // 랜덤 peek
  useEffect(() => {
    if (!hasEmotion) return;

    let mounted = true;
    let t1 = null;
    let t2 = null;

    const loop = () => {
      if (!mounted) return;

      const delay = 3000 + Math.random() * 4000;
      t1 = setTimeout(() => {
        if (!mounted || pressedRef.current) {
          loop();
          return;
        }

        if (Math.random() > 0.25) {
          loop();
          return;
        }

        cancelAnimation(emotionPeek);
        emotionPeek.value = withTiming(1, {duration: PEEK_IN});

        t2 = setTimeout(() => {
          if (!mounted) return;
          cancelAnimation(emotionPeek);
          emotionPeek.value = withTiming(0, {duration: PEEK_OUT});
          loop();
        }, 700);
      }, delay);
    };

    loop();

    return () => {
      mounted = false;
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      cancelAnimation(emotionPeek);
    };
  }, [hasEmotion, emotionPeek]);

  const handlePressIn = () => {
    if (!hasEmotion) return;
    pressedRef.current = true;
    cancelAnimation(emotionPeek);
    emotionPeek.value = withTiming(1, {duration: PEEK_IN});
  };

  const handlePressOut = () => {
    pressedRef.current = false;
    if (!hasEmotion) return;
    cancelAnimation(emotionPeek);
    emotionPeek.value = withTiming(0, {duration: PEEK_OUT});
  };

  const goEmotion = () => {
    hapticLight();
    navigation.navigate('감정상태화면');
  };

  const handleCardPress = () => {
    hapticLight();
    onUserPress?.(user);
  };

  return (
    <View style={[styles.headerContainer, {width: containerWidth}]}>
      {/* 프로필 영역 */}
      <TouchableOpacity
                activeOpacity={1}
                onPress={goEmotion}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
        style={[
          styles.avatarArea,
          {
            width: areaSize,
            height: areaSize,
            marginBottom: overlap,
          },
        ]}>
        {/* ✅ 감정 peek 마스크 */}
        {hasEmotion && (
          <View
            style={[
              styles.emotionPeekMask,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
              },
            ]}>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -ringSize,
                },
                emotionPeekStyle,
              ]}>
              <Image
                source={emotionImage}
                style={[
                  styles.emotionImage,
                  {width: ringSize, height: ringSize},
                ]}
              />
            </Animated.View>
          </View>
        )}

        {/* 프로필 링 */}
        <View

          style={[
            styles.avatarPress,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
            },
          ]}>
          <View
            style={[
              styles.avatarRing,
              {
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
              },
            ]}>
            <Image
              source={profileSource}
              resizeMode="cover"
              style={[
                styles.profileImage,
                {
                  width: ringSize,
                  height: ringSize,
                  borderRadius: ringSize / 2,
                  borderColor: 'white',
                  borderWidth: 2,
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* 카드 */}
      <DropShadow style={styles.shadowBox}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handleCardPress}
          style={styles.headerCard}>
          <Text style={styles.userNameHeader} numberOfLines={1}>
            {user?.name || '이름'}
          </Text>
          <Text style={styles.trait} numberOfLines={2}>
            {user?.trait || '이 사람을 한마디로 표현한다면?'}
          </Text>
        </TouchableOpacity>
      </DropShadow>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: getResponsiveHeight(34),
    marginBottom: getResponsiveHeight(16),
  },

  avatarArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 3,
  },

  avatarRing: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarPress: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileImage: {
    zIndex: 1,
  },

  // ✅ 감정 마스크 (프로필 원 기준으로 잘림)
  emotionPeekMask: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  emotionImage: {
    resizeMode: 'contain',
  },

  shadowBox: {
    width: '100%',
    borderRadius: CARD_RADIUS,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },


  headerCard: {
    width: '100%',
    alignItems: 'center',
    paddingTop: getResponsiveHeight(46),
    paddingBottom: getResponsiveHeight(22),
    paddingHorizontal: getResponsiveWidth(8),
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
  },

  userNameHeader: {
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? undefined : '700',
    fontSize: DEFAULT_STYLE.sectionTitle.fontSize,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },

  trait: {
    fontFamily: DEFAULT_STYLE.sectionSubtitle.fontFamily,
    fontSize: getResponsiveHeight(12),
    marginTop: getResponsiveHeight(4),
    color: DEFAULT_STYLE.sectionSubtitle.color,
    textAlign: 'center',
    lineHeight: DEFAULT_STYLE.sectionSubtitle.fontSize + 1,
  },
});
