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

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';

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

const AVATAR = getResponsiveIconSize(92);
const CARD_RADIUS = getResponsiveIconSize(16);

// ✅ 레이아웃 흔들림 방지용
const SCALE_NO_EMOTION = 1.3;
const BASE_DISPLAY = AVATAR * SCALE_NO_EMOTION;
const BASE_RING = BASE_DISPLAY * 0.82;
const BASE_AREA = BASE_DISPLAY * 1.05;
const BASE_OVERLAP = -BASE_DISPLAY * 0.299;

export default function HeaderSection({user, onUserPress}) {
  const navigation = useNavigation();
  const {width: screenWidth} = useWindowDimensions();

  // ✅ MemberGridSection과 동일한 바깥 여백/안쪽 패딩
  const marginH = getResponsiveWidth(14);
  const paddingH = getResponsiveWidth(8);

  // ✅ MemberGridSection이 “보이는 폭”이랑 동일
  const containerWidth = screenWidth - marginH * 2;

  const rawEmotion = user?.emotion;
  const emotionKey = rawEmotion ? String(rawEmotion).toUpperCase() : null;
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
  const imageScale = hasEmotion ? 1 : SCALE_NO_EMOTION;

  return (
    <View style={[styles.headerContainer, {width: containerWidth}]}>
      {/* 프로필 (자리 고정) */}
      <View
        style={[
          styles.avatarArea,
          {
            width: BASE_AREA,
            height: BASE_AREA,
            marginBottom: BASE_OVERLAP,
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
              width: BASE_RING,
              height: BASE_RING,
              borderRadius: BASE_RING / 2,
            },
          ]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('감정상태화면')}
            style={[
              styles.avatarPress,
              {width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2},
            ]}>
            <Image
              source={profileSource}
              resizeMode="cover"
              style={[
                styles.profileImage,
                {
                  width: AVATAR,
                  height: AVATAR,
                  borderRadius: AVATAR / 2,
                  transform: [{scale: imageScale}],
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 카드 (MemberGridSection과 동일 폭/패딩 느낌) */}
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
          onPress={() => onUserPress?.(user)}
          style={[
            styles.headerCard,
            {
              paddingHorizontal: paddingH, // ✅ MemberGridSection과 동일
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
    backgroundColor: 'white',
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
