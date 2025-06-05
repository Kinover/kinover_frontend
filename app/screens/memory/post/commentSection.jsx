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
      <View style={styles.commentHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onCloseComment}>
          <Image
            style={styles.back_bt}
            source={require('../../../assets/images/backbt.png')}
          />
        </TouchableOpacity>
        <View style={{height: '100%', justifyContent: 'center', width: '100%'}}>
          <Text style={styles.commentTitle}>댓글</Text>
        </View>
      </View>

      <ScrollView
        style={styles.commentContentContainer}
        contentContainerStyle={{paddingBottom: '10%'}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}>
        {commentList.map(comment => (
          <View style={styles.commentBox} key={comment.commentId}>
            <Image
              style={styles.commentWriterImage}
              source={{uri: comment.authorImage}}
            />
            <View style={styles.commentTextBox}>
              <Text style={styles.commentWriter}>{comment.authorName}</Text>
              <Text style={styles.commentContent}>{comment.content}</Text>
            </View>
            <Text style={styles.commentCreatedAt}>
              {comment.createdAt?.split('T')[0]}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <Image style={styles.commentInputImage} source={{uri: user.image}} />
        <TextInput
          style={styles.commentInput}
          placeholder="한마디 남기기.."
          value={commentText}
          onChangeText={onChangeComment}
          onSubmitEditing={onSubmitComment}
        />
        <TouchableOpacity onPress={onSubmitComment}>
          <Image
            style={styles.commentSendBt}
            source={require('../../../assets/images/comment-send-bt.png')}
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
    backgroundColor: 'white',
    zIndex: 5,
  },

  commentHeader: {
    width: '100%',
    height: '15%',
    // backgroundColor: 'pink',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:'#EDEDED'
  },

  commentContentContainer: {
    width: '100%',
    backgroundColor: '#EDEDED',
    borderTopColor: '#D3D3D3',
    borderTopWidth: 2,
    // height: '25%',
  },

  commentBox: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'row',
    // backgroundColor:'yellow',
    gap: getResponsiveWidth(10),
    paddingHorizontal: getResponsiveWidth(6),
    paddingVertical: getResponsiveWidth(6),
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  commentWriterImage: {
    width: getResponsiveWidth(42),
    height: getResponsiveHeight(42),
    borderRadius: getResponsiveHeight(20),
    // backgroundColor:'pink',
    borderColor: 'lightgray',
    borderWidth: 0.5,
    resizeMode: 'cover',
  },
  commentTextBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    top: getResponsiveHeight(3),
    width: '85%',
    gap: getResponsiveHeight(2),
  },
  commentWriter: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(15),
  },
  commentContent: {
    flexWrap: 'wrap',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13),
  },
  commentCreatedAt: {
    position: 'absolute',
    fontSize: getResponsiveFontSize(9),
    right: getResponsiveWidth(5),
    top: getResponsiveHeight(7.5),
    fontFamily: 'Pretendard-Light',
  },

  back_bt: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(20),
    resizeMode: 'contain',
  },

  commentInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // position: 'absolute',
    width: '100%',
    height: '20%',
    backgroundColor: '#D9D9D9',
    backgroundColor: 'white',

    bottom: '0',
    paddingHorizontal: getResponsiveWidth(17.5),
    gap: getResponsiveWidth(12),
  },
  commentInputImage: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    borderRadius: getResponsiveWidth(15),
    resizeMode: 'contain',
    backgroundColor: 'white',
    borderWidth: 0.1,
    resizeMode: 'cover',
  },
  commentInput: {
    width: '75%',
    height: Platform.OS === 'android' ? '70%' : '60%',
    borderBottomWidth: 0.5, // 언더바 두께
  },
  commentSendBt: {
    width: getResponsiveWidth(28),
    height: getResponsiveHeight(28),
    borderRadius: getResponsiveIconSize(14),
  },
});
