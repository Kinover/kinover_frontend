import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
} from '../../utils/responsive';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import { fetchFamilyThunk } from '../../redux/thunk/familyThunk';
import { fetchFamilyUserListThunk } from '../../redux/thunk/familyUserThunk';


export default function HomeScreen() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const navigation = useNavigation();

  useEffect(() => {
    if (user.userId !== null) {
      dispatch(fetchFamilyThunk('0f7eff1b-c4ad-43c5-90f6-e8b2f4ff5670'));
      dispatch(fetchFamilyUserListThunk('0f7eff1b-c4ad-43c5-90f6-e8b2f4ff5670'))
      console.log(user.userId);
      console.log(user.image);
    }
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{family.name}</Text>
        <Text style={styles.headerGrade}>
          패밀리님은
          <Text
            style={{
              fontFamily: 'Pretendard-Bold',
              fontSize: getResponsiveFontSize(25),
            }}>
            {` '${family.relationship}' `}
          </Text>
          예요!
        </Text>
        <Text
          style={styles.headerMore}
          onPress={() => {
            navigation.navigate('등급화면');
          }}>
          등급 자세히 보기
        </Text>
      </View>
      <View style={styles.mainContainer}>
        <View style={styles.banner}></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',

    backgroundColor: '#FFC84D',
  },

  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: getResponsiveWidth(40),
    paddingVertical: getResponsiveHeight(30),
    gap: getResponsiveIconSize(10),
  },

  headerTitle: {
    fontFamily: 'Pretendard-Bold', // 로드한 폰트를 지정
    fontSize: getResponsiveFontSize(32),
  },

  headerGrade: {
    fontFamily: 'Pretendard-Regular', // Regular 폰트 적용
    fontSize: getResponsiveFontSize(24),
  },

  headerMore: {
    fontFamily: 'Pretendard-Bold', // 로드한 폰트를 지정
    fontSize: getResponsiveFontSize(15),
    fontWeight: 'bold', // bold 스타일 적용
  },

  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
  },

  banner:{
    width:"100%",
    height:getResponsiveHeight(70),
    backgroundColor:'lightgray',
  },
});
