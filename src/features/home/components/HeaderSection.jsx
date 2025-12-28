// src/features/home/components/HeaderSection.jsx
import React, {useMemo} from 'react';
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

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';

/* =========================
 * ✅ Emotion Utils
 * ========================= */
const EMOTION_EXPIRE_MS = 24 * 60 * 60 * 1000;

function isEmotionValid(emotion, emotionUpdatedAt) {
  if (!emotion || !emotionUpdatedAt) return false;

  const updatedAt = new Date(emotionUpdatedAt).getTime();
  if (Number.isNaN(updatedAt)) return false;

  return Date.now() - updatedAt <= EMOTION_EXPIRE_MS;
}

const getEmotionImage = emotion => {
  switch (emotion) {
    case 'ANNOYED':
      return require('../../../assets/state2/1.png');
    case 'WORRIED':
      return require('../../../assets/state2/2.png');
    case 'DEPRESSED':
      return require('../../../assets/state2/3.png');
    case 'SORRY':
      return require('../../../assets/state2/4.png');
    case 'TIRED':
      return require('../../../assets/state2/5.png');
    case 'NEUTRAL':
      return require('../../../assets/state2/6.png');
    case 'HAPPY':
      return require('../../../assets/state2/7.png');
    case 'EXCITED':
      return require('../../../assets/state2/8.png');
    default:
      return null;
  }
};

const AVATAR = getResponsiveIconSize(92);
const CARD_RADIUS = getResponsiveIconSize(16);

// ===== 기존(레이아웃 고정용) =====
const BASE_DISPLAY = AVATAR * 1.3;
const BASE_RING = BASE_DISPLAY * 0.82; // 이모션 있을 때 링(작게 유지)
const BASE_AREA = BASE_DISPLAY * 1.05;
const BASE_OVERLAP = -BASE_DISPLAY * 0.299;

// ===== ✅ 여기만 조절하면 “훨씬 더 커짐” 정도 컨트롤 가능 =====
const NO_EMO_RING_SCALE = 1.45; // 링을 BASE_RING 대비 얼마나 키울지
const NO_EMO_AREA_SCALE = 1.05; // avatarArea(컨테이너)도 같이 키워주기
const NO_EMO_OVERLAP_SCALE = 1; // 카드 위로 더 튀어나오게

export default function HeaderSection({user, onUserPress}) {
  const navigation = useNavigation();
  const {width: screenWidth} = useWindowDimensions();

  const marginH = getResponsiveWidth(14);
  const paddingH = getResponsiveWidth(8);
  const containerWidth = screenWidth - marginH * 2;

  /* =========================
   * ✅ 감정 유효성 판단
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

  const nameText = user?.name || '이름';
  const traitText = user?.trait || '이 사람을 한마디로 표현한다면?';

  // ✅ 핵심: 감정 있으면 기존(작게), 감정 없으면 링/프로필 “확” 키움
  const ringSize = hasEmotion ? BASE_RING : BASE_RING * NO_EMO_RING_SCALE;
  const areaSize = hasEmotion ? BASE_AREA : BASE_AREA * NO_EMO_AREA_SCALE;
  // const overlap = hasEmotion ? BASE_OVERLAP : BASE_OVERLAP * NO_EMO_OVERLAP_SCALE;

  const overlap = BASE_OVERLAP;
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
      {/* 프로필 */}
      <View
        style={[
          styles.avatarArea,
          {
            width: areaSize,
            height: areaSize,
            marginBottom: overlap,
          },
        ]}>
        {!!emotionImage && (
          <Image
            source={emotionImage}
            style={[
              styles.emotionImage,
              {
                width: BASE_DISPLAY * 1.35,
                height: BASE_DISPLAY * 1.35,
              },
            ]}
          />
        )}

        <View
          style={[
            styles.avatarRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
            },
          ]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={goEmotion}
            style={[
              styles.avatarPress,
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
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 카드 */}
      <DropShadow
        style={[
          styles.shadowBox,
          {
            width: '100%',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 3},
            shadowOpacity: 0.12,
            shadowRadius: 5,
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handleCardPress}
          style={[
            styles.headerCard,
            {
              paddingHorizontal: paddingH,
              borderRadius: CARD_RADIUS,
              backgroundColor: '#FFFFFF',
            },
          ]}>
          <Text style={styles.userNameHeader} numberOfLines={1}>
            {nameText}
          </Text>

          <Text style={styles.trait} numberOfLines={2} ellipsizeMode="tail">
            {traitText}
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
  emotionImage: {
    position: 'absolute',
    resizeMode: 'contain',
    bottom: 0,
    zIndex: 0,
    opacity: 0.95,
  },
  avatarRing: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPress: {
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    zIndex: 1,
  },
  shadowBox: {
    borderRadius: CARD_RADIUS,
    backgroundColor: 'transparent',
  },
  headerCard: {
    width: '100%',
    alignItems: 'center',
    paddingTop: getResponsiveHeight(46),
    paddingBottom: getResponsiveHeight(22),
  },
  userNameHeader: {
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: Platform.OS === 'ios' ? undefined : '700',
    fontSize: getResponsiveFontSize(20),
    color: '#111827',
    letterSpacing: -0.2,
  },
  trait: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
    marginTop: getResponsiveHeight(8),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(20),
  },
});
