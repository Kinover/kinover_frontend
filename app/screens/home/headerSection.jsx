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
} from '../../utils/responsive';
import {useNavigation} from '@react-navigation/native';

export default function HeaderSection({user, onUserPress}) {
  const navigation = useNavigation();
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerBox}></View>
      <View style={{width: 'auto', position: 'relative'}}>
        <TouchableOpacity onPress={onUserPress}>
          <Image
            src={user.image}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.stateIcon}
          onPress={() => navigation.navigate('감정상태화면')}>
          <Text style={styles.questionMark}>?</Text>
        </TouchableOpacity>
      </View>
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
  },
  profileImage: {
    width: getResponsiveIconSize(130),
    height: getResponsiveIconSize(130),
    borderRadius: getResponsiveWidth(65),
  },
  stateIcon: {
    position: 'absolute',
    borderWidth: getResponsiveIconSize(1.4),
    width: getResponsiveIconSize(35),
    height: getResponsiveIconSize(35),
    borderRadius: getResponsiveIconSize(17.5),
    right: -5,
    bottom: getResponsiveHeight(5),
    backgroundColor: 'rgba(200, 200, 200, 0.6)',
    borderColor: 'gray',
    borderStyle: 'dashed',
  },
  questionMark: {
    color: '#747473',
    left: '35%',
    top: '15%',
    fontSize: getResponsiveFontSize(20),
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
