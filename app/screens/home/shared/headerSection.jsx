// components/HeaderSection.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {useNavigation} from '@react-navigation/native';

const CLOUD_FRONT = 'https://dzqa9jgkeds0b.cloudfront.net/';

export default function HeaderSection({user, onUserPress}) {
  const navigation = useNavigation();

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
        return require('../../../assets/state/6.png');
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
            source={
              user?.image
                ? {
                    uri: user.image.startsWith('http')
                      ? user.image
                      : CLOUD_FRONT + user.image,
                  }
                : require('../../../assets/images/default.png')
            }
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
        {user?.trait || '이 사람을 한마디로 표현한다면?'}
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
        ? -getResponsiveHeight(-25)
        : getResponsiveHeight(25),
    marginBottom:
      Platform.OS === 'android'
        ? getResponsiveHeight(20)
        : getResponsiveHeight(25),
    zIndex: 10,
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
    zIndex: -5,
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
    zIndex: 0,
  },
  profileImage: {
    width: getResponsiveIconSize(94),
    height: getResponsiveIconSize(94),
    borderRadius: getResponsiveWidth(47),
    zIndex: 1,
  },
  userNameHeader: {
    fontFamily: 'Pretendard-Medium',
    fontWeight: '600',
    fontSize: getResponsiveFontSize(22),
    marginTop: getResponsiveHeight(15),
    color: 'black',
  },
  trait: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(16),
    marginVertical: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(20),
    color: 'gray',
  },
});
