import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../utils/responsive';

export default function Schedule({props}) {
  return (
    <View style={styles.container}>
      <Text style={styles.scheduleTitle}>
        <Text style={styles.scheduleTitleHighlight}>{props.name}</Text> 일정은{' '}
        <Text style={styles.scheduleTitleHighlight}>
          {`${props.schedules.length}개 `}
        </Text>
        있어요.
      </Text>

      {props.schedules.map((schedule, index) => (
        <View key={index} style={styles.scheduleElement}>
          <Text
            style={[
              styles.scheduleText,
              {
                width:
                  props.name === '가족'
                    ? getResponsiveWidth(260)
                    : getResponsiveWidth(260),
              },
            ]}>
            {schedule}
          </Text>
          <TouchableOpacity
            onPress={() => alert('Button Pressed')}
            style={styles.scheduleButton}>
            <Image
              style={styles.buttonIconMemo}
              source={{
                uri: 'https://i.postimg.cc/TYsZknFG/Group-485.png',
              }}
            />
            <Text style={styles.buttonText}>메모</Text>
          </TouchableOpacity>

          {/* {props.name === '가족' && (
            <TouchableOpacity
              onPress={() => alert('Button Pressed')}
              style={styles.scheduleButton}>
              <Image
                style={styles.buttonIconMemory}
                source={{
                  uri: 'https://i.postimg.cc/cJfC1xwg/Group-486.png',
                }}
              />
              <Text style={styles.buttonText}>추억 글쓰기</Text>
            </TouchableOpacity>
          )} */}
        </View>
      ))}

      <View style={styles.scheduleElement}>
        <TouchableOpacity style={styles.scheduleAddText}>
          <Text style={{fontSize:getResponsiveFontSize(15)}}>+ 일정을 추가하세요</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => alert('Button Pressed')}
          style={[styles.scheduleButton, {backgroundColor: '#D9D9D9'}]}>
          <Image
            style={styles.buttonIconMemo}
            source={{
              uri: 'https://i.postimg.cc/TYsZknFG/Group-485.png',
            }}
          />
          <Text style={styles.buttonText}>메모</Text>
        </TouchableOpacity>
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
    marginBottom: getResponsiveHeight(40),
  },

  scheduleContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scheduleTitle: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
    marginTop: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(25),
  },

  scheduleTitleHighlight: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(20),
  },

  scheduleElement: {
    flexDirection: 'row',
    width: getResponsiveWidth(340),
    justifyContent: 'center',
    paddingVertical: getResponsiveHeight(5),
    borderRadius: 10,
    gap: 13,
  },

  scheduleText: {
    width: 'auto', // 기본적으로 auto 적용
    // width: getResponsiveWidth(240),
    fontSize: getResponsiveFontSize(15),
    backgroundColor: '#FFC84D',
    borderRadius: 10,
    paddingLeft: 20,
    lineHeight: getResponsiveHeight(46.89),
  },

  scheduleAddText: {
    width: getResponsiveWidth(260), // 기본적으로 auto 적용
    fontSize: getResponsiveFontSize(15),
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
    paddingLeft: 20,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    lineHeight: getResponsiveHeight(46.89),
  },

  scheduleButton: {
    position: 'relative',
    backgroundColor: '#FFC84D',
    width: getResponsiveWidth(52),
    height: getResponsiveHeight(47),
    alignItems: 'center',
    borderRadius: 10,
  },

  buttonIconMemo: {
    position: 'absolute',
    bottom: getResponsiveHeight(20),
    width: getResponsiveWidth(18.84),
    height: getResponsiveHeight(20.48),
  },

  buttonIconMemory: {
    position: 'absolute',
    bottom: getResponsiveHeight(22),
    width: getResponsiveWidth(20),
    height: getResponsiveHeight(14.3),
  },

  buttonText: {
    position: 'absolute',
    bottom: getResponsiveHeight(10),
    fontSize: 10,
  },
});
