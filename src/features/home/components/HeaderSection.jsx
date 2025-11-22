import React, {useEffect, useState} from 'react';
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

const AVATAR = getResponsiveIconSize(95); // 🔹 110 → 95 (살짝만 축소)
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

  // 🔹 마지막으로 유효했던 프로필 이미지 URL 저장
  const [lastImageUrl, setLastImageUrl] = useState(null);

  useEffect(() => {
    if (!user?.image) return;

    const raw = user.image;
    const resolved = raw.startsWith('http') ? raw : CLOUD_FRONT + raw;
    setLastImageUrl(resolved);
  }, [user?.image]);

  // 감정 상태 유효 시간 체크
  let finalEmotion = user?.emotion;
  if (!user?.emotionUpdatedAt) {
    finalEmotion = null;
  } else {
    const updatedTime = new Date(user.emotionUpdatedAt).getTime();
    const now = Date.now();
    if (isNaN(updatedTime) || now - updatedTime > 24 * 60 * 60 * 1000) {
      finalEmotion = null;
    }
  }
  const emotionImage = finalEmotion ? getEmotionImage(finalEmotion) : null;

  // 🔹 실제로 사용할 프로필 이미지 소스
  const profileSource = lastImageUrl
    ? {uri: lastImageUrl}
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
      <Text style={styles.trait}>
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
