// src/features/home/components/HeaderSection.jsx

import React from 'react';
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
import {Shadow} from 'react-native-shadow-2';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';

// 감정 이미지 매핑
const getEmotionImage = emotion => {
  switch (emotion) {
    case 'ANNOYED':
      return require('../../../assets/state/1.png');
    case 'WORRIED':
      return require('../../../assets/state/2.png');
    case 'DEPRESSED':
      return require('../../../assets/state/3.png');
    case 'SORRY':
      return require('../../../assets/state/4.png');
    case 'TIRED':
      return require('../../../assets/state/5.png');
    case 'NEUTRAL':
      return require('../../../assets/state/6.png');
    case 'HAPPY':
      return require('../../../assets/state/7.png');
    case 'EXCITED':
      return require('../../../assets/state/8.png');
    default:
      return null;
  }
};

const AVATAR = getResponsiveIconSize(95);
const CARD_RADIUS = getResponsiveIconSize(10);

export default function HeaderSection({user, onUserPress}) {
  const navigation = useNavigation();
  // ✅ 화면 기준 실제 픽셀 너비(예: 90%)
  const {width: SCREEN_WIDTH} = useWindowDimensions();

  const CARD_WIDTH = SCREEN_WIDTH * 0.875;

  const rawEmotion = user?.emotion;
  const emotionKey = rawEmotion ? String(rawEmotion).toUpperCase() : null;
  const emotionImage = emotionKey ? getEmotionImage(emotionKey) : null;

  const profileSource = user?.image
    ? {
        uri: user.image.startsWith('https')
          ? user.image
          : CLOUD_FRONT + user.image,
      }
    : require('../../../assets/images/default.png');

  return (
    <View style={styles.headerContainer}>
      {/* 프로필 이미지 + 감정 */}
      <View style={styles.imageWrapper}>
        {!!emotionImage && (
          <Image source={emotionImage} style={styles.emotionImage} />
        )}

        <TouchableOpacity onPress={() => navigation.navigate('감정상태화면')}>
          <Image
            source={profileSource}
            style={[
              styles.profileImage,
              emotionImage
                ? styles.profileImageWithEmotion
                : styles.profileImageWithoutEmotion,
            ]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      {/* 🔥 카드: 너비 숫자로 고정 */}
      <View style={styles.cardWrapper}>
        <Shadow
          distance={7}
          offset={[0, 0]}
          startColor="rgba(0,0,0,0.1)"
          endColor="rgba(15, 23, 42, 0.01)" // 바깥쪽으로 갈수록 옅어지게
          radius={CARD_RADIUS}
          style={[styles.shadowBox, {width: CARD_WIDTH}]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onUserPress?.(user)}
            style={styles.headerCard}>
            <Text style={styles.userNameHeader} numberOfLines={1}>
              {user?.name}
            </Text>

            <Text style={styles.trait} numberOfLines={1} ellipsizeMode="tail">
              {user?.trait || '이 사람을 한마디로 표현한다면?'}
            </Text>
          </TouchableOpacity>
        </Shadow>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    alignItems: 'center',
    width: '100%',
    marginTop: getResponsiveHeight(40),
    marginBottom: getResponsiveHeight(18),
  },

  imageWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: AVATAR * 1.22,
    height: AVATAR * 1.22,
    zIndex: 1,
    marginBottom: -AVATAR * 0.35,
  },

  emotionImage: {
    position: 'absolute',
    width: AVATAR * 1.55,
    height: AVATAR * 1.55,
    resizeMode: 'contain',
    bottom: 0,
    zIndex: 0,
  },

  profileImage: {
    borderRadius: 999,
    zIndex: 1,
  },
  profileImageWithEmotion: {
    width: AVATAR,
    height: AVATAR,
  },
  profileImageWithoutEmotion: {
    width: AVATAR * 1.3,
    height: AVATAR * 1.3,
  },

  // ✅ 카드 전체 래퍼: 화면 기준으로 고정 너비
  cardWrapper: {
    alignSelf: 'center',
  },

  // ✅ Shadow 안의 실제 박스
  shadowBox: {
    borderRadius: CARD_RADIUS,
    backgroundColor: 'white',
  },

  headerCard: {
    width: '100%',
    alignItems: 'center',
    paddingTop: getResponsiveHeight(45),
    paddingBottom: getResponsiveHeight(23),
    paddingHorizontal: getResponsiveWidth(10),
  },

  userNameHeader: {
    fontFamily: 'Pretendard-Medium',
    fontWeight: Platform.OS === 'ios' ? undefined : '600',
    fontSize: getResponsiveFontSize(18),
    color: 'black',
  },

  trait: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(14.5),
    marginTop: getResponsiveHeight(6),
    color: 'gray',
    textAlign: 'center',
  },
});
