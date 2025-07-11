// 📁 components/CommentSection.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';

export default function CommentSection({
  commentList,
  commentText,
  onChangeComment,
  onSubmitComment,
  onCloseComment,
  user,
}) {
  return (
    <SafeAreaView style={styles.commentContainer}>
      <ScrollView
        style={styles.commentContentContainer}
        contentContainerStyle={{paddingBottom: getResponsiveHeight(60)}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}>
        {commentList.map(comment => (
          <View style={styles.commentBox} key={comment.commentId}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: getResponsiveWidth(10),
              }}>
              <Image
                style={styles.commentWriterImage}
                source={{uri: comment.authorImage}}
              />
              <Text style={styles.commentWriter}>{comment.authorName}</Text>
            </View>
            <Text style={styles.commentContent}>{comment.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="댓글 달고 추억 쌓기...."
          placeholderTextColor="#D9D9D9"
          value={commentText}
          onChangeText={onChangeComment}
          onSubmitEditing={onSubmitComment}
        />
        <TouchableOpacity onPress={onSubmitComment}>
          <Image
            style={styles.commentSendBt}
            source={require('../../../assets/icons/paperPlaneTilt.png')}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    zIndex: 5,
  },
  commentContentContainer: {
    width: '100%',
    // backgroundColor: 'white',
  },
  commentBox: {
    width: '100%',
    flexDirection: 'column',
    gap: getResponsiveWidth(10),
    paddingHorizontal: getResponsiveWidth(30),
    paddingVertical: getResponsiveWidth(8),
    alignItems: 'flex-start',
  },
  commentWriterImage: {
    width: getResponsiveWidth(36),
    height: getResponsiveWidth(36),
    borderRadius: getResponsiveWidth(18),
    backgroundColor: '#D9D9D9',
  },
  commentTextBox: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: getResponsiveHeight(2),
  },
  commentWriter: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14.5),
    color: '#000000',
  },
  commentContent: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13),
    color: '#000000',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    height: getResponsiveHeight(40),
    backgroundColor: 'white',
    paddingHorizontal: getResponsiveWidth(16),
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: getResponsiveWidth(10),
    position: 'absolute',
    bottom: '15%',
    alignSelf: 'center',
  },
  commentInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    paddingVertical: Platform.OS === 'android' ? getResponsiveHeight(5) : 0,
    paddingHorizontal: getResponsiveWidth(3),
    fontFamily: 'Pretendard-Regular',
  },
  commentSendBt: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    resizeMode: 'contain',
  },
});
