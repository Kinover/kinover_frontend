import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Touchable,
  TouchableOpacity,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {useNavigation} from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function FamilySetupFinishScreen() {
  const navigation = useNavigation();
  const family=useSelector(state=>state.family);

  const handleButtonClick=()=>{
    navigation.navigate('Tabs')
  }
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text
          style={
            styles.headerTitle
          }>{`"${family.name}" 가족 모임에\n 추가되었어요!`}</Text>
      </View>

      <Image
        style={styles.mainImage}
        source={{
          // uri: 'https://i.postimg.cc/x8zj6zpJ/Group-1171276550.png',
          uri:'https://i.postimg.cc/43KyH0FN/Group-1171276550.jpg',
        }}></Image>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleButtonClick}>
          <Text style={styles.buttonText}>첫 글 쓰고 추억 남기러 가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'white',
    paddingTop: getResponsiveHeight(35),
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    justifyContent: 'center',
    gap: getResponsiveHeight(5),
    fontFamily:'Pretendard-Regular',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(25),
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily:'Pretendard-Regular',

  },
  mainImage: {
    width: getResponsiveIconSize(181),
    height: getResponsiveIconSize(181),
    marginTop: getResponsiveHeight(100),
  },
  buttonContainer: {},
  buttonContainer: {
    position: 'absolute',
    bottom: getResponsiveHeight(100),
    gap: getResponsiveHeight(10),
  },
  button: {
    backgroundColor: '#FFC84D',
    width: getResponsiveWidth(331),
    height: getResponsiveHeight(60),
    borderRadius: getResponsiveIconSize(10),
    justifyContent: 'center',
  },

  buttonText: {
    fontFamily:'Pretendard-Regular',
    fontSize: getResponsiveFontSize(15.6),
    textAlign: 'center',
  },
});
