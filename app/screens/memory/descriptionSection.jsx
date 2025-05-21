// 📁 components/DescriptionSection.js
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';

export default function DescriptionSection({
  memory,
  commentList,
  onPressComment,
  onContentLayout,
}) {
  return (
    <>
      <TouchableWithoutFeedback>
        <View style={styles.headerContainer}>
          <View style={styles.writer}>
            <Image
              style={styles.writerImage}
              source={{uri: memory.authorImage}}
            />
            <Text style={styles.writerName}>{memory.authorName}</Text>
          </View>
          <TouchableOpacity onPress={onPressComment}>
            <Image
              style={styles.commentButton}
              source={require('../../assets/images/messageBubble.png')}
            />
            <Text style={styles.commentCount}>{commentList.length}</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
      <SafeAreaView style={styles.description}>
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={{paddingBottom: '10%'}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}>
          <Text style={styles.content} onLayout={onContentLayout}>
            {memory.content}
          </Text>
        </ScrollView>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
          style={styles.fadeOutGradient}
          pointerEvents="none"
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  description: {
    // flex: 1,
    width: '100%',
    height: 'auto',
    alignItems: 'center',
    // backgroundColor: 'rgba(255,255,255,0)', // ← 완전 투명
    backgroundColor: 'transparent',
    zIndex: 5,
    // backgroundColor:'pink',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  fadeOutGradient: {
    position: 'absolute',
    bottom: 0,
    height: '30%', // 흐릿하게 사라질 영역 높이
    width: '100%',
  },

  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: getResponsiveHeight(60),
    paddingHorizontal: getResponsiveWidth(10),
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0)', // ← 완전 투명
  },
  writer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },
  writerImage: {
    width: getResponsiveWidth(40),
    height: getResponsiveHeight(40),
    borderRadius: getResponsiveWidth(20),
    backgroundColor: 'white',
    borderColor: 'gray',
    borderWidth: getResponsiveWidth(0.5),
  },
  writerName: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Regular',
  },
  commentButton: {
    width: getResponsiveWidth(45),
    height: getResponsiveHeight(40),
    right: getResponsiveWidth(-5),
    resizeMode: 'contain',
    bottom: -15,
  },
  contentContainer: {
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    width: '100%',
    paddingHorizontal: getResponsiveWidth(10),
  },
  content: {
    color: 'black',
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(15),
    paddingVertical: getResponsiveWidth(5),
  },
  commentCount: {
    left: 20,
    bottom: 17.5,
  },
});
