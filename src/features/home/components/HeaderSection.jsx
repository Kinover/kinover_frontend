// src/features/home/components/HeaderSection.jsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {useNavigation} from '@react-navigation/native';

const AVATAR = getResponsiveIconSize(95);
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

export default function HeaderSection({user, onUserPress}) {
  const navigation = useNavigation();

  // 감정 이미지
  const rawEmotion = user?.emotion;
  const emotionKey = rawEmotion ? String(rawEmotion).toUpperCase() : null;
  const emotionImage = emotionKey ? getEmotionImage(emotionKey) : null;

  // 프로필 이미지 소스
  const profileSource = user?.image
    ? {
        uri: user.image.startsWith('https')
          ? user.image // kakao, full url 등
          : CLOUD_FRONT + user.image, // key면 CloudFront + key
      }
    : require('../../../assets/images/default.png');

  return (
    <View style={styles.headerContainer}>
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

      <TouchableOpacity
        onPress={() => onUserPress(user)}
        style={styles.headerBox}
      />

      <Text style={styles.userNameHeader}>{user?.name}</Text>
      <Text style={styles.trait} numberOfLines={1} ellipsizeMode="tail">
        {user?.trait || '이 사람을 한마디로 표현한다면?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(18),
    zIndex: 10,
    marginHorizontal: getResponsiveWidth(25),
  },
  headerBox: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderRadius: getResponsiveIconSize(10),
    width: '100%',
    height: getResponsiveHeight(135),
    zIndex: -5,
  },
  imageWrapper: {
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: getResponsiveHeight(30),
    width: AVATAR * 1.22,
    height: AVATAR * 1.22,
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
  userNameHeader: {
    fontFamily: 'Pretendard-Medium',
    fontWeight: Platform.OS === 'ios' ? undefined : '600',
    fontSize: getResponsiveFontSize(18),
    marginTop: getResponsiveHeight(12),
    color: 'black',
  },
  trait: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(14.5),
    marginTop: getResponsiveHeight(6),
    marginBottom: getResponsiveHeight(18),
    color: 'gray',
    textAlign: 'center',
  },
});
