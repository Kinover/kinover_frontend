import React from 'react';
import {StyleSheet, View,Text,Image} from 'react-native';
import {useSelector} from 'react-redux';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../utils/responsive';

export default function FamilySettingScreen() {
  const family = useSelector(state => state.family);

  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        <View style={styles.textContainer}>
          <View style={styles.textBox}>
            <Text style={styles.sectorText}>가족명</Text>
            <Text style={styles.text}>|</Text>
            <Text style={styles.text}>{family.name}</Text>
          </View>
          <View style={styles.textBox}>
            <Text style={styles.sectorText}>가족코드</Text>
            <Text style={styles.text}>|</Text>
            <Text style={[styles.text,{fontSize:getResponsiveFontSize(12)}]}>{family.familyId}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingTop: getResponsiveHeight(40),
  },
  mainContainer: {
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(40),
    gap: getResponsiveHeight(20),
  },
  topContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveHeight(15),
  },

  textContainer: {
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: getResponsiveHeight(10),
  },

  textBox: {
    width: getResponsiveWidth(280),
    height: 'auto',
    minHeight:getResponsiveHeight(32),
    borderRadius: getResponsiveIconSize(30),
    borderColor: '#FFC84D',
    borderWidth: getResponsiveIconSize(1),
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical:getResponsiveHeight(4),
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
  },

  sectorText: {
    width: getResponsiveWidth(60),
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
    textAlign: 'center',
  },

  text: {
    maxWidth:getResponsiveWidth(160),
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
    textAlign: 'flex-start',
    flexWrap:'wrap'
  },

  bottomContainer: {
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: getResponsiveHeight(15),
  },

  button: {
    width: getResponsiveWidth(280),
    height: getResponsiveHeight(32),
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveIconSize(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
  },
});
