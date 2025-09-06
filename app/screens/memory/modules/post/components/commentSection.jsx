import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  Animated,
  Keyboard,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../../../utils/responsive';
import {RectButton, Swipeable} from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';

const ACTION_W = getResponsiveWidth(70);

export default function CommentSection({
  commentList,
  commentText,
  onChangeComment,
  onSubmitComment,
  user,
  onDeleteComment,
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [isReady, setIsReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsReady(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, 200);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', e => {
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height,
        duration: e.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener('keyboardWillHide', e => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: e.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const renderRightActions = (commentId, progress) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [ACTION_W, 0],
      extrapolate: 'clamp',
    });
    const opacity = progress.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.6, 1],
      extrapolate: 'clamp',
    });
    const textScale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.rightActionContainer}>
        <Animated.View style={{flex: 1, transform: [{translateX}], opacity}}>
          <RectButton
            style={[styles.deleteAction, {flex: 1}]}
            onPress={() =>
              Alert.alert('삭제', '댓글을 삭제할까요?', [
                {text: '취소', style: 'cancel'},
                {
                  text: '삭제',
                  style: 'destructive',
                  onPress: () => onDeleteComment?.(commentId),
                },
              ])
            }>
            <Animated.Text
              style={[
                styles.deleteActionText,
                {transform: [{scale: textScale}]},
              ]}>
              삭제
            </Animated.Text>
          </RectButton>
        </Animated.View>
      </View>
    );
  };

  return (
    <Animated.View
      style={{position: 'relative', flex: 1, transform: [{translateY}]}}>
      {isReady && (
        <Animated.View style={{flex: 1, opacity: fadeAnim}}>
          {commentList.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {'아직 댓글이 없어요.\n첫 댓글을 남겨보세요!'}
              </Text>
            </View>
          )}
          <SafeAreaView style={styles.commentContainer}>
            <ScrollView
              style={styles.commentContentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled>
              {commentList.map(comment => {
                const isMyComment =
                  user?.userId != null &&
                  (comment.authorId === user.userId ||
                    comment.userId === user.userId);
                return (
                  <Swipeable
                    key={comment.commentId}
                    renderRightActions={progress =>
                      isMyComment
                        ? renderRightActions(comment.commentId, progress)
                        : null
                    }
                    enabled={!!isMyComment}
                    overshootRight={false}
                    friction={2}
                    rightThreshold={ACTION_W / 2}>
                    <View style={styles.commentBox}>
                      <View style={styles.headerRow}>
                        <View style={styles.authorRow}>
                          <FastImage
                            style={styles.commentWriterImage}
                            source={{uri: comment.authorImage}}
                          />
                          <View style={styles.textColumn}>
                            <Text style={styles.commentWriter}>
                              {comment.authorName}
                            </Text>
                            <Text style={styles.commentContent}>
                              {comment.content}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.timeText}>
                          {formatPreviewTime(comment.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </Swipeable>
                );
              })}
            </ScrollView>

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="댓글 달고 추억 쌓기...."
                placeholderTextColor="#D9D9D9"
                value={commentText}
                onChangeText={onChangeComment}
                onSubmitEditing={onSubmitComment}
                returnKeyType="send"
              />
              <TouchableOpacity onPress={onSubmitComment}>
                <FastImage
                  style={styles.commentSendBt}
                  source={require('../../../../../assets/icons/paperPlaneTilt.png')}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    flex: 1,
    marginTop: getResponsiveHeight(10),
    backgroundColor: '#F9F9F9',
  },
  commentContentContainer: {
    width: '100%',
    height: '100%',
  },
  commentBox: {
    paddingHorizontal: getResponsiveWidth(20),
    marginVertical: getResponsiveHeight(13),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // ✅ 이름은 항상 위쪽 고정
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  textColumn: {
    flexDirection: 'column',
    flexShrink: 1,
  },
  commentWriterImage: {
    width: getResponsiveWidth(34),
    height: getResponsiveWidth(34),
    borderRadius: getResponsiveWidth(17),
    backgroundColor: '#D9D9D9',
    marginRight: getResponsiveWidth(10),
  },
  commentWriter: {
    fontFamily: 'Pretendard-Regular',
    fontWeight: '600',
    fontSize: getResponsiveFontSize(15),
    color: '#000',
    marginBottom: getResponsiveHeight(2),
    lineHeight:getResponsiveHeight(20),
    textAlignVertical:'center',
  },
  commentContent: {
    flexShrink: 1,
    flexWrap: 'wrap',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13.5),
    color: '#000',
    lineHeight: 20,
  },
  timeText: {
    fontSize: getResponsiveFontSize(11),
    color: '#999',
    marginTop: 2,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: getResponsiveWidth(16),
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: getResponsiveWidth(10),
    marginTop: getResponsiveHeight(5),
    marginBottom: Platform.OS === 'android' ? getResponsiveHeight(30) : 0,
    height: getResponsiveHeight(50),
  },
  commentInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    paddingVertical: getResponsiveHeight(8),
  },
  commentSendBt: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    resizeMode: 'contain',
  },
  emptyContainer: {
    flex: 3,
    backgroundColor: '#F9F9F9',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: getResponsiveFontSize(14),
    color: '#C0C0C0',
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },
  rightActionContainer: {
    width: ACTION_W,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  deleteAction: {
    width: '100%',
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  deleteActionText: {
    color: '#FFF',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
  },
});

function formatPreviewTime(time) {
  if (!time) return '';

  const date = new Date(time);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours < 12 ? '오전' : '오후';

    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;

    return `${ampm} ${hours}:${minutes}`;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}
