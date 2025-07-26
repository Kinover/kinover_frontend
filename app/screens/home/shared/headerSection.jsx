// components/HeaderSection.tsx
import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';

export default function HeaderSection({user, onUserPress}) {
  const navigation = useNavigation();

  const getEmotionImage = emotion => {
    switch (emotion) {
      case 'annoyed':
        return require('../../../assets/state/1.png');
      case 'worried':
        return require('../../../assets/state/2.png');
      case 'sad':
        return require('../../../assets/state/3.png');
      case 'sorry':
        return require('../../../assets/state/4.png');
      case 'tired':
        return require('../../../assets/state/5.png');
      case null:
        return require('../../../assets/state/6.png');
      case 'happy':
        return require('../../../assets/state/7.png');
      case 'excited':
        return require('../../../assets/state/8.png');
      default:
        return require('../../../assets/state/6.png'); // ✅ 기본 감정
    }
  };

  const emotionImage = getEmotionImage(user.emotion);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.imageWrapper}>
        {emotionImage && (
          <Image source={emotionImage} style={styles.emotionImage} />
        )}
        <TouchableOpacity onPress={() => navigation.navigate('감정상태화면')}>
          <Image
            src={user.image}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => onUserPress(user)}
        style={styles.headerBox}
      />
      <Text style={styles.userNameHeader}>{user.name}</Text>
      <Text style={styles.trait}>
        {user.trait ? user.trait : '이 사람을 한마디로 표현한다면?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop:
      Platform.OS === 'android'
        ? -getResponsiveHeight(10)
        : getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(30),
    zIndex: 1,
    marginHorizontal: getResponsiveWidth(25),
  },
  headerBox: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 2,
    borderRadius: getResponsiveIconSize(10),
    width: '100%',
    height: getResponsiveHeight(160),
    zIndex: -5, // 배경으로 내려줌
  },
  imageWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveHeight(40),
  },
  emotionImage: {
    position: 'absolute',
    width: getResponsiveIconSize(160),
    height: getResponsiveIconSize(160),
    resizeMode: 'contain',
    top: -getResponsiveHeight(65),
    zIndex: 0, // 👈 프로필보다 뒤
  },
  profileImage: {
    width: getResponsiveIconSize(94),
    height: getResponsiveIconSize(94),
    borderRadius: getResponsiveWidth(47),
    zIndex: 1, // 👈 감정이미지보다 앞
  },
  userNameHeader: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(22),
    marginTop: getResponsiveHeight(15),
  },
  trait: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(16),
    marginVertical: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(20),
    color: 'gray',
  },
});
