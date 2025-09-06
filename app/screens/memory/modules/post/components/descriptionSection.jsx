import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../../../utils/responsive';

export default function DescriptionSection({memory, onContentLayout}) {
  if (!memory) return null; // ✅ 데이터 아직이면 렌더 안 함

  return (
    <View
      style={{
        // backgroundColor: 'white',
        // borderTopWidth: 1,
        // borderTopLeftRadius: getResponsiveIconSize(30),
        // borderTopRightRadius: getResponsiveIconSize(30),
        // backgroundColor: 'white',
        // borderTopColor: 'white',
        // height:'100%',
      }}>
      <TouchableWithoutFeedback>
        <View style={styles.headerContainer}>
          <View style={styles.writer}>
            <Image
              style={styles.writerImage}
              source={{uri: memory.authorImage}}
            />
            <Text style={styles.writerName}>{memory.authorName}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
      <SafeAreaView style={styles.description}>
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={{paddingBottom: getResponsiveHeight(40)}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}>
          <Text style={styles.content} onLayout={onContentLayout}>
            {memory.content}
          </Text>
        </ScrollView>
        {/* <LinearGradient
          colors={['rgba(245, 245, 245, 0)', 'rgba(245, 245, 245, 1)']}
          style={styles.fadeOutGradient}
          pointerEvents="none"
        /> */}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },

  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: getResponsiveHeight(60),
    paddingHorizontal: getResponsiveWidth(30),
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0)',
    alignItems:'center',
    alignContent:'center',
  },
  writer: {
    flexDirection: 'row',
    flex: 1,
    alignContent: 'center',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },
  writerImage: {
    width:
      Platform.OS === 'ios' ? getResponsiveWidth(39) : getResponsiveWidth(36.5),
    height:
      Platform.OS === 'ios' ? getResponsiveWidth(39) : getResponsiveWidth(36.5),
    borderRadius: getResponsiveWidth(20),
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: getResponsiveWidth(0.25),
  },
  writerName: {
    color: 'black',
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(21)
        : getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Regular',
    textAlignVertical: 'center',
    lineHeight:getResponsiveHeight(40)
  },
  commentButton: {
    width: getResponsiveWidth(45),
    height: getResponsiveHeight(40),
    resizeMode: 'contain',
    marginRight: getResponsiveWidth(-5),
    marginBottom: getResponsiveHeight(-15),
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: getResponsiveWidth(30),
  },
  content: {
    color: 'black',
    fontFamily: 'Pretendard-Light',
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(17)
        : getResponsiveFontSize(15),
    paddingVertical: getResponsiveHeight(3),
    textAlignVertical: 'center',
  },
  commentCount: {
    position: 'absolute',
    right: getResponsiveWidth(20),
    bottom: getResponsiveHeight(2),
    fontSize: getResponsiveFontSize(13),
  },
});
