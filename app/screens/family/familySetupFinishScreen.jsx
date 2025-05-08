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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FamilySetupFinishScreen() {
  const navigation = useNavigation();
  const family=useSelector(state=>state.family);

  const handleButtonClick=()=>{
    navigation.navigate('Tabs')
  }
  return (
    <SafeAreaView style={styles.container} edges={['top,bottom,left,right']}>
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
        <TouchableOpacity style={styles.button} onPress={handleButtonClick}>
          <Text style={styles.buttonText}>가족에게 코드 공유하러 가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'white',
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    justifyContent: 'center',
    gap: getResponsiveHeight(5),
    fontFamily:'Pretendard-Regular',
    marginTop: getResponsiveHeight(135),

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
